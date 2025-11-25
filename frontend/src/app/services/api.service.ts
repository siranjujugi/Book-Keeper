import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Book, 
  ReadingLog, 
  AnalyticsOverview, 
  WeeklyPattern, 
  ReadingStats,
  FilterOptions 
} from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5001/api';

  constructor(private http: HttpClient) { }

  // ============= BOOK ENDPOINTS =============

  getBooks(filters?: { search?: string; language?: string; genre?: string; author?: string }): Observable<Book[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.language) params = params.set('language', filters.language);
      if (filters.genre) params = params.set('genre', filters.genre);
      if (filters.author) params = params.set('author', filters.author);
    }
    return this.http.get<Book[]>(`${this.apiUrl}/books`, { params });
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/${id}`);
  }

  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/books`, book);
  }

  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/books/${id}`, book);
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/books/${id}`);
  }

  fetchBookByISBN(isbn: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/isbn/${isbn}`);
  }

  // ============= READING LOG ENDPOINTS =============

  getReadingLogs(filters?: { book_id?: number; status?: string }): Observable<ReadingLog[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.book_id) params = params.set('book_id', filters.book_id.toString());
      if (filters.status) params = params.set('status', filters.status);
    }
    return this.http.get<ReadingLog[]>(`${this.apiUrl}/reading-logs`, { params });
  }

  createReadingLog(log: ReadingLog): Observable<ReadingLog> {
    return this.http.post<ReadingLog>(`${this.apiUrl}/reading-logs`, log);
  }

  updateReadingLog(id: number, log: ReadingLog): Observable<ReadingLog> {
    return this.http.put<ReadingLog>(`${this.apiUrl}/reading-logs/${id}`, log);
  }

  // ============= ANALYTICS ENDPOINTS =============

  getAnalyticsOverview(): Observable<AnalyticsOverview> {
    return this.http.get<AnalyticsOverview>(`${this.apiUrl}/analytics/overview`);
  }

  getWeeklyPattern(): Observable<WeeklyPattern> {
    return this.http.get<WeeklyPattern>(`${this.apiUrl}/analytics/weekly-pattern`);
  }

  getReadingStats(): Observable<ReadingStats> {
    return this.http.get<ReadingStats>(`${this.apiUrl}/analytics/reading-stats`);
  }

  getFilterOptions(): Observable<FilterOptions> {
    return this.http.get<FilterOptions>(`${this.apiUrl}/analytics/filters`);
  }

  // ============= BARCODE SCANNING =============

  scanBarcode(imageData: string | File): Observable<{ success: boolean; isbn?: string; message: string }> {
    const formData = new FormData();
    if (typeof imageData === 'string') {
      return this.http.post<{ success: boolean; isbn?: string; message: string }>(
        `${this.apiUrl}/scan-barcode`,
        { image: imageData }
      );
    } else {
      formData.append('image', imageData);
      return this.http.post<{ success: boolean; isbn?: string; message: string }>(
        `${this.apiUrl}/scan-barcode`,
        formData
      );
    }
  }

  getScannerInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/scanner-info`);
  }

  // ============= HEALTH CHECK =============

  healthCheck(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(`${this.apiUrl}/health`);
  }
}

// Made with Bob
