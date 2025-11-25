import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss'
})
export class BarcodeScannerComponent {
  @Output() isbnScanned = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  scanning: boolean = false;
  error: string = '';
  instructions: string = '';

  constructor(private apiService: ApiService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    this.scanning = true;
    this.error = '';
    this.instructions = 'Scanning barcode...';

    this.apiService.scanBarcode(file).subscribe({
      next: (response) => {
        if (response.success && response.isbn) {
          this.isbnScanned.emit(response.isbn);
          this.scanning = false;
        } else {
          this.error = response.message || 'No barcode detected. Please try again with better lighting.';
          this.scanning = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to scan barcode. Make sure the backend server is running.';
        this.scanning = false;
        console.error('Barcode scan error:', err);
      }
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

// Made with Bob
