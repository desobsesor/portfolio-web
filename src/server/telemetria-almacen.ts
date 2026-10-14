import { ObjectId, type Collection } from 'mongodb';
import { COLECCIONES, baseMongo } from './mongo';
import type { EventoCrudo, Lote, SeccionCruda } from './telemetria-tipos';

/** Documento tal y como queda en `telemetria_sesiones`. */
export interface SesionDoc {
  _id: ObjectId;
  sesionId: string;
  visitanteId: string;
  t0: Date;
  actualizado: Date;
  duracionMs: number;
  profundidad: number;
  interacciones: number;
  dispositivo: Lote['dispositivo'];
  navegacion: Lote['navegacion'];
  recorrido: string[];
  secciones: Array<SeccionCruda & { peso: number }>;
  ipHash: string | null;
  geo: { pais: string | null; region: string | null };
  userAgent: string;
  lotes: number;
  version: number;
  aviso: { v: number; visto: boolean };
}

/** Documento de `telemetria_eventos`: un clic de intención. */
export interface EventoDoc extends EventoCrudo {
  _id: ObjectId;
  sesionId: string;
  visitanteId: string;
  fecha: Date;
}

export function sesiones(): Promise<Collection<SesionDoc>> {
  return baseMongo().then((db) => db.collection<SesionDoc>(COLECCIONES.sesiones));
}

export function eventos(): Promise<Collection<EventoDoc>> {
  return baseMongo().then((db) => db.collection<EventoDoc>(COLECCIONES.eventos));
}

/** Contexto que sólo puede saber el servidor. */
export interface Contexto {
  ipHash: string | null;
  geo: { pais: string | null; region: string | null };
  userAgent: string;
}

export async function guardarLote(lote: Lote, contexto: Contexto): Promise<SesionDoc | null> {
  const ahora = new Date(lote.t0);
  const coleccion = await sesiones();
  await coleccion.updateOne(
    { sesionId: lote.sesionId },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        sesionId: lote.sesionId,
        visitanteId: lote.visitanteId,
        t0: ahora,
        navegacion: lote.navegacion,
        recorrido: [],
        secciones: [],
        ipHash: contexto.ipHash,
        geo: contexto.geo,
        userAgent: contexto.userAgent,
        version: lote.v,
      },
      $max: {
        duracionMs: lote.duracionMs,
        profundidad: lote.profundidad,
        interacciones: lote.interacciones,
      },
      $set: { actualizado: new Date(), aviso: lote.aviso, dispositivo: lote.dispositivo },
      $inc: { lotes: 1 },
    },
    { upsert: true },
  );
  if (lote.secciones.length > 0) {
    const total = lote.secciones.reduce((suma, s) => suma + s.ms, 0);
    await coleccion.updateOne(
      { sesionId: lote.sesionId },
      {
        $set: {
          secciones: lote.secciones
            .slice()
            .sort((a, b) => a.primera - b.primera)
            .map((s) => ({ ...s, peso: total > 0 ? Number((s.ms / total).toFixed(4)) : 0 })),
          recorrido: lote.secciones
            .slice()
            .sort((a, b) => a.primera - b.primera)
            .map((s) => s.id),
        },
      },
    );
  }
  if (lote.eventos.length > 0) {
    const coleccionEventos = await eventos();
    await coleccionEventos.insertMany(
      lote.eventos.map((evento) => ({
        ...evento,
        _id: new ObjectId(),
        sesionId: lote.sesionId,
        visitanteId: lote.visitanteId,
        fecha: new Date(lote.t0 + evento.delta),
      })),
    );
  }
  return coleccion.findOne({ sesionId: lote.sesionId });
}
