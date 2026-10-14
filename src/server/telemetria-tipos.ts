/** Versión del contrato. Sube si cambia la forma del lote. */
export const VERSION_LOTE = 1;

/** Versión del texto del aviso. Subirla vuelve a mostrar el aviso a todos. */
export const VERSION_AVISO = 1;

/** Topes de saneamiento. Protegen la cuenta gratuita de Atlas de lotes enormes. */
export const LIMITES = {
  eventos: 60,
  secciones: 24,
  texto: 120,
  bytes: 96 * 1024,
  antiguedadMs: 24 * 60 * 60 * 1000,
} as const;

/** Un clic del visitante sobre algo que indica intención. */
export interface EventoCrudo {
  tipo: 'clic';
  objetivo: string;
  etiqueta: string;
  seccion: string;
  delta: number;
}

/** Tiempo de lectura acumulado de una sección. */
export interface SeccionCruda {
  id: string;
  etiqueta: string;
  ms: number;
  veces: number;
  primera: number;
}

/** Datos del navegador y de la pantalla. Nada de esto identifica a nadie. */
export interface Dispositivo {
  ancho: number;
  alto: number;
  dpr: number;
  pantallaAncho: number;
  pantallaAlto: number;
  tactil: boolean;
  idioma: string;
  zona: string;
  navegador: string;
  so: string;
}

/** Cómo llegó el visitante. */
export interface Navegacion {
  referente: string;
  entrada: string;
  utm: { fuente: string; medio: string; campania: string; contenido: string; termino: string };
}

/** El lote que manda el navegador. */
export interface Lote {
  v: number;
  sesionId: string;
  visitanteId: string;
  t0: number;
  duracionMs: number;
  profundidad: number;
  interacciones: number;
  dispositivo: Dispositivo;
  navegacion: Navegacion;
  secciones: SeccionCruda[];
  eventos: EventoCrudo[];
  aviso: { v: number; visto: boolean };
}

export function texto(valor: unknown, max: number = LIMITES.texto): string {
  if (typeof valor !== 'string') return '';
  return valor.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function entero(valor: unknown, max: number): number {
  const n = typeof valor === 'number' && Number.isFinite(valor) ? Math.floor(valor) : 0;
  return Math.min(max, Math.max(0, n));
}

export function identificador(valor: unknown): string {
  const s = texto(valor, 64);
  return /^[A-Za-z0-9_-]{8,64}$/.test(s) ? s : '';
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

export function leerDispositivo(valor: unknown): Dispositivo {
  const d = objeto(valor);
  return {
    ancho: entero(d['ancho'], 10000),
    alto: entero(d['alto'], 10000),
    dpr: entero(d['dpr'], 10),
    pantallaAncho: entero(d['pantallaAncho'], 10000),
    pantallaAlto: entero(d['pantallaAlto'], 10000),
    tactil: d['tactil'] === true,
    idioma: texto(d['idioma'], 35),
    zona: texto(d['zona'], 64),
    navegador: texto(d['navegador'], 40),
    so: texto(d['so'], 40),
  };
}

export function leerNavegacion(valor: unknown): Navegacion {
  const n = objeto(valor);
  const u = objeto(n['utm']);
  return {
    referente: texto(n['referente'], 200),
    entrada: texto(n['entrada'], 30),
    utm: {
      fuente: texto(u['fuente'], 100),
      medio: texto(u['medio'], 100),
      campania: texto(u['campania'], 100),
      contenido: texto(u['contenido'], 100),
      termino: texto(u['termino'], 100),
    },
  };
}

export function leerSecciones(valor: unknown): SeccionCruda[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .slice(0, LIMITES.secciones)
    .map((bruto) => {
      const s = objeto(bruto);
      return {
        id: texto(s['id'], 40),
        etiqueta: texto(s['etiqueta'], LIMITES.texto),
        ms: entero(s['ms'], LIMITES.antiguedadMs),
        veces: entero(s['veces'], 1000),
        primera: entero(s['primera'], LIMITES.antiguedadMs),
      };
    })
    .filter((s) => s.id !== '');
}

export function leerEventos(valor: unknown): EventoCrudo[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .slice(0, LIMITES.eventos)
    .map((bruto) => {
      const e = objeto(bruto);
      return {
        tipo: 'clic' as const,
        objetivo: texto(e['objetivo'], 40),
        etiqueta: texto(e['etiqueta'], LIMITES.texto),
        seccion: texto(e['seccion'], 40),
        delta: entero(e['delta'], LIMITES.antiguedadMs),
      };
    })
    .filter((e) => e.objetivo !== '');
}

export type Lectura = { ok: true; lote: Lote } | { ok: false; error: string };

export function leerLote(cuerpo: string): Lectura {
  if (cuerpo.length > LIMITES.bytes) return { ok: false, error: 'lote demasiado grande' };
  let bruto: unknown;
  try {
    bruto = JSON.parse(cuerpo);
  } catch {
    return { ok: false, error: 'json invalido' };
  }
  const l = objeto(bruto);
  const sesionId = identificador(l['sesionId']);
  const visitanteId = identificador(l['visitanteId']);
  if (!sesionId) return { ok: false, error: 'sesionId invalido' };
  if (!visitanteId) return { ok: false, error: 'visitanteId invalido' };
  const ahora = Date.now();
  const t0 = typeof l['t0'] === 'number' && Number.isFinite(l['t0']) ? Math.floor(l['t0']) : ahora;
  if (t0 > ahora + 60_000 || ahora - t0 > LIMITES.antiguedadMs) {
    return { ok: false, error: 't0 fuera de rango' };
  }
  const aviso = objeto(l['aviso']);
  return {
    ok: true,
    lote: {
      v: entero(l['v'], 1000),
      sesionId,
      visitanteId,
      t0,
      duracionMs: entero(l['duracionMs'], LIMITES.antiguedadMs),
      profundidad: Math.min(1, entero(l['profundidad'], 1000) / 1000),
      interacciones: entero(l['interacciones'], 10000),
      dispositivo: leerDispositivo(l['dispositivo']),
      navegacion: leerNavegacion(l['navegacion']),
      secciones: leerSecciones(l['secciones']),
      eventos: leerEventos(l['eventos']),
      aviso: { v: entero(aviso['v'], 1000), visto: aviso['visto'] === true },
    },
  };
}
