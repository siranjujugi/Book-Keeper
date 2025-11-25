# Library Management System - Backend

Python Flask backend for managing a personal library of 3000+ books with analytics.

## Features

- **Book Management**: CRUD operations for books with metadata
- **ISBN Scanning**: Automatic book info retrieval via barcode scanning
- **Reading Tracking**: Log reading progress, borrowing, and completion
- **Analytics**: Weekly reading patterns, genre statistics, language distribution
- **Search & Filter**: Find books by title, author, ISBN, language, genre

## Technology Stack

- **Framework**: Flask 3.0
- **Database**: SQLite with SQLAlchemy ORM
- **ISBN Lookup**: Google Books API
- **Barcode Scanning**: pyzbar (optional)

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Barcode Scanning Dependencies (Optional)

For barcode scanning functionality:

**macOS:**
```bash
brew install zbar
pip install pyzbar
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install libzbar0
pip install pyzbar
```

**Windows:**
Download zbar from: http://zbar.sourceforge.net/
Then: `pip install pyzbar`

### 3. Initialize Database

The database will be created automatically on first run.

```bash
python app.py
```

### 4. Run the Server

```bash
python app.py
```

Server will start at: `http://localhost:5000`

## API Endpoints

### Books

- `GET /api/books` - Get all books (with optional filters)
  - Query params: `search`, `language`, `genre`, `author`
- `GET /api/books/<id>` - Get specific book
- `POST /api/books` - Create new book
- `PUT /api/books/<id>` - Update book
- `DELETE /api/books/<id>` - Delete book
- `GET /api/books/isbn/<isbn>` - Fetch book info from ISBN

### Reading Logs

- `GET /api/reading-logs` - Get all reading logs
  - Query params: `book_id`, `status`
- `POST /api/reading-logs` - Create reading log
- `PUT /api/reading-logs/<id>` - Update reading log

### Analytics

- `GET /api/analytics/overview` - Overall library statistics
- `GET /api/analytics/weekly-pattern` - Weekly reading patterns (12 weeks)
- `GET /api/analytics/reading-stats` - Detailed reading statistics
- `GET /api/analytics/filters` - Available filter options

### Barcode Scanning

- `POST /api/scan-barcode` - Scan ISBN from image
- `GET /api/scanner-info` - Get scanner hardware recommendations

### Health Check

- `GET /api/health` - API health status

## Barcode Scanning Options

### Option 1: Smartphone Camera (FREE - Recommended)
- Use your phone's camera via the web interface
- Best quality and always available
- No additional hardware needed

### Option 2: USB Barcode Scanner ($20-30)
- Fastest option for bulk scanning
- Plug-and-play, works like a keyboard
- Recommended models:
  - Tera Wireless Barcode Scanner (~$25)
  - TaoTronics Wired Barcode Scanner (~$20)
  - Inateck Barcode Scanner (~$25)

### Option 3: USB Webcam ($15-25)
- Dual purpose (video calls + scanning)
- Requires good lighting
- Recommended models:
  - Logitech C270 (~$20)
  - Microsoft LifeCam (~$25)

**Recommendation**: Start with your smartphone (free). If you're adding 100+ books and want speed, invest in a USB barcode scanner.

## Database Schema

### Books Table
- id (Primary Key)
- isbn (Unique)
- title
- author
- publisher
- publication_year
- language
- genre
- pages
- location (physical location in library)
- cover_image_url
- description
- date_added

### Reading Logs Table
- id (Primary Key)
- book_id (Foreign Key)
- status (reading, completed, borrowed, returned)
- start_date
- end_date
- borrower_name
- notes
- rating (1-5)
- created_at

## Adding Books

### Method 1: Manual Entry
```bash
POST /api/books
{
  "title": "Book Title",
  "author": "Author Name",
  "language": "English",
  "genre": "Fiction"
}
```

### Method 2: ISBN Lookup
```bash
GET /api/books/isbn/9780134685991
```
Automatically fetches book details from Google Books API.

### Method 3: Barcode Scanning
1. Take photo of book's ISBN barcode
2. Upload via `/api/scan-barcode`
3. System extracts ISBN and fetches book details

## Analytics Examples

### Weekly Reading Pattern
Shows books completed and started per week for the last 12 weeks.

### Genre Distribution
Visualize which genres you read most.

### Language Statistics
Track books read across different languages.

### Monthly Trends
See reading patterns by month throughout the year.

## Development

### Project Structure
```
backend/
├── app.py                 # Main Flask application
├── models.py             # Database models
├── isbn_service.py       # ISBN lookup service
├── barcode_scanner.py    # Barcode scanning functionality
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
└── library.db           # SQLite database (created on first run)
```

### Running Tests
```bash
# TODO: Add tests
pytest
```

## Troubleshooting

### Issue: pyzbar not working
- Make sure zbar library is installed on your system
- On macOS: `brew install zbar`
- On Linux: `sudo apt-get install libzbar0`

### Issue: Google Books API rate limit
- The free tier has limits
- Consider adding API key in .env file
- Implement caching for frequently looked up ISBNs

### Issue: Database locked
- Close any other connections to library.db
- Restart the Flask server

## Future Enhancements

- [ ] Bulk import from CSV
- [ ] Export library catalog
- [ ] Book condition tracking
- [ ] Lending history
- [ ] Reading goals
- [ ] Book series tracking
- [ ] Multi-user support
- [ ] Mobile app

## License

Personal use project - no license specified.