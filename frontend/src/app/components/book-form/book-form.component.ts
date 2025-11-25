import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Book } from '../../models/book.model';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BarcodeScannerComponent],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss'
})
export class BookFormComponent implements OnInit {
  book: Book = {
    title: '',
    author: '',
    publisher: '',
    publication_year: undefined,
    language: '',
    genre: '',
    pages: undefined,
    location: '',
    isbn: '',
    description: ''
  };

  isEditMode: boolean = false;
  bookId: number | null = null;
  loading: boolean = false;
  error: string = '';
  showScanner: boolean = false;
  fetchingISBN: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.bookId = +params['id'];
        this.loadBook(this.bookId);
      }
    });
  }

  loadBook(id: number): void {
    this.loading = true;
    this.apiService.getBook(id).subscribe({
      next: (book) => {
        this.book = book;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load book';
        this.loading = false;
        console.error('Error loading book:', err);
      }
    });
  }

  onISBNScanned(isbn: string): void {
    this.book.isbn = isbn;
    this.showScanner = false;
    this.fetchBookInfoFromISBN();
  }

  fetchBookInfoFromISBN(): void {
    if (!this.book.isbn) {
      return;
    }

    this.fetchingISBN = true;
    this.error = '';

    this.apiService.fetchBookByISBN(this.book.isbn).subscribe({
      next: (bookInfo) => {
        // Merge fetched info with existing book data
        this.book = {
          ...this.book,
          ...bookInfo,
          // Keep the original ID if in edit mode
          id: this.book.id
        };
        this.fetchingISBN = false;
      },
      error: (err) => {
        this.error = 'Could not fetch book information for this ISBN. Please enter details manually.';
        this.fetchingISBN = false;
        console.error('Error fetching ISBN:', err);
      }
    });
  }

  onSubmit(): void {
    if (!this.book.title || !this.book.author) {
      this.error = 'Title and Author are required';
      return;
    }

    this.loading = true;
    this.error = '';

    const operation = this.isEditMode
      ? this.apiService.updateBook(this.bookId!, this.book)
      : this.apiService.createBook(this.book);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/books']);
      },
      error: (err) => {
        this.error = 'Failed to save book';
        this.loading = false;
        console.error('Error saving book:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/books']);
  }
}

// Made with Bob
