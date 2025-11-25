import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Book, FilterOptions } from '../../models/book.model';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss'
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  filterOptions: FilterOptions = { languages: [], genres: [], authors: [] };
  
  searchTerm: string = '';
  selectedLanguage: string = '';
  selectedGenre: string = '';
  selectedAuthor: string = '';
  
  loading: boolean = false;
  error: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadBooks();
    this.loadFilterOptions();
  }

  loadBooks(): void {
    this.loading = true;
    this.error = '';
    
    this.apiService.getBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load books. Please make sure the backend server is running.';
        this.loading = false;
        console.error('Error loading books:', err);
      }
    });
  }

  loadFilterOptions(): void {
    this.apiService.getFilterOptions().subscribe({
      next: (options) => {
        this.filterOptions = options;
      },
      error: (err) => {
        console.error('Error loading filter options:', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredBooks = this.books.filter(book => {
      const matchesSearch = !this.searchTerm || 
        book.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (book.isbn && book.isbn.includes(this.searchTerm));
      
      const matchesLanguage = !this.selectedLanguage || book.language === this.selectedLanguage;
      const matchesGenre = !this.selectedGenre || book.genre?.includes(this.selectedGenre);
      const matchesAuthor = !this.selectedAuthor || book.author === this.selectedAuthor;
      
      return matchesSearch && matchesLanguage && matchesGenre && matchesAuthor;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLanguage = '';
    this.selectedGenre = '';
    this.selectedAuthor = '';
    this.applyFilters();
  }

  deleteBook(id: number): void {
    if (confirm('Are you sure you want to delete this book?')) {
      this.apiService.deleteBook(id).subscribe({
        next: () => {
          this.loadBooks();
        },
        error: (err) => {
          alert('Failed to delete book');
          console.error('Error deleting book:', err);
        }
      });
    }
  }
}

// Made with Bob
