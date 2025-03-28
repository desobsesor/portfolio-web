import { Injectable } from '@angular/core';
import { TrackingEvent, TrackingService } from '@/app/core/services/tracking.service';
import { format } from 'date-fns';
import { ChartConfiguration, ChartData } from 'chart.js';
import { AnalyticsChartData, AnalyticsMetrics, ChartOptions } from '../models/analytics.model';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsDataService {
    private recentEvents: TrackingEvent[] = [];

    constructor(private trackingService: TrackingService) { }

    /**
     * Load tracking data from service
     */
    loadTrackingData(): TrackingEvent[] {
        const allEvents = this.trackingService.getEvents();
        // Sort events by timestamp (newest first)
        this.recentEvents = [...allEvents].sort((a, b) => {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
        return this.recentEvents;
    }

    /**
     * Get chart options
     */
    getChartOptions(): ChartOptions {
        return {
            lineChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                }
            },
            pieChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                }
            },
            barChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };
    }

    /**
     * Get analytics metrics
     */
    getAnalyticsMetrics(): AnalyticsMetrics {
        return {
            pageViewCount: this.getPageViewCount(),
            projectInteractionsCount: this.getProjectInteractionsCount(),
            externalLinkClicksCount: this.getExternalLinkClicksCount()
        };
    }

    /**
     * Initialize chart data
     */
    getChartData(): AnalyticsChartData {
        return {
            pageViewsChartData: this.createPageViewsChart(),
            categoryChartData: this.createCategoryDistributionChart(),
            projectsChartData: this.createProjectInteractionsChart()
        };
    }

    /**
     * Create page views over time chart
     */
    createPageViewsChart(): ChartData {
        const pageViewEvents = this.recentEvents.filter(event =>
            event.category === 'navigation' && event.action === 'page_view'
        ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        const pageViewsByDay = this.groupEventsByDay(pageViewEvents);
        return {
            labels: Object.keys(pageViewsByDay),
            datasets: [{
                label: 'Page Views',
                data: Object.values(pageViewsByDay),
                borderColor: '#4e9af1',
                backgroundColor: 'rgba(78, 154, 241, 0.2)',
                tension: 0.3,
                fill: true
            }]
        };
    }

    /**
     * Create category distribution chart
     */
    createCategoryDistributionChart(): ChartData {
        // Count events by category
        const categoryCounts: Record<string, number> = {};
        this.recentEvents.forEach(event => {
            categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
        });

        // Generate colors for each category
        const backgroundColors = [
            'rgba(78, 154, 241, 0.7)',  // Blue
            'rgba(241, 130, 141, 0.7)',  // Pink
            'rgba(144, 190, 109, 0.7)',  // Green
            'rgba(249, 170, 51, 0.7)',   // Orange
            'rgba(153, 102, 255, 0.7)'   // Purple
        ];

        return {
            labels: Object.keys(categoryCounts),
            datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: backgroundColors.slice(0, Object.keys(categoryCounts).length),
                borderWidth: 1
            }]
        };
    }

    /**
     * Create project interactions chart
     */
    createProjectInteractionsChart(): ChartData {
        // Get all project events
        const projectEvents = this.recentEvents.filter(event =>
            event.category === 'projects'
        );

        // Count by action type
        const actionCounts: Record<string, number> = {};
        projectEvents.forEach(event => {
            actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
        });

        return {
            labels: Object.keys(actionCounts),
            datasets: [{
                data: Object.values(actionCounts),
                backgroundColor: 'rgba(144, 190, 109, 0.7)',
                borderColor: 'rgba(144, 190, 109, 1)',
                borderWidth: 1
            }]
        };
    }

    /**
     * Group events by day for time-series charts
     */
    groupEventsByDay(events: TrackingEvent[]): Record<string, number> {
        const result: Record<string, number> = {};

        events.forEach(event => {
            if (event.timestamp) {
                const date = new Date(event.timestamp);
                const dayStr = format(date, 'MMM dd');

                result[dayStr] = (result[dayStr] || 0) + 1;
            }
        });

        return result;
    }

    /**
     * Get count of page views
     */
    getPageViewCount(): number {
        return this.recentEvents.filter(event =>
            event.category === 'navigation' && event.action === 'page_view'
        ).length;
    }

    /**
     * Get count of project interactions
     */
    getProjectInteractionsCount(): number {
        return this.recentEvents.filter(event =>
            event.category === 'projects'
        ).length;
    }

    /**
     * Get count of external link clicks
     */
    getExternalLinkClicksCount(): number {
        return this.recentEvents.filter(event =>
            event.category === 'external_link' && event.action === 'click'
        ).length;
    }

    /**
     * Format timestamp to readable date
     */
    formatTimestamp(timestamp?: number): string {
        if (!timestamp) return 'Unknown';

        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    /**
     * Clear all tracking data
     */
    clearTrackingData(): void {
        this.trackingService.clearEvents();
        this.recentEvents = [];
    }
}