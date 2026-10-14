import express from 'express';
import { guardarPuntaje, leerPuntaje, leerRanking, puestoDe, totalPartidas } from './arcade';
import { guardarContacto, leerContacto } from './contactos';
import { enviarAvisoContacto } from './email';
import { asegurarIndices, mongoConfigurado } from './mongo';
import {
  claveLimite,
  excedeLimite,
  hashearIp,
  ipDeSolicitud,
  origenPermitido,
  pideNoRastrear,
} from './seguridad';
import { guardarLote, type Contexto } from './telemetria-almacen';
import { leerLote } from './telemetria-tipos';

/**
 * Rutas de la API, en un solo sitio para que las monten tanto el servidor SSR
 * (`src/server.ts`) como el servidor de API + sitio estático (`src/api-server.ts`).
 *
 * IMPORTANTE: la telemetría se registra ANTES de `express.json()` y con su propio
 * parser de texto. Si el JSON global la procesara primero, `req.body` llegaría ya
 * como objeto y el saneamiento (que trabaja sobre el texto crudo) nunca correría.
 */
export function montarApi(app: express.Express): void {
  /** Receptor de telemetría. Siempre responde 204: el visitante no debe ver un error
   * por una estadística que no pidió, y el colector no debe reintentar lo que no se
   * va a guardar. */
  app.get('/api/telemetria', (_req, res) => {
    res.json({ estado: 'ok' });
  });

  app.post(
    '/api/telemetria',
    express.text({ type: 'application/json', limit: '128kb' }),
    async (req, res) => {
      if (!mongoConfigurado()) {
        res.status(204).end();
        return;
      }
      if (pideNoRastrear(req)) {
        res.status(204).end();
        return;
      }
      const listaTel = process.env['TELEMETRIA_ORIGENES'] ?? '';
      if (!origenPermitido(req, listaTel)) {
        res.status(204).end();
        return;
      }
      if (excedeLimite(`telemetria:${claveLimite(req, 'TELEMETRIA_CONFIA_PROXY')}`, 5_000)) {
        res.status(204).end();
        return;
      }
      const cuerpo = typeof req.body === 'string' ? req.body : '';
      const lectura = leerLote(cuerpo);
      if (!lectura.ok) {
        res.status(204).end();
        return;
      }
      const contexto: Contexto = {
        ipHash: hashearIp(ipDeSolicitud(req, 'TELEMETRIA_CONFIA_PROXY')),
        geo: {
          pais: typeof req.headers['x-vercel-ip-country'] === 'string'
            ? req.headers['x-vercel-ip-country']
            : null,
          region: typeof req.headers['x-vercel-ip-country-region'] === 'string'
            ? req.headers['x-vercel-ip-country-region']
            : null,
        },
        userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300),
      };
      try {
        await asegurarIndices();
        await guardarLote(lectura.lote, contexto);
      } catch (error) {
        console.error('[telemetria] no se pudo guardar el lote:', error);
        res.status(204).end();
        return;
      }
      res.status(204).end();
    },
  );

  app.use(express.json({ limit: '32kb' }));

  /**
   * POST /api/contact — guarda el mensaje de "Conectemos" en MongoDB Atlas
   * (db `cdsmaia`, colección `portfolio_contactos`), con el mismo patrón de
   * conexión de cdsmaia-cloud: cliente global reutilizado, DNS de respaldo,
   * saneado campo a campo en servidor y límite anti-flooding en memoria.
   */

  app.get('/api/contact', (_req, res) => {
    // Información mínima: no se revela si la base está configurada (halla INFO-LEAK).
    res.json({ estado: 'ok' });
  });

  app.post('/api/contact', async (req, res) => {
    if (!mongoConfigurado()) {
      res.status(503).json({ ok: false, error: 'base no configurada (MONGODB_URI)' });
      return;
    }

    // Origen: sin lista declarada se deniega el cross-origin (falla cerrado).
    const listaContact = process.env['CONTACT_ORIGENES'] ?? process.env['TELEMETRIA_ORIGENES'] ?? '';
    if (!origenPermitido(req, listaContact)) {
      res.status(403).json({ ok: false, error: 'origen no permitido' });
      return;
    }

    // Quien pide no ser rastreado no se registra.
    if (pideNoRastrear(req)) {
      res.status(204).end();
      return;
    }

    // Límite de envíos: un cliente no escribe más deprisa que un navegador real.
    // La clave lleva el nombre del endpoint: el límite de uno no debe bloquear al otro.
    if (excedeLimite(`contacto:${claveLimite(req, 'CONTACT_CONFIA_PROXY')}`, 10_000)) {
      res.status(429).json({ ok: false, error: 'demasiados envios, intenta en unos segundos' });
      return;
    }

    const lectura = leerContacto(req.body);
    if (!lectura.ok) {
      res.status(400).json({ ok: false, error: lectura.error });
      return;
    }

    try {
      await asegurarIndices();
      const ua = String(req.headers['user-agent'] ?? '').slice(0, 300);
      const id = await guardarContacto(lectura.contacto, {
        origen: String(req.headers['origin'] ?? req.headers['referer'] ?? 'directo').slice(0, 200),
        userAgent: ua,
        ipHash: hashearIp(ipDeSolicitud(req, 'CONTACT_CONFIA_PROXY')),
      });

      // Aviso por email: best-effort y asíncrono, nunca retrasa ni falla el
      // envío del formulario. Sólo actúa con RESEND_API_KEY definida.
      enviarAvisoContacto(lectura.contacto).catch((error) =>
        console.warn('[contact] el aviso por email no se pudo enviar:', error),
      );

      res.status(201).json({ ok: true, id: id.toHexString() });
    } catch (error) {
      console.error('[contact] no se pudo guardar el contacto:', error);
      res.status(500).json({ ok: false, error: 'no se pudo guardar, intenta mas tarde' });
    }
  });

  /**
   * Ranking del arcade — `arcade_puntajes` (db `cdsmaia`).
   *
   * El POST comprueba que el marcador sea plausible antes de guardarlo: la ronda
   * dura entre 30 y 60 segundos y cada palabra vale como mucho 60 puntos, así que
   * una cifra inventada a mano se rechaza. El GET sólo publica nombre, puntos,
   * palabras y fecha: nada que identifique al visitante.
   */

  app.get('/api/arcade/ranking', async (req, res) => {
    if (!mongoConfigurado()) {
      res.json({ ok: false, error: 'base no configurada', ranking: [] });
      return;
    }
    const pedido = Number(req.query['limite'] ?? 8);
    const limite = Number.isFinite(pedido) ? Math.min(25, Math.max(1, Math.round(pedido))) : 8;

    try {
      await asegurarIndices();
      const [ranking, total] = await Promise.all([leerRanking(limite), totalPartidas()]);
      res.json({ ok: true, ranking, total });
    } catch (error) {
      console.error('[arcade] no se pudo leer el ranking:', error);
      res.status(500).json({ ok: false, error: 'no se pudo leer el ranking', ranking: [] });
    }
  });

  app.post('/api/arcade', async (req, res) => {
    if (!mongoConfigurado()) {
      res.status(503).json({ ok: false, error: 'base no configurada (MONGODB_URI)' });
      return;
    }

    const listaArcade = process.env['ARCADE_ORIGENES'] ?? process.env['TELEMETRIA_ORIGENES'] ?? '';
    if (!origenPermitido(req, listaArcade)) {
      res.status(403).json({ ok: false, error: 'origen no permitido' });
      return;
    }

    // Quien pide no ser rastreado juega igual, pero no entra al ranking.
    if (pideNoRastrear(req)) {
      res.status(204).end();
      return;
    }

    // Un navegador real no termina dos rondas en cuatro segundos.
    if (excedeLimite(`arcade:${claveLimite(req, 'ARCADE_CONFIA_PROXY')}`, 4_000)) {
      res.status(429).json({ ok: false, error: 'demasiados envios, intenta en unos segundos' });
      return;
    }

    const lectura = leerPuntaje(req.body);
    if (!lectura.ok) {
      res.status(400).json({ ok: false, error: lectura.error });
      return;
    }

    try {
      await asegurarIndices();
      const fecha = new Date();
      const id = await guardarPuntaje(lectura.puntaje, {
        origen: String(req.headers['origin'] ?? req.headers['referer'] ?? 'directo').slice(0, 200),
        userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300),
        ipHash: hashearIp(ipDeSolicitud(req, 'ARCADE_CONFIA_PROXY')),
      });
      const puesto = await puestoDe({ puntos: lectura.puntaje.puntos, fecha });
      res.status(201).json({ ok: true, id: id.toHexString(), puesto });
    } catch (error) {
      console.error('[arcade] no se pudo guardar el puntaje:', error);
      res.status(500).json({ ok: false, error: 'no se pudo guardar el puntaje' });
    }
  });
}
