import { TrackingEvent, TrackingService } from '@/app/core/services/tracking.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';

import { ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsDataService } from '../../services/analytics-data.service';
import { AnalyticsChartData, AnalyticsMetrics, ChartOptions } from '../../models/analytics.model';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent implements OnInit, AfterViewInit {
  recentEvents: TrackingEvent[] = [];
  chartData: AnalyticsChartData = {
    pageViewsChartData: { datasets: [] },
    categoryChartData: { datasets: [] },
    projectsChartData: { datasets: [] }
  };
  chartOptions: ChartOptions;
  metrics: AnalyticsMetrics = {
    pageViewCount: 0,
    projectInteractionsCount: 0,
    externalLinkClicksCount: 0
  };

  constructor(
    private trackingService: TrackingService,
    private analyticsDataService: AnalyticsDataService
  ) {
    this.chartOptions = this.analyticsDataService.getChartOptions();
  }

  ngOnInit(): void {
    this.trackingService.trackPageView('/analytics');
    this.loadTrackingData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  /**
   * Load tracking data from service
   */
  loadTrackingData(): void {
    this.recentEvents = this.analyticsDataService.loadTrackingData();
    this.metrics = this.analyticsDataService.getAnalyticsMetrics();
  }

  /**
   * Initialize chart data
   */
  initializeCharts(): void {
    this.chartData = this.analyticsDataService.getChartData();
  }

  /**
   * Format timestamp to readable date
   */
  formatTimestamp(timestamp?: number): string {
    return this.analyticsDataService.formatTimestamp(timestamp);
  }

  /**
   * Clear all tracking data
   */
  clearTrackingData(): void {
    if (confirm('Are you sure you want to clear all tracking data?')) {
      this.analyticsDataService.clearTrackingData();
      this.recentEvents = [];
      this.metrics = {
        pageViewCount: 0,
        projectInteractionsCount: 0,
        externalLinkClicksCount: 0
      };
      // Reset charts
      this.initializeCharts();
    }
  }
}