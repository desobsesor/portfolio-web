// This file contains environment variables for production
// It replaces environment.ts in production builds (angular.json →
// fileReplacements), so everything here runs in the browser: no process.env,
// those would throw ReferenceError at load time.

export const environment = {
    production: true,
    /**
     * Interruptor de telemetría de navegación:
     *   '1'  fuerza la medición
     *   '0'  la apaga en cualquier entorno (interruptor de emergencia)
     *   ''   sin declarar: se mide sólo en producción
     */
    telemetria: '',
};