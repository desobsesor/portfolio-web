import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom, Subscription } from 'rxjs';
import { MatrixRainService, PalabraEnVuelo } from './matrix-rain.service';
import { Colector } from './telemetria-colector';

/** Una marca del ranking arcade. */
export interface MarcaArcade {
    usuario: string;
    puntos: number;
    destruidas: number;
    segundos: number;
    fecha: number;
}

export type EstadoArcade = 'inactivo' | 'jugando' | 'terminado';

/** Fila que devuelve el ranking del servidor. */
interface FilaRankingServidor {
    usuario: string;
    puntos: number;
    palabras: number;
    segundos: number;
    fecha: string;
}

const CLAVE_RANKING = 'portfolio-arcade-ranking';
const CLAVE_HISTORIAL = 'portfolio-arcade-historial';
const CLAVE_USUARIO = 'portfolio-arcade-usuario';

const TOPE_RANKING = 8;
const TOPE_HISTORIAL = 50;
const SEGUNDOS_MIN = 30;
const SEGUNDOS_MAX = 60;
/** Endpoint que guarda el puntaje y devuelve el ranking entre visitantes. */
const RUTA_ARCADE = '/api/arcade';

/**
 * Pasatiempo sobre la lluvia de fondo: cada tecnología que cae se revienta pulsando su
 * letra inicial. La partida dura entre 30 y 60 segundos, lo destruido suma puntos y cada
 * participación deja marca en el ranking y en la telemetría.
 */
@Injectable({
    providedIn: 'root'
})
export class ArcadeService implements OnDestroy {
    estado: EstadoArcade = 'inactivo';
    puntos = 0;
    destruidas = 0;
    restanteMs = 0;
    duracionMs = 0;
    usuario = '';
    /** Ranking que se muestra: el global del servidor, o el local si no hay conexión. */
    ranking: MarcaArcade[] = [];
    /** De dónde sale la lista que se está mostrando. */
    fuenteRanking: 'global' | 'local' = 'local';
    /** Partidas registradas en el ranking global. */
    totalGlobal = 0;
    /** Marcadores guardados en este equipo, que son el respaldo sin conexión. */
    private rankingLocal: MarcaArcade[] = [];
    /** Puesto conseguido en la última partida, o null si no entró en la lista. */
    puesto: number | null = null;
    /** Último acierto, para el aviso de puntos del marcador. */
    ultimoAcierto: { palabra: string; puntos: number } | null = null;

    /**
     * El pasatiempo es de teclado, así que solo se ofrece en equipos de escritorio
     * (puntero fino y con hover). En táctil el panel ni se muestra: más adelante
     * podría existir una versión táctil, pero por ahora va solo con teclado.
     */
    modoPc = false;
    /** Sin la lluvia en movimiento no hay nada que reventar. */
    disponible = true;

    /**
     * El marcador vive en el pie de página y solo se despliega en la portada, que es
     * donde se activa y se juega. En el resto de pantallas queda recogido en el botón
     * circular de arriba a la derecha.
     */
    abierto = true;
    /** true cuando la ruta actual es la portada. */
    esPortada = true;

    private suscripcionRutas?: Subscription;

    private fin = 0;
    private tic: ReturnType<typeof setInterval> | null = null;
    private colector: Colector | null = null;
    private ultimaFecha = 0;
    /** Última marca propia, para resaltarla en el ranking venga de donde venga. */
    private ultimaMarca: { usuario: string; puntos: number } | null = null;
    private readonly enNavegador = typeof window !== 'undefined' && typeof document !== 'undefined';

    constructor(
        private lluvia: MatrixRainService,
        private router: Router,
        private http: HttpClient,
    ) {
        this.cargar();
        this.detectarEntorno();

        if (this.enNavegador) {
            document.addEventListener('keydown', this.alPulsar);
            this.esPortada = this.enPortada(this.router.url);
            this.abierto = this.esPortada;
            this.suscripcionRutas = this.router.events
                .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
                .subscribe((evento) => this.alCambiarRuta(evento.urlAfterRedirects));

            if (this.modoPc) {
                void this.cargarRanking();
            }
        }
    }

    ngOnDestroy(): void {
        this.pararTic();
        this.suscripcionRutas?.unsubscribe();
        if (this.enNavegador) {
            document.removeEventListener('keydown', this.alPulsar);
        }
    }

    /** El marcador se pinta en el pie de página solo en la portada. */
    get mostrarPanel(): boolean {
        return this.modoPc && this.abierto;
    }

    /** Recogido: solo queda el botón circular de arriba a la derecha. */
    get mostrarBurbuja(): boolean {
        return this.modoPc && !this.abierto;
    }

    /** Texto del botón circular según lo que esté pasando. */
    get etiquetaBurbuja(): string {
        if (this.estado === 'jugando') {
            return `Arcade en curso: ${this.puntos} puntos, ${Math.ceil(this.restanteMs / 1000)} segundos`;
        }
        return this.esPortada
            ? 'Abrir el marcador del arcade'
            : 'Ir a la portada para jugar al arcade';
    }

    /** El botón de plegar del propio marcador. */
    alternarPanel(): void {
        this.abierto = !this.abierto;
    }

    /**
     * Desde el botón circular: en la portada despliega el marcador; fuera de ella lleva
     * a la portada, que es donde se juega.
     */
    alPulsarBurbuja(): void {
        if (this.esPortada) {
            this.abierto = true;
            return;
        }
        void this.router.navigateByUrl('/');
    }

    /**
     * Al llegar a otra pantalla el marcador se recoge; al volver a la portada se
     * despliega otra vez. Si hay una partida en curso se respeta el estado del jugador.
     */
    private alCambiarRuta(url: string): void {
        this.esPortada = this.enPortada(url);
        this.abierto = this.esPortada;
    }

    private enPortada(url: string): boolean {
        const ruta = (url || '/').split('?')[0].split('#')[0];
        return ruta === '/' || ruta === '';
    }

    /** AppComponent entrega aquí el colector de telemetría que ya está arrancado. */
    usarColector(colector: Colector | null): void {
        this.colector = colector;
    }

    /** Nivel de velocidad que lleva la lluvia (1 = el más lento). */
    get nivelLluvia(): number {
        return this.lluvia.nivelActual;
    }

    /** Tope de velocidad del nivel en curso, en px/s. */
    get topeLluvia(): number {
        return this.lluvia.topeNivel;
    }

    /** Arranca una partida de duración aleatoria entre 30 y 60 segundos. */
    iniciar(): void {
        if (!this.disponible || this.estado === 'jugando') {
            return;
        }

        const segundos = SEGUNDOS_MIN + Math.random() * (SEGUNDOS_MAX - SEGUNDOS_MIN);
        this.duracionMs = Math.round(segundos * 1000);
        this.fin = Date.now() + this.duracionMs;
        this.restanteMs = this.duracionMs;
        this.puntos = 0;
        this.destruidas = 0;
        this.puesto = null;
        this.ultimoAcierto = null;
        this.estado = 'jugando';
        this.guardarUsuario();

        this.pararTic();
        this.tic = setInterval(() => this.latido(), 100);
    }

    /** Abandona la partida sin dejar marca. */
    detener(): void {
        this.pararTic();
        this.estado = 'inactivo';
        this.restanteMs = 0;
        this.ultimoAcierto = null;
    }

    /** true si la marca es la de la última partida jugada. */
    esUltima(marca: MarcaArcade): boolean {
        if (marca.fecha === this.ultimaFecha) {
            return true;
        }
        // El ranking global trae la fecha del servidor: se reconoce la marca propia
        // por nombre y puntos.
        const propia = this.ultimaMarca;
        return !!propia && marca.usuario === propia.usuario && marca.puntos === propia.puntos;
    }

    private latido(): void {
        this.restanteMs = Math.max(0, this.fin - Date.now());
        if (this.restanteMs <= 0) {
            this.terminar();
        }
    }

    private terminar(): void {
        this.pararTic();
        this.estado = 'terminado';

        const marca: MarcaArcade = {
            usuario: this.usuario || 'Invitado',
            puntos: this.puntos,
            destruidas: this.destruidas,
            segundos: Math.round(this.duracionMs / 1000),
            fecha: Date.now(),
        };

        this.ultimaFecha = marca.fecha;
        this.ultimaMarca = { usuario: marca.usuario, puntos: marca.puntos };
        this.guardarMarca(marca);
        this.anotarTelemetria(marca);

        // Ranking real: se manda al servidor y se refresca la lista. Sin conexión
        // queda la marca local y el panel lo indica.
        if (marca.puntos > 0) {
            void this.enviarPuntaje(marca);
        }
    }

    /**
     * Guarda la partida en `arcade_puntajes` (db `cdsmaia`) y adopta el puesto que
     * responde el servidor, que es el que cuenta contra todos los visitantes.
     */
    private async enviarPuntaje(marca: MarcaArcade): Promise<void> {
        try {
            const resp = await firstValueFrom(
                this.http.post<{ ok: boolean; puesto?: number; error?: string }>(RUTA_ARCADE, {
                    usuario: marca.usuario,
                    puntos: marca.puntos,
                    palabras: marca.destruidas,
                    segundos: marca.segundos,
                }),
            );
            if (typeof resp?.puesto === 'number') {
                this.puesto = resp.puesto - 1;
            }
            await this.cargarRanking();
        } catch (error) {
            console.warn('[arcade] no se pudo registrar el puntaje en el ranking global:', error);
        }
    }

    /** Trae el ranking global; si falla, se sigue mostrando el local. */
    async cargarRanking(): Promise<void> {
        try {
            const resp = await firstValueFrom(
                this.http.get<{ ok: boolean; ranking?: FilaRankingServidor[]; total?: number }>(
                    `${RUTA_ARCADE}/ranking`,
                    { params: { limite: TOPE_RANKING } },
                ),
            );
            if (!resp?.ok || !Array.isArray(resp.ranking)) {
                return;
            }
            this.ranking = resp.ranking.map((fila) => ({
                usuario: fila.usuario,
                puntos: fila.puntos,
                destruidas: fila.palabras,
                segundos: fila.segundos,
                fecha: Date.parse(fila.fecha) || 0,
            }));
            this.totalGlobal = resp.total ?? resp.ranking.length;
            this.fuenteRanking = 'global';
        } catch {
            // Sin servidor (o sin red) el juego no se rompe: sigue el ranking local.
            this.fuenteRanking = 'local';
            this.ranking = this.rankingLocal;
        }
    }

    private alPulsar = (evento: KeyboardEvent): void => {
        if (this.estado !== 'jugando' || evento.ctrlKey || evento.metaKey || evento.altKey) {
            return;
        }
        // Escribir en el formulario de contacto no debe reventar palabras.
        if (this.esCampoDeTexto(evento.target)) {
            return;
        }

        const tecla = this.normalizar(evento.key);
        if (!tecla) {
            return;
        }

        const objetivo = this.elegirObjetivo(tecla);
        if (!objetivo) {
            return;
        }

        evento.preventDefault();
        this.lluvia.destruirPalabra(objetivo.indice);

        const ganancia = 10 + objetivo.palabra.length * 2;
        this.puntos += ganancia;
        this.destruidas += 1;
        this.ultimoAcierto = { palabra: objetivo.palabra, puntos: ganancia };
    };

    /** De las palabras que empiezan por esa tecla, la que está más abajo. */
    private elegirObjetivo(tecla: string): PalabraEnVuelo | null {
        const candidatas = this.lluvia
            .palabrasEnVuelo()
            .filter((palabra) => this.normalizar(palabra.palabra.charAt(0)) === tecla);

        if (!candidatas.length) {
            return null;
        }
        return candidatas.reduce((a, b) => (b.y > a.y ? b : a));
    }

    private esCampoDeTexto(destino: EventTarget | null): boolean {
        const nodo = destino as HTMLElement | null;
        if (!nodo) {
            return false;
        }
        return nodo.isContentEditable || /^(input|textarea|select)$/i.test(nodo.tagName ?? '');
    }

    /** Deja la tecla en una sola letra o dígito, sin tildes ni mayúsculas. */
    private normalizar(texto: string): string {
        if (!texto || texto.length !== 1) {
            return '';
        }
        const limpio = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return /^[a-z0-9]$/.test(limpio) ? limpio : '';
    }

    private guardarMarca(marca: MarcaArcade): void {
        // La lista local es la propia del equipo; el ranking global llega del servidor.
        const lista = [...this.rankingLocal, marca]
            .sort((a, b) => b.puntos - a.puntos || a.fecha - b.fecha)
            .slice(0, TOPE_RANKING);

        this.rankingLocal = lista;
        const indice = lista.findIndex((m) => m.fecha === marca.fecha);
        this.puesto = indice === -1 ? null : indice;

        if (this.fuenteRanking === 'local') {
            this.ranking = lista;
        }

        this.escribir(CLAVE_RANKING, JSON.stringify(lista));
        this.anotarHistorial(marca);
    }

    /** Historial de partidas: la huella local de cada participación. */
    private anotarHistorial(marca: MarcaArcade): void {
        const historial = this.leer<MarcaArcade[]>(CLAVE_HISTORIAL, []);
        historial.push(marca);
        this.escribir(CLAVE_HISTORIAL, JSON.stringify(historial.slice(-TOPE_HISTORIAL)));
    }

    /** Manda la partida al colector, que la incluye en el siguiente lote. */
    private anotarTelemetria(marca: MarcaArcade): void {
        this.colector?.anotarPartida({
            puntos: marca.puntos,
            palabras: marca.destruidas,
            segundos: marca.segundos,
            usuario: marca.usuario,
        });
    }

    private cargar(): void {
        this.rankingLocal = this.leer<MarcaArcade[]>(CLAVE_RANKING, []);
        this.ranking = this.rankingLocal;
        this.usuario = this.leer<string>(CLAVE_USUARIO, '');
    }

    private guardarUsuario(): void {
        this.usuario = (this.usuario ?? '').replace(/\s+/g, ' ').trim().slice(0, 18);
        this.escribir(CLAVE_USUARIO, JSON.stringify(this.usuario));
    }

    private detectarEntorno(): void {
        if (!this.enNavegador) {
            this.modoPc = false;
            this.disponible = false;
            return;
        }

        // Puntero fino + hover es la señal de un equipo de escritorio con teclado y
        // ratón; un portátil con pantalla táctil también lo cumple y sí puede jugar.
        const punteroFino = window.matchMedia?.('(pointer: fine)').matches ?? false;
        const conHover = window.matchMedia?.('(hover: hover)').matches ?? false;
        this.modoPc = punteroFino && conHover;

        const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        this.disponible = this.modoPc && !sinMovimiento;
    }

    private pararTic(): void {
        if (this.tic !== null) {
            clearInterval(this.tic);
            this.tic = null;
        }
    }

    private leer<T>(clave: string, porDefecto: T): T {
        if (!this.enNavegador) {
            return porDefecto;
        }
        try {
            const bruto = localStorage.getItem(clave);
            return bruto ? (JSON.parse(bruto) as T) : porDefecto;
        } catch {
            return porDefecto;
        }
    }

    private escribir(clave: string, valor: string): void {
        if (!this.enNavegador) {
            return;
        }
        try {
            localStorage.setItem(clave, valor);
        } catch {
            /* En modo privado el juego funciona igual, sólo no guarda marcas. */
        }
    }
}
