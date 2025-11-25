import { Routes } from '@angular/router';
import { BookListComponent } from './components/book-list/book-list.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';
import { BookFormComponent } from './components/book-form/book-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/books', pathMatch: 'full' },
  { path: 'books', component: BookListComponent },
  { path: 'books/new', component: BookFormComponent },
  { path: 'books/edit/:id', component: BookFormComponent },
  { path: 'analytics', component: AnalyticsDashboardComponent },
];

// Made with Bob
