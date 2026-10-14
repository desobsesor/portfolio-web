import { ObjectId, type Collection } from 'mongodb';
import { texto } from './contactos';
import { COLECCIONES, baseMongo } from './mongo';

/**
 * Puntajes del pasatiempo arcade, para el ranking real entre visitantes.
 *
 * El cliente sólo propone: aquí se reconstruye campo a campo y se comprueba que
 * el marcador sea plausible (una ronda dura entre 30 y 60 segundos, cada palabra
 * vale como mucho 60 puntos y no se revientan más de tres por segundo). Sin esas
 * comprobaciones, un POST a mano podría poner cualquier cifra en el ranking.
 */

/** Documento tal y como queda en `arcade_puntajes`. */
export interface PuntajeDoc {
  _id: ObjectId;
  usuario: string;
  puntos: number;
  palabras: number;
  segundos: number;
  fecha: Date;
  origen: string;
  userAgent: string;
  ipHash: string | null;
}

/** Fila que se publica en el ranking (sin nada que identifique al visitante). */
export interface FilaRanking {
  usuario: string;
  puntos: number;
  palabras: number;
  segundos: number;
  fecha: string;
}

export const LIMITES_ARCADE = {
  usuario: 18,
  /** Techo defensivo: la partida más generosa no llega a 1500. */
  puntos: 2_000,
  palabras: 150,
  /** La ronda dura entre 30 y 60 s; se deja holgura por el reloj del cliente. */
  segundosMin: 25,
  segundosMax: 70,
  /** Máximo de palabras por segundo que se aceptan como humanas. */
  palabrasPorSegundo: 3,
  /** Valor máximo de una palabra: 10 + 2 × 25 letras. */
  puntosPorPalabra: 60,
} as const;

export function puntajes(): Promise<Collection<PuntajeDoc>> {
  return baseMongo().then((db) => db.collection<PuntajeDoc>(COLECCIONES.puntajes));
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

function entero(valor: unknown): number | null {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) ? Math.round(numero) : null;
}

export type LecturaPuntaje =
  | { ok: true; puntaje: { usuario: string; puntos: number; palabras: number; segundos: number } }
  | { ok: false; error: string };

/** Convierte el cuerpo de la petición en un puntaje usable, o explica por qué no. */
export function leerPuntaje(cuerpo: unknown): LecturaPuntaje {
  const c = objeto(cuerpo);
  const usuario = texto(c['usuario'] ?? c['nombre'], LIMITES_ARCADE.usuario) || 'Invitado';
  const puntos = entero(c['puntos'] ?? c['score']);
  const palabras = entero(c['palabras'] ?? c['destruidas']);
  const segundos = entero(c['segundos'] ?? c['duracion']);

  if (puntos === null || palabras === null || segundos === null) {
    return { ok: false, error: 'marcador incompleto' };
  }
  if (puntos < 0 || puntos > LIMITES_ARCADE.puntos) return { ok: false, error: 'puntos fuera de rango' };
  if (palabras < 0 || palabras > LIMITES_ARCADE.palabras) return { ok: false, error: 'palabras fuera de rango' };
  if (segundos < LIMITES_ARCADE.segundosMin || segundos > LIMITES_ARCADE.segundosMax) {
    return { ok: false, error: 'duracion fuera de rango' };
  }
  if (palabras > segundos * LIMITES_ARCADE.palabrasPorSegundo) {
    return { ok: false, error: 'marcador imposible' };
  }
  if (puntos > palabras * LIMITES_ARCADE.puntosPorPalabra) {
    return { ok: false, error: 'marcador imposible' };
  }
  if (palabras > 0 && puntos < palabras * 10) {
    // Cada palabra vale al menos 10 puntos: menos que eso no es un marcador real.
    return { ok: false, error: 'marcador imposible' };
  }

  return { ok: true, puntaje: { usuario, puntos, palabras, segundos } };
}

/** Guarda el puntaje y devuelve su id. */
export async function guardarPuntaje(
  puntaje: { usuario: string; puntos: number; palabras: number; segundos: number },
  contexto: { origen: string; userAgent: string; ipHash: string | null },
): Promise<ObjectId> {
  const coleccion = await puntajes();
  const id = new ObjectId();
  await coleccion.insertOne({
    _id: id,
    usuario: puntaje.usuario,
    puntos: puntaje.puntos,
    palabras: puntaje.palabras,
    segundos: puntaje.segundos,
    fecha: new Date(),
    origen: contexto.origen,
    userAgent: contexto.userAgent,
    ipHash: contexto.ipHash,
  });
  return id;
}

/**
 * Puesto que ocupa un marcador: cuántos van por delante, más uno. A igualdad de
 * puntos gana quien lo consiguió antes.
 */
export async function puestoDe(puntaje: { puntos: number; fecha: Date }): Promise<number> {
  const coleccion = await puntajes();
  const porDelante = await coleccion.countDocuments({
    $or: [
      { puntos: { $gt: puntaje.puntos } },
      { puntos: puntaje.puntos, fecha: { $lt: puntaje.fecha } },
    ],
  });
  return porDelante + 1;
}

/** Mejores marcadores, de mayor a menor. Sin datos que identifiquen al visitante. */
export async function leerRanking(limite: number): Promise<FilaRanking[]> {
  const coleccion = await puntajes();
  const filas = await coleccion
    .find({}, { projection: { usuario: 1, puntos: 1, palabras: 1, segundos: 1, fecha: 1 } })
    .sort({ puntos: -1, fecha: 1 })
    .limit(limite)
    .toArray();

  return filas.map((fila) => ({
    usuario: fila.usuario,
    puntos: fila.puntos,
    palabras: fila.palabras,
    segundos: fila.segundos,
    fecha: fila.fecha instanceof Date ? fila.fecha.toISOString() : String(fila.fecha),
  }));
}

/** Total de partidas registradas, para el contador del panel. */
export async function totalPartidas(): Promise<number> {
  return (await puntajes()).countDocuments();
}
