import { isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
//import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

/**
 * Interface for tracking events
 */
export interface TrackingEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
    timestamp?: number;
}

/**
 * Service for tracking user interactions in the portfolio
 */
@Injectable({
    providedIn: 'root'
})
export class TrackingService {
    private events: TrackingEvent[] = [];
    private isEnabled = true;
    private sessionId: string;
    private isBrowser: boolean;

    constructor(
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        // Check if we're in the browser
        this.isBrowser = isPlatformBrowser(this.platformId);

        // Generate a unique session ID
        this.sessionId = this.generateSessionId();

        // Track page views automatically
        this.setupPageViewTracking();

        // Store events in localStorage when user leaves (browser only)
        if (this.isBrowser) {
            window.addEventListener('beforeunload', () => this.persistEvents());
        }
    }

    /**
     * Initialize tracking service with optional configuration
     */
    public init(options?: { enabled?: boolean }): void {
        if (options) {
            this.isEnabled = options.enabled ?? true;
        }

        // Track initial page view (browser only)
        if (this.isBrowser) {
            this.trackPageView(window.location.pathname);
        }

        console.log('Tracking service initialized', {
            enabled: this.isEnabled,
            sessionId: this.sessionId,
            isBrowser: this.isBrowser
        });
    }

    /**
     * Track a user event
     */
    public trackEvent(event: TrackingEvent): void {
        if (!this.isEnabled) return;

        const enrichedEvent = {
            ...event,
            timestamp: Date.now(),
        };

        this.events.push(enrichedEvent);
        console.log('Event tracked:', enrichedEvent);

        // In a real implementation, you might want to send this to a backend or analytics service
        this.sendToAnalyticsService(enrichedEvent);
    }

    /**
     * Track a page view
     */
    public trackPageView(path: string): void {
        this.trackEvent({
            category: 'navigation',
            action: 'page_view',
            label: path
        });
    }

    /**
     * Track a project click
     */
    public trackProjectClick(projectTitle: string): void {
        this.trackEvent({
            category: 'projects',
            action: 'click',
            label: projectTitle
        });
    }

    /**
     * Track a project view (modal opened)
     */
    public trackProjectView(projectTitle: string): void {
        this.trackEvent({
            category: 'projects',
            action: 'view',
            label: projectTitle
        });
    }

    /**
     * Track external link click
     */
    public trackExternalLinkClick(url: string, context: string): void {
        this.trackEvent({
            category: 'external_link',
            action: 'click',
            label: `${context}: ${url}`
        });
    }

    /**
     * Get all tracked events
     */
    public getEvents(): TrackingEvent[] {
        return [...this.events];
    }

    /**
     * Clear all tracked events
     */
    public clearEvents(): void {
        this.events = [];
        if (this.isBrowser) {
            localStorage.removeItem(`portfolio_events_${this.sessionId}`);
        }
    }

    /**
     * Setup automatic page view tracking
     */
    private setupPageViewTracking(): void {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.trackPageView(event.urlAfterRedirects);
        });
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Persist events to localStorage
     */
    private persistEvents(): void {
        if (this.isBrowser && this.events.length > 0) {
            localStorage.setItem(
                `portfolio_events_${this.sessionId}`,
                JSON.stringify(this.events)
            );
        }
    }

    /**
     * Send event to analytics service (placeholder for real implementation)
     */
    private sendToAnalyticsService(event: TrackingEvent): void {
        // In a real implementation, this would send data to Google Analytics, Firebase, or a custom backend
        // For now, we'll just log to console and store locally

        // Example implementation for Google Analytics (if it were included):
        // if (typeof gtag === 'function') {
        //   gtag('event', event.action, {
        //     'event_category': event.category,
        //     'event_label': event.label,
        //     'value': event.value
        //   });
        // }
    }
}