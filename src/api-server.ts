import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { montarApi } from './server/api';
import { cabecerasSeguridad } from './server/seguridad';

/**
 * Servidor de la API + sitio ya compilado, sin SSR.
 *
 * El sitio se publica como SPA estática (`docs/`), así que lo único que necesita
 * un proceso Node es atender `/api/contact` y `/api/telemetria`. Este arranque
 * evita el motor SSR de Angular a propósito: monta las mismas rutas
 * (`src/server/api.ts`) y sirve el HTML compilado tal cual.
 *
 * Variables: PORT (4000), SITIO_ESTATICO (docs), SITIO_BASE (/portfolio-web).
 */

const app = express();

app.use(cabecerasSeguridad);
montarApi(app);

const carpetaSitio = resolve(process.env['SITIO_ESTATICO'] ?? 'docs');
const baseSitio = process.env['SITIO_BASE'] ?? '/portfolio-web';
const indice = resolve(carpetaSitio, 'index.html');

if (existsSync(indice)) {
  app.use(baseSitio, express.static(carpetaSitio, { maxAge: '1h', index: 'index.html' }));
  // Fallback de la SPA: las rutas del cliente devuelven el index.
  app.get(`${baseSitio}/**`, (_req, res) => res.sendFile(indice));
  app.get('/', (_req, res) => res.redirect(`${baseSitio}/`));
} else {
  console.warn(`[api] sin sitio compilado en ${carpetaSitio}: solo se atiende /api`);
}

const puerto = Number(process.env['PORT'] ?? 4000);
app.listen(puerto, () => {
  console.log(`[api] escuchando en http://localhost:${puerto} — api en /api, sitio en ${baseSitio}/`);
});
