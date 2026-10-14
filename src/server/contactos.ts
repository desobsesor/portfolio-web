import { ObjectId, type Collection } from 'mongodb';
import { COLECCIONES, baseMongo } from './mongo';

/**
 * Persistencia de contactos del formulario "Conectemos".
 * Modelo espejo del patrón de cdsmaia-cloud (`almacen.ts`): saneado en
 * servidor, documento enriquecido con contexto que sólo el servidor conoce.
 */

/** Documento tal y como queda en `portfolio_contactos`. */
export interface ContactoDoc {
  _id: ObjectId;
  nombre: string;
  email: string;
  mensaje: string;
  fecha: Date;
  leido: boolean;
  origen: string;
  userAgent: string;
  ipHash: string | null;
}

export function contactos(): Promise<Collection<ContactoDoc>> {
  return baseMongo().then((db) => db.collection<ContactoDoc>(COLECCIONES.contactos));
}

/* ── Saneamiento (mismo estilo que `tipos.ts` de cdsmaia-cloud) ── */

export const LIMITES = {
  nombre: 120,
  email: 254,
  mensaje: 4000,
  texto: 120,
} as const;

/** Texto libre: colapsa espacios, recorta y limita longitud. */
export function texto(valor: unknown, max: number = LIMITES.texto): string {
  if (typeof valor !== 'string') return '';
  return valor.replace(/\s+/g, ' ').trim().slice(0, max);
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

export type LecturaContacto =
  | { ok: true; contacto: { nombre: string; email: string; mensaje: string } }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Convierte el cuerpo de la petición en un contacto usable, o explica por qué no.
 * El cliente sólo propone: el servidor reconstruye campo a campo.
 */
export function leerContacto(cuerpo: unknown): LecturaContacto {
  const c = objeto(cuerpo);
  const nombre = texto(c['nombre'] ?? c['name'], LIMITES.nombre);
  const email = texto(c['email'], LIMITES.email).toLowerCase();
  // El mensaje conserva saltos de línea: sólo recorta bordes y longitud.
  const brutoMensaje = c['mensaje'] ?? c['message'];
  const mensaje =
    typeof brutoMensaje === 'string' ? brutoMensaje.trim().slice(0, LIMITES.mensaje) : '';

  if (nombre.length < 2) return { ok: false, error: 'nombre invalido' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'email invalido' };
  if (mensaje.length < 10) return { ok: false, error: 'mensaje invalido' };

  return { ok: true, contacto: { nombre, email, mensaje } };
}

/** Guarda el contacto y devuelve su id. */
export async function guardarContacto(
  contacto: { nombre: string; email: string; mensaje: string },
  contexto: { origen: string; userAgent: string; ipHash: string | null },
): Promise<ObjectId> {
  const coleccion = await contactos();
  const id = new ObjectId();
  await coleccion.insertOne({
    _id: id,
    nombre: contacto.nombre,
    email: contacto.email,
    mensaje: contacto.mensaje,
    fecha: new Date(),
    leido: false,
    origen: contexto.origen,
    userAgent: contexto.userAgent,
    ipHash: contexto.ipHash,
  });
  return id;
}
