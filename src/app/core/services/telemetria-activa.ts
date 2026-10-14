import { environment } from '@/environments/environment';

/** Interruptor de telemetría: `1` fuerza, `0` apaga, sin declarar sólo en prod. */
export function telemetriaActiva(): boolean {
  const declarado = (environment.telemetria ?? '').trim();
  if (declarado === '1') return true;
  if (declarado === '0') return false;
  return environment.production === true;
}
