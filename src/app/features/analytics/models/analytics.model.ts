/**
 * Models for analytics feature
 */

import { ChartConfiguration, ChartData } from 'chart.js';
import { TrackingEvent } from '@/app/core/services/tracking.service';

/**
 * Interface for chart options
 */
export interface ChartOptions {
  lineChartOptions: ChartConfiguration['options'];
  pieChartOptions: ChartConfiguration['options'];
  barChartOptions: ChartConfiguration['options'];
}

/**
 * Interface for chart data
 */
export interface AnalyticsChartData {
  pageViewsChartData: ChartData;
  categoryChartData: ChartData;
  projectsChartData: ChartData;
}

/**
 * Interface for analytics metrics
 */
export interface AnalyticsMetrics {
  pageViewCount: number;
  projectInteractionsCount: number;
  externalLinkClicksCount: number;
}