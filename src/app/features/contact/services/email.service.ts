import { TrackingService } from '@/app/core/services/tracking.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface EmailData {
    name: string;
    email: string;
    message: string;
}

export interface ContactSaveResult {
    ok: boolean;
    id?: string;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmailService {
    constructor(
        private trackingService: TrackingService,
        private http: HttpClient,
    ) { }

    /**
     * Guarda el contacto en MongoDB (vía POST /api/contact).
     *
     * El aviso por email lo manda el servidor después de guardar, si tiene
     * RESEND_API_KEY: la clave nunca viaja al navegador (aquí rompía el build
     * porque `resend` arrastra dependencias de React al bundle).
     *
     * El guardado manda: si la base falla se lanza el error y el formulario
     * lo muestra.
     */
    async sendEmail(data: EmailData): Promise<ContactSaveResult> {
        const saved = await this.saveContact(data);

        this.trackingService.trackEvent({
            category: 'contact',
            action: 'email_sent',
            label: data.email
        });

        return { ok: true, id: saved.id };
    }

    /** Persiste en MongoDB Atlas (db `cdsmaia`) vía el endpoint del servidor. */
    private async saveContact(data: EmailData): Promise<{ id?: string }> {
        try {
            const resp = await firstValueFrom(
                this.http.post<{ ok: boolean; id?: string; error?: string }>('/api/contact', {
                    nombre: data.name,
                    email: data.email,
                    mensaje: data.message,
                }),
            );
            if (!resp?.ok) throw new Error(resp?.error ?? 'guardado rechazado');
            return { id: resp.id };
        } catch (error) {
            console.error('Error guardando el contacto en MongoDB:', error);
            throw error;
        }
    }


}