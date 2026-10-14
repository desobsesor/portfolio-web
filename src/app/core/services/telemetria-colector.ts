import { telemetriaActiva } from './telemetria-activa';

/** Ruta del receptor en el servidor Express. */
export const RUTA_ENVIO = '/api/telemetria';
/** Cada cuánto se manda un lote. */
const CADA_ENVIO = 15_000;
/** Resolución del acumulador de tiempo de lectura. */
const TIC = 250;
/** Versión del contrato (debe coincidir con el servidor). */
const VERSION_LOTE = 1;
const VERSION_AVISO = 1;
/** Tope de texto libre en etiquetas. */
const MAX_TEXTO = 120;

/** Secciones observables: una por ruta del portafolio + el pie. */
const OBSERVABLES: Array<{ id: string; selector: string; etiqueta: string }> = [
  { id: 'inicio', selector: '.home-container', etiqueta: 'Inicio' },
  { id: 'about', selector: '.about-container', etiqueta: 'Acerca de' },
  { id: 'projects', selector: '.projects-container', etiqueta: 'Proyectos' },
  { id: 'contact', selector: '.contact-container', etiqueta: 'Contacto' },
  { id: 'analytics', selector: '.analytics-container', etiqueta: 'Analítica' },
  { id: 'pie', selector: 'app-footer', etiqueta: 'Pie' },
];

export interface Control {
  href: string;
  clases: string[];
  descarga: boolean;
  ancla: string;
}

type Regla = { objetivo: string; encaja: (control: Control) => boolean };

/** Reglas en orden: gana la primera. El CV (PDF) va antes que github/portfolio. */
const REGLAS: Regla[] = [
  { objetivo: 'whatsapp', encaja: (c) => /wa\.me|whatsapp/i.test(c.href) },
  { objetivo: 'telefono', encaja: (c) => c.href.startsWith('tel:') },
  { objetivo: 'correo', encaja: (c) => c.href.startsWith('mailto:') },
  { objetivo: 'tarjeta-vcf', encaja: (c) => c.descarga },
  { objetivo: 'cv', encaja: (c) => /\.pdf(\?|#|$)/i.test(c.href) },
  { objetivo: 'github', encaja: (c) => c.href.includes('github.com') },
  { objetivo: 'red-social', encaja: (c) => /linkedin|instagram|youtube|facebook/i.test(c.href) },
  { objetivo: 'portafolio', encaja: (c) => c.href.includes('portfolio') },
  { objetivo: 'contacto-envio', encaja: (c) => c.clases.includes('submit-button') },
];

export function clasificarClic(control: Control): string | null {
  const regla = REGLAS.find((r) => r.encaja(control));
  if (regla) return regla.objetivo;
  return control.ancla ? `ancla-${control.ancla}` : null;
}

function controlDe(nodo: Element): Control {
  const ancla = nodo instanceof HTMLAnchorElement ? nodo : null;
  return {
    href: ancla?.getAttribute('href') ?? '',
    clases: [...nodo.classList],
    descarga: ancla?.hasAttribute('download') ?? false,
    ancla: ancla ? ancla.hash.replace(/^#/, '') : '',
  };
}

function zonaHoraria(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

interface Medicion {
  id: string;
  etiqueta: string;
  ms: number;
  veces: number;
  primera: number;
}

export interface OpcionesColector {
  alPedirAviso?: () => void;
  alFallar?: (error: unknown) => void;
}

function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function identificarEntorno(): { navegador: string; so: string } {
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'otro';
  const so = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'otro';
  return { navegador, so };
}

function leerNavegacion(): { referente: string; entrada: string; utm: Record<string, string> } {
  const parametros = new URLSearchParams(window.location.search);
  const utm = {
    fuente: parametros.get('utm_source') ?? '',
    medio: parametros.get('utm_medium') ?? '',
    campania: parametros.get('utm_campaign') ?? '',
    contenido: parametros.get('utm_content') ?? '',
    termino: parametros.get('utm_term') ?? '',
  };
  const referente = document.referrer;
  let entrada = 'directo';
  if (utm.fuente) entrada = 'campania';
  else if (/wa\.me|whatsapp/i.test(referente)) entrada = 'whatsapp';
  else if (/linkedin|instagram|youtube|facebook/i.test(referente)) entrada = 'red-social';
  else if (referente && !referente.includes(window.location.hostname)) entrada = 'referente';
  else if (referente) entrada = 'interna';
  return { referente: referente.slice(0, 200), entrada, utm };
}

/** Lee un valor del almacenamiento sin que un modo privado lo tumbe. */
function leerAlmacen(almacen: Storage, clave: string): string | null {
  try {
    return almacen.getItem(clave);
  } catch {
    return null;
  }
}

function escribirAlmacen(almacen: Storage, clave: string, valor: string): void {
  try {
    almacen.setItem(clave, valor);
  } catch {
    /* Sin almacenamiento la visita se cuenta igual, sólo no se reúne. */
  }
}

/** Texto visible de un control, recortado. */
function etiquetaDe(nodo: Element): string {
  const bruto = nodo.textContent ?? nodo.getAttribute('aria-label') ?? '';
  return bruto.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXTO);
}

/**
 * Sección a la que pertenece un nodo. Como el portafolio es una SPA por rutas,
 * la sección principal sale de la ruta actual; el pie y la cabecera se
 * reconocen por su etiqueta.
 */
function seccionDe(nodo: Element): string {
  const ruta = window.location.pathname.replace(/^\/portfolio-web\//, '/').replace(/\/$/, '');
  const porRuta: Record<string, string> = {
    '': 'inicio',
    '/': 'inicio',
    '/about': 'about',
    '/projects': 'projects',
    '/contact': 'contact',
    '/analytics': 'analytics',
  };
  const base = porRuta[ruta] ?? porRuta[window.location.pathname] ?? 'pagina';
  const contenedor = nodo.closest('section, app-footer, app-header');
  if (!contenedor) return base;
  if (contenedor.tagName.toLowerCase() === 'app-footer') return 'pie';
  if (contenedor.tagName.toLowerCase() === 'app-header') return 'cabecera';
  return base;
}

export class Colector {
  private readonly sesionId: string;
  private readonly visitanteId: string;
  private readonly t0: number;
  private readonly opciones: OpcionesColector;
  private readonly mediciones = new Map<string, Medicion>();
  private readonly enFoco = new Set<string>();
  private eventos: { tipo: 'clic'; objetivo: string; etiqueta: string; seccion: string; delta: number }[] = [];
  private profundidad = 0;
  private interacciones = 0;
  private observador: IntersectionObserver | null = null;
  private tic: ReturnType<typeof setInterval> | null = null;
  private envio: ReturnType<typeof setInterval> | null = null;
  private arrancado = false;

  private constructor(opciones: OpcionesColector) {
    this.opciones = opciones;
    let sesion = leerAlmacen(sessionStorage, 'portfolio-telemetria-sesion');
    if (!sesion) {
      sesion = uuid();
      escribirAlmacen(sessionStorage, 'portfolio-telemetria-sesion', sesion);
    }
    let visitante = leerAlmacen(localStorage, 'portfolio-telemetria-visitante');
    if (!visitante) {
      visitante = uuid();
      escribirAlmacen(localStorage, 'portfolio-telemetria-visitante', visitante);
    }
    this.sesionId = sesion;
    this.visitanteId = visitante;
    this.t0 = Date.now();
  }

  static arrancar(opciones: OpcionesColector = {}): Colector | null {
    if (!telemetriaActiva()) return null;
    if (typeof window === 'undefined') return null;
    if (typeof IntersectionObserver === 'undefined') return null;
    const conGpc = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (navigator.doNotTrack === '1' || conGpc.globalPrivacyControl === true) return null;
    if (/bot|crawler|spider|crawling|headless|lighthouse|pingdom/i.test(navigator.userAgent)) {
      return null;
    }
    const colector = new Colector(opciones);
    colector.iniciar();
    return colector;
  }

  static avisoVistoCheck(): boolean {
    try {
      return leerAlmacen(localStorage, 'portfolio-telemetria-aviso') === String(VERSION_AVISO);
    } catch {
      return false;
    }
  }

  static cerrarAviso(): void {
    try {
      escribirAlmacen(localStorage, 'portfolio-telemetria-aviso', String(VERSION_AVISO));
    } catch {
      /* Sin almacenamiento no hay aviso persistente. */
    }
  }

  avisoVisto(): boolean {
    return Colector.avisoVistoCheck();
  }

  /**
   * Re-observa las secciones tras un navegado de la SPA.
   *
   * Angular remonta las rutas sin recargar la página: los nodos observados se
   * destruyen y los nuevos no están vigilados, así que el tiempo de lectura se
   * perdería a partir del primer cambio de ruta. Las mediciones acumuladas se
   * conservan a propósito: el lote cuenta el recorrido entero de la visita.
   */
  reobservar(): void {
    if (!this.arrancado) return;
    this.enFoco.clear();
    this.observador?.disconnect();
    this.observador = null;
    this.observarSecciones();
    this.alDesplazar();
  }

  /**
   * Deja constancia de una partida del juego de palabras.
   *
   * Va como un evento más del lote (`objetivo: 'arcade'`) para no tocar el contrato
   * del servidor: el marcador viaja en la etiqueta con la forma
   * `score=…;palabras=…;segundos=…;usuario=…`, que es legible y se puede parsear.
   */
  anotarPartida(datos: { puntos: number; palabras: number; segundos: number; usuario: string }): void {
    if (!this.arrancado) return;
    const usuario = (datos.usuario ?? '').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Invitado';
    const etiqueta = [
      `score=${Math.max(0, Math.floor(datos.puntos))}`,
      `palabras=${Math.max(0, Math.floor(datos.palabras))}`,
      `segundos=${Math.max(0, Math.floor(datos.segundos))}`,
      `usuario=${usuario}`,
    ].join(';');

    this.eventos.push({
      tipo: 'clic',
      objetivo: 'arcade',
      etiqueta: etiqueta.slice(0, MAX_TEXTO),
      seccion: 'arcade',
      delta: Date.now() - this.t0,
    });
    this.enviar();
  }

  private iniciar(): void {
    if (this.arrancado) return;
    this.arrancado = true;
    this.observarSecciones();
    this.observarDesplazamiento();
    this.observarClics();
    this.tic = setInterval(() => this.acumular(), TIC);
    this.envio = setInterval(() => this.enviar(), CADA_ENVIO);
    window.addEventListener('pagehide', this.alIrse);
    document.addEventListener('visibilitychange', this.alEsconder);
    this.enviar();
    this.pedirAviso();
  }

  private observarSecciones(): void {
    const nodos: Array<{ medida: Medicion; nodo: Element }> = [];
    for (const observable of OBSERVABLES) {
      const nodo = document.querySelector(observable.selector);
      if (!nodo) continue;
      const existente = this.mediciones.get(observable.id);
      const medida: Medicion = existente ?? {
        id: observable.id,
        etiqueta: observable.etiqueta,
        ms: 0,
        veces: 0,
        primera: 0,
      };
      this.mediciones.set(medida.id, medida);
      nodos.push({ medida, nodo });
    }
    if (nodos.length === 0) return;
    this.observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const medida = nodos.find((par) => par.nodo === entrada.target)?.medida;
          if (!medida) continue;
          if (entrada.isIntersecting) {
            if (!this.enFoco.has(medida.id)) {
              this.enFoco.add(medida.id);
              medida.veces += 1;
              if (medida.primera === 0) medida.primera = Date.now() - this.t0;
            }
          } else {
            this.enFoco.delete(medida.id);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    nodos.forEach(({ nodo }) => this.observador?.observe(nodo));
  }

  private acumular(): void {
    for (const id of this.enFoco) {
      const medida = this.mediciones.get(id);
      if (medida) medida.ms += TIC;
    }
  }

  private alDesplazar = (): void => {
    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const actual = recorrido > 0 ? Math.min(1, window.scrollY / recorrido) : 1;
    if (actual > this.profundidad) this.profundidad = actual;
  };

  private observarDesplazamiento(): void {
    this.alDesplazar();
    window.addEventListener('scroll', this.alDesplazar, { passive: true });
  }

  private alClic = (evento: MouseEvent): void => {
    const origen = evento.target;
    if (!(origen instanceof Element)) return;
    const control = origen.closest('a, button');
    if (!control) return;
    const objetivo = clasificarClic(controlDe(control));
    if (!objetivo) return;
    this.eventos.push({
      tipo: 'clic',
      objetivo,
      etiqueta: etiquetaDe(control),
      seccion: seccionDe(control),
      delta: Date.now() - this.t0,
    });
    this.interacciones += 1;
    if (!objetivo.startsWith('ancla-')) this.enviar();
  };

  private observarClics(): void {
    document.addEventListener('click', this.alClic, true);
  }

  private alIrse = (): void => this.enviar();
  private alEsconder = (): void => {
    if (document.visibilityState === 'hidden') this.enviar();
  };

  private enviar(): void {
    if (!this.arrancado) return;
    if (this.eventos.length === 0 && Date.now() - this.t0 < CADA_ENVIO) return;
    const lote = {
      v: VERSION_LOTE,
      sesionId: this.sesionId,
      visitanteId: this.visitanteId,
      t0: this.t0,
      duracionMs: Date.now() - this.t0,
      profundidad: Math.round(this.profundidad * 1000) / 1000,
      interacciones: this.interacciones,
      dispositivo: {
        ancho: window.innerWidth,
        alto: window.innerHeight,
        dpr: Math.min(10, Math.floor(window.devicePixelRatio || 1)),
        pantallaAncho: window.screen.width,
        pantallaAlto: window.screen.height,
        tactil: navigator.maxTouchPoints > 0,
        idioma: navigator.language,
        zona: zonaHoraria(),
        ...identificarEntorno(),
      },
      navegacion: leerNavegacion(),
      secciones: [...this.mediciones.values()]
        .filter((m) => m.ms > 0 || m.veces > 0)
        .map(({ id, etiqueta, ms, veces, primera }) => ({ id, etiqueta, ms, veces, primera })),
      eventos: this.eventos,
      aviso: { v: VERSION_AVISO, visto: this.avisoVisto() },
    };
    this.eventos = [];
    const cuerpo = JSON.stringify(lote);
    try {
      if (typeof navigator.sendBeacon === 'function') {
        const bloque = new Blob([cuerpo], { type: 'application/json' });
        if (navigator.sendBeacon(RUTA_ENVIO, bloque)) return;
      }
      void fetch(RUTA_ENVIO, {
        method: 'POST',
        body: cuerpo,
        headers: { 'content-type': 'application/json' },
        keepalive: true,
        credentials: 'omit',
      }).catch((error) => this.opciones.alFallar?.(error));
    } catch (error) {
      this.opciones.alFallar?.(error);
    }
  }

  private pedirAviso(): void {
    if (this.avisoVisto()) return;
    setTimeout(() => {
      if (!this.arrancado) return;
      if (this.avisoVisto()) return;
      this.opciones.alPedirAviso?.();
    }, 12_000);
  }

  detener(): void {
    if (!this.arrancado) return;
    this.arrancado = false;
    if (this.tic !== null) clearInterval(this.tic);
    if (this.envio !== null) clearInterval(this.envio);
    this.tic = null;
    this.envio = null;
    this.observador?.disconnect();
    this.observador = null;
    window.removeEventListener('pagehide', this.alIrse);
    window.removeEventListener('scroll', this.alDesplazar);
    document.removeEventListener('visibilitychange', this.alEsconder);
    document.removeEventListener('click', this.alClic, true);
    this.enviar();
  }
}