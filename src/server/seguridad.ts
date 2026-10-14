import type express from 'express';
import { createHash } from 'node:crypto';

/**
 * Defensas HTTP compartidas — portadas de cdsmaia-cloud
 * (`app/api/telemetria/route.ts` + `next.config.mjs`).
 *
 * 1. Cabeceras de seguridad en cada respuesta (CSP, nosniff, etc.).
 * 2. Información mínima: los GET de estado nunca revelan si Mongo está activo.
 * 3. Origen permitido: sin lista declarada, el cross-origin se deniega.
 * 4. Rate-limit en memoria por visitante (frena flooding, no cuenta usuarios).
 * 5. Respeto a DNT/GPC también en servidor (el colector ya filtra en cliente).
 * 6. IP hasheada con sal: sin `TELEMETRIA_SAL`/`CONTACT_SAL` no se guarda hash.
 */

/** Cabeceras aplicadas a todas las respuestas (incluido el SSR de Angular). */
export function cabecerasSeguridad(
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "media-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "child-src 'self' blob:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Sin HSTS a propósito: forzaría HTTPS en desarrollo local (http).
  // Añadir `Strict-Transport-Security` al desplegar detrás de un proxy TLS.
  next();
}

/**
 * Comprueba que la petición venga de este sitio.
 * `Origin` sólo lo manda el navegador en cross-origin; el tráfico legítimo
 * (same-origin beacon/fetch) no lo trae y pasa. Con lista declarada en
 * `TELEMETRIA_ORIGENES`/`CONTACT_ORIGENES`, sólo esos orígenes.
 */
export function origenPermitido(req: express.Request, envLista: string): boolean {
  const permitidos = envLista
    .split(',')
    .map((valor) => valor.trim())
    .filter(Boolean);

  const origen = req.headers['origin'];
  if (!origen || (Array.isArray(origen) ? origen.length === 0 : origen.length === 0)) return true;

  const origenStr = Array.isArray(origen) ? origen[0] : origen;
  if (permitidos.length > 0) return permitidos.includes(origenStr);

  const host = req.headers['x-forwarded-host'] ?? req.headers['host'] ?? '';
  const hostStr = Array.isArray(host) ? host[0] : host;
  try {
    return new URL(origenStr).host === String(hostStr).split(',')[0]?.trim();
  } catch {
    return false;
  }
}

/** `true` si el visitante pidió explícitamente no ser rastreado. */
export function pideNoRastrear(req: express.Request): boolean {
  return req.headers['dnt'] === '1' || req.headers['sec-gpc'] === '1';
}

/* ── Rate limit en memoria (vale para un proceso; frena abuso puntual) ── */

const ultimoEnvio = new Map<string, number>();

/** `true` si la clave envió hace menos de la ventana: se rechaza con 429/204. */
export function excedeLimite(clave: string, ventanaMs: number): boolean {
  const ahora = Date.now();
  const previo = ultimoEnvio.get(clave) ?? 0;
  if (ahora - previo < ventanaMs) return true;
  ultimoEnvio.set(clave, ahora);
  if (ultimoEnvio.size > 10_000) {
    const caduca = ahora - ventanaMs;
    for (const [k, t] of ultimoEnvio) if (t < caduca) ultimoEnvio.delete(k);
  }
  return false;
}

/* ── IP: sólo con proxy de confianza, hasheada con sal ── */

export function ipDeSolicitud(req: express.Request, envConfia: string): string | null {
  if (process.env[envConfia] !== '1') return null;
  const cadena = req.headers['x-forwarded-for'];
  const primera = Array.isArray(cadena) ? cadena[0] : (cadena ?? '').split(',')[0]?.trim();
  if (primera) return primera;
  const real = req.headers['x-real-ip'];
  return typeof real === 'string' && real.length > 0 ? real : null;
}

/** Hash estable truncado a 24 hex (96 bits). Sin sal configurada → null. */
export function hashearIp(ip: string | null): string | null {
  const sal = process.env['TELEMETRIA_SAL'] ?? process.env['CONTACT_SAL'] ?? '';
  if (!ip || !sal) return null;
  return createHash('sha256').update(`${sal}:${ip}`).digest('hex').slice(0, 24);
}

/** Clave estable para el límite, sin exponer la IP. */
export function claveLimite(req: express.Request, envConfia: string): string {
  const ip = ipDeSolicitud(req, envConfia);
  if (ip) return hashearIp(ip) ?? `ua:${String(req.headers['user-agent'] ?? '')}`;
  return `ua:${String(req.headers['user-agent'] ?? '')}`;
}
