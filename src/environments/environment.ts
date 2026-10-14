// This file contains environment variables for development
// In production, these variables should be configured on the server

export const environment = {
    production: false,
    /**
     * Interruptor de telemetría de navegación:
     *   '1'  fuerza la medición (incluso en local, para probar el circuito)
     *   '0'  la apaga en cualquier entorno (interruptor de emergencia)
     *   ''   sin declarar: se mide sólo en producción
     */
    telemetria: '',
};