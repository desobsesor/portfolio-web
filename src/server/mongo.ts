import { MongoClient, type Db } from 'mongodb';
import dns from 'node:dns';

/**
 * Conexión a MongoDB Atlas — portado de cdsmaia-cloud (`src/lib/telemetria/mongo.ts`).
 *
 * El cliente se guarda en el ámbito global a propósito: en desarrollo cada
 * recarga de módulos creaba una conexión nueva y el plan gratuito de Atlas
 * (500 conexiones) acababa rechazando. Guardándolo en `global` se reutiliza
 * entre peticiones y recargas.
 */

const URI = process.env['MONGODB_URI'] ?? '';
const BASE = process.env['MONGODB_DB'] ?? 'cdsmaia';

/**
 * Servidores DNS de respaldo. Node resuelve con c-ares, que en varias redes
 * (oficinas, ISPs, algunos routers) falla con `querySrv ECONNREFUSED`.
 * Apuntar a un DNS público antes de conectar lo resuelve. Sólo se aplica si
 * `CONTACT_DNS` (o el heredado `TELEMETRIA_DNS`) trae servidores.
 */
const SERVIDORES_DNS = (process.env['CONTACT_DNS'] ?? process.env['TELEMETRIA_DNS'] ?? '8.8.8.8,1.1.1.1')
  .split(',')
  .map((valor) => valor.trim())
  .filter(Boolean);

if (SERVIDORES_DNS.length > 0) {
  try {
    dns.setServers(SERVIDORES_DNS);
  } catch {
    // Un DNS mal escrito no debe tumbar el arranque: se sigue con el del sistema.
  }
}

/** Colecciones del portafolio. */
export const COLECCIONES = {
  /** Contactos del formulario "Conectemos". */
  contactos: 'portfolio_contactos',
  /** Puntajes del pasatiempo arcade, base del ranking entre visitantes. */
  puntajes: 'arcade_puntajes',
  /** Una visita, enriquecida con upsert a medida que llegan lotes. */
  sesiones: 'telemetria_sesiones',
  /** Libro de eventos: un documento por clic de intención. */
  eventos: 'telemetria_eventos',
} as const;

interface CacheGlobal {
  __portfolioMongo?: { promesa: Promise<MongoClient> | null };
}

const alcanceGlobal = globalThis as unknown as CacheGlobal;
const cache: { promesa: Promise<MongoClient> | null } = (alcanceGlobal.__portfolioMongo ??= {
  promesa: null,
});

/** `true` cuando hay cadena de conexión configurada. */
export function mongoConfigurado(): boolean {
  return URI.length > 0;
}

/** Cliente compartido. Reintenta una sola vez por proceso si la conexión falla. */
export function clienteMongo(): Promise<MongoClient> {
  if (!URI) return Promise.reject(new Error('MONGODB_URI sin definir'));

  if (!cache.promesa) {
    const cliente = new MongoClient(URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      maxPoolSize: 8,
      retryWrites: true,
    });

    cache.promesa = cliente.connect().catch((error) => {
      cache.promesa = null;
      throw explicarFallo(error);
    });
  }

  return cache.promesa;
}

function explicarFallo(error: unknown): Error {
  const fallo = error instanceof Error ? error : new Error(String(error));
  const codigo = (error as NodeJS.ErrnoException)?.code;

  const pistas: Record<string, string> = {
    ECONNREFUSED:
      'El resolvedor DNS de Node no pudo consultar el clúster (c-ares devolvió ECONNREFUSED). ' +
      'Suele ser la red local, no Atlas. Define CONTACT_DNS=8.8.8.8,1.1.1.1 y reinicia.',
    ENOTFOUND: 'No se encontró el host del clúster. Revisa que MONGODB_URI esté completa.',
    ETIMEDOUT: 'Se agotó el tiempo al conectar. Comprueba internet y que el clúster no esté pausado.',
    MONGODB_ERROR:
      'Atlas rechazó la conexión. Revisa Network Access (IP en lista o 0.0.0.0/0 en pruebas) ' +
      'y usuario/contraseña de MONGODB_URI.',
  };

  const pista = codigo ? pistas[codigo] : undefined;
  if (!pista) return fallo;

  fallo.message = `${fallo.message}\n  → ${pista}`;
  return fallo;
}

/** Base de datos del sitio (por defecto `cdsmaia`, como en cdsmaia-cloud). */
export async function baseMongo(): Promise<Db> {
  const cliente = await clienteMongo();
  return cliente.db(BASE);
}

let indicesListos: Promise<void> | null = null;

/** Crea índices idempotentes para la colección de contactos. */
export function asegurarIndices(): Promise<void> {
  indicesListos ??= crearIndices().catch((error) => {
    indicesListos = null;
    throw error;
  });
  return indicesListos;
}

async function crearIndices(): Promise<void> {
  const db = await baseMongo();
  await Promise.all([
    db.collection(COLECCIONES.contactos).createIndex({ fecha: -1 }),
    db.collection(COLECCIONES.contactos).createIndex({ email: 1, fecha: -1 }),
    db.collection(COLECCIONES.contactos).createIndex({ leido: 1, fecha: -1 }),
    // Ranking del arcade: la consulta ordena por puntos y desempata por fecha.
    db.collection(COLECCIONES.puntajes).createIndex({ puntos: -1, fecha: 1 }),
    db.collection(COLECCIONES.puntajes).createIndex({ fecha: -1 }),
    db.collection(COLECCIONES.puntajes).createIndex({ usuario: 1, puntos: -1 }),
    db.collection(COLECCIONES.sesiones).createIndex({ sesionId: 1 }, { unique: true }),
    db.collection(COLECCIONES.sesiones).createIndex({ visitanteId: 1, t0: -1 }),
    db.collection(COLECCIONES.sesiones).createIndex({ t0: -1 }),
    db.collection(COLECCIONES.sesiones).createIndex({ 'navegacion.entrada': 1, t0: -1 }),
    db.collection(COLECCIONES.eventos).createIndex({ sesionId: 1 }),
    db.collection(COLECCIONES.eventos).createIndex({ objetivo: 1, fecha: -1 }),
    db.collection(COLECCIONES.eventos).createIndex({ fecha: -1 }),
  ]);
}
