import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AnalyticsOverview, WeeklyPattern, ReadingStats } from '../../models/book.model';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent implements OnInit {
  overview: AnalyticsOverview | null = null;
  weeklyPattern: WeeklyPattern | null = null;
  readingStats: ReadingStats | null = null;
  loading: boolean = false;
  error: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';

    // Load all analytics data
    Promise.all([
      this.apiService.getAnalyticsOverview().toPromise(),
      this.apiService.getWeeklyPattern().toPromise(),
      this.apiService.getReadingStats().toPromise()
    ]).then(([overview, weekly, stats]) => {
      this.overview = overview!;
      this.weeklyPattern = weekly!;
      this.readingStats = stats!;
      this.loading = false;
    }).catch(err => {
      this.error = 'Failed to load analytics. Please make sure the backend server is running.';
      this.loading = false;
      console.error('Error loading analytics:', err);
    });
  }

  getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }

  getWeekLabel(weekString: string): string {
    // Convert "2024-47" to "Week 47"
    const parts = weekString.split('-');
    return parts.length === 2 ? `Week ${parts[1]}` : weekString;
  }

  getMaxCount(data: { count: number }[]): number {
    return Math.max(...data.map(d => d.count), 1);
  }

  getBarWidth(count: number, max: number): number {
    return (count / max) * 100;
  }
}

// Made with Bob
