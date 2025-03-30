import { Injectable } from '@angular/core';
import { Resend } from 'resend';
import { TrackingService } from '@/app/core/services/tracking.service';
import { environment } from '@/environments/environment';

export interface EmailData {
    name: string;
    email: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmailService {
    private resend: Resend;

    constructor(private trackingService: TrackingService) {
        // Initialize Resend with the API key
        // NOTE: In production, this key should be in environment variables
        this.resend = new Resend('re_XXXXXXXX'); // Replace with your Resend API key
    }

    /**
     * Sends an email using Resend
     * @param data Contact form data
     * @returns Promise with the sending result
     */
    async sendEmail(data: EmailData): Promise<any> {
        try {
            // Get tracking statistics
            const trackingEvents = this.trackingService.getEvents();

            // Format tracking statistics to include them in the email
            const trackingStats = this.formatTrackingStats(trackingEvents);

            // Send the email with Resend
            const response = await this.resend.emails.send({
                from: 'Portfolio Contact <onboarding@resend.dev>', // Use a verified domain in production
                to: 'yovanysuarezsilva@gmail.com',
                subject: `New contact message from ${data.name}`,
                html: `
          <h2>New contact message</h2>
          <p><strong>Name:</strong> ${this.sanitizeHtml(data.name)}</p>
          <p><strong>Email:</strong> ${this.sanitizeHtml(data.email)}</p>
          <p><strong>Message:</strong></p>
          <p>${this.sanitizeHtml(data.message)}</p>
          
          <hr>
          <h3>Tracking Statistics</h3>
          ${trackingStats}
        `,
            });

            // Register the email sending event in tracking
            this.trackingService.trackEvent({
                category: 'contact',
                action: 'email_sent',
                label: data.email
            });

            return response;
        } catch (error) {
            console.error('Error sending the email:', error);
            throw error;
        }
    }

    /**
     * Formats tracking statistics to include them in the email
     * @param events Tracking events
     * @returns HTML formatted with statistics
     */
    private formatTrackingStats(events: any[]): string {
        if (!events || events.length === 0) {
            return '<p>No tracking data available.</p>';
        }

        // Group events by category
        const eventsByCategory: Record<string, any[]> = {};
        events.forEach(event => {
            if (!eventsByCategory[event.category]) {
                eventsByCategory[event.category] = [];
            }
            eventsByCategory[event.category].push(event);
        });

        // Create HTML with statistics
        let statsHtml = '';

        // General summary
        statsHtml += `<p><strong>Total events:</strong> ${events.length}</p>`;

        // Details by category
        statsHtml += '<ul>';
        for (const category in eventsByCategory) {
            const categoryEvents = eventsByCategory[category];
            statsHtml += `
        <li>
          <strong>${this.capitalizeFirstLetter(category)}:</strong> ${categoryEvents.length} events
          <ul>
      `;

            // Group by action within each category
            const actionCounts: Record<string, number> = {};
            categoryEvents.forEach(event => {
                if (!actionCounts[event.action]) {
                    actionCounts[event.action] = 0;
                }
                actionCounts[event.action]++;
            });

            // Show count by action
            for (const action in actionCounts) {
                statsHtml += `<li>${this.capitalizeFirstLetter(action)}: ${actionCounts[action]}</li>`;
            }

            statsHtml += '</ul></li>';
        }
        statsHtml += '</ul>';

        return statsHtml;
    }

    /**
     * Sanitizes HTML to prevent code injections
     * @param input Text to sanitize
     * @returns Sanitized text
     */
    private sanitizeHtml(input: string): string {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Capitalizes the first letter of a string
     * @param str String to capitalize
     * @returns Capitalized string
     */
    private capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}