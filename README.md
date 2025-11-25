# Personal Library Management System

A comprehensive digital library management system for tracking and analyzing your personal book collection of 3000+ books. Built with Python Flask backend and Angular frontend.

## 🎯 Features

### Core Functionality
- **Book Management**: Add, edit, delete, and search books
- **ISBN Scanning**: Automatic book info retrieval via barcode scanning
- **Multi-language Support**: Track books across different languages
- **Physical Location Tracking**: Remember where each book is stored
- **Reading Logs**: Track reading progress, completion, and borrowing

### Analytics (No Recommendations!)
- **Weekly Reading Patterns**: Visualize reading habits over 12 weeks
- **Monthly Statistics**: Books read per month
- **Language Distribution**: See your multilingual collection breakdown
- **Genre Analysis**: Most-read genres and collection distribution
- **Reading Metrics**: Average ratings and completion rates

### Search & Filter
- Search by title, author, or ISBN
- Filter by language, genre, or author
- Real-time filtering with instant results

## 🛠️ Technology Stack

### Backend
- **Python 3.13+**
- **Flask 3.0** - Web framework
- **SQLAlchemy 2.0** - ORM
- **SQLite** - Database
- **Google Books API** - ISBN lookup
- **pyzbar** - Barcode scanning (optional)

### Frontend
- **Angular 18+**
- **TypeScript**
- **SCSS** - Styling
- **Standalone Components**

## 📦 Installation

### Prerequisites
- Python 3.13+
- Node.js 18+ and npm
- (Optional) zbar library for barcode scanning

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Install barcode scanning dependencies
# macOS:
brew install zbar

# Linux (Ubuntu/Debian):
sudo apt-get install libzbar0

# Windows: Download from http://zbar.sourceforge.net/

# Run the backend server
python app.py
```

Backend will start at: `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
ng serve
```

Frontend will start at: `http://localhost:4200`

## 🚀 Usage

### Adding Books

#### Method 1: Manual Entry
1. Click "Add New Book" button
2. Fill in book details (Title and Author are required)
3. Click "Add Book"

#### Method 2: ISBN Lookup
1. Click "Add New Book"
2. Enter ISBN in the ISBN field
3. Click "Fetch Info" to automatically retrieve book details from Google Books
4. Review and edit details if needed
5. Click "Add Book"

#### Method 3: Barcode Scanning
1. Click "Add New Book"
2. Click "📷 Scan Barcode"
3. Take a photo of the book's ISBN barcode using your phone or webcam
4. System automatically extracts ISBN and fetches book info
5. Review and save

### Barcode Scanning Options

#### Option 1: Smartphone Camera (FREE - Recommended)
- Use your phone's camera via the web interface
- Best quality and always available
- No additional hardware needed
- **How to use**: Open the web app on your phone, click scan barcode, take photo

#### Option 2: USB Barcode Scanner ($20-30)
- Fastest option for bulk scanning
- Plug-and-play, works like a keyboard
- **Recommended models**:
  - Tera Wireless Barcode Scanner (~$25)
  - TaoTronics Wired Barcode Scanner (~$20)
  - Inateck Barcode Scanner (~$25)

#### Option 3: USB Webcam ($15-25)
- Dual purpose (video calls + scanning)
- Requires good lighting
- **Recommended models**:
  - Logitech C270 (~$20)
  - Microsoft LifeCam (~$25)

**Our Recommendation**: Start with your smartphone (free). If you're adding 100+ books and want speed, invest in a USB barcode scanner.

### Managing Your Library

#### Search and Filter
- Use the search box to find books by title, author, or ISBN
- Filter by language, genre, or author using dropdown menus
- Combine multiple filters for precise results
- Click "Clear Filters" to reset

#### Editing Books
1. Click "Edit" button on any book card
2. Modify the details
3. Click "Update Book"

#### Deleting Books
1. Click "Delete" button on any book card
2. Confirm deletion

### Viewing Analytics

Navigate to the Analytics tab to see:
- Total books in collection
- Books read this year
- Currently borrowed books
- Average rating
- Weekly reading patterns (last 12 weeks)
- Monthly reading trends
- Language distribution
- Genre statistics

**Note**: Analytics are purely data-driven with NO recommendations!

## 📊 Database Schema

### Books Table
- `id`: Primary key
- `isbn`: ISBN-10 or ISBN-13 (unique)
- `title`: Book title (required)
- `author`: Author name (required)
- `publisher`: Publisher name
- `publication_year`: Year published
- `language`: Book language
- `genre`: Genre/category
- `pages`: Number of pages
- `location`: Physical location in your library
- `cover_image_url`: URL to cover image
- `description`: Book description
- `date_added`: Timestamp when added

### Reading Logs Table
- `id`: Primary key
- `book_id`: Foreign key to books
- `status`: reading, completed, borrowed, returned
- `start_date`: When started reading
- `end_date`: When completed
- `borrower_name`: Name of borrower (if applicable)
- `notes`: Personal notes
- `rating`: Rating 1-5
- `created_at`: Timestamp

## 🔧 API Endpoints

### Books
- `GET /api/books` - Get all books (with filters)
- `GET /api/books/<id>` - Get specific book
- `POST /api/books` - Create new book
- `PUT /api/books/<id>` - Update book
- `DELETE /api/books/<id>` - Delete book
- `GET /api/books/isbn/<isbn>` - Fetch book info from ISBN

### Reading Logs
- `GET /api/reading-logs` - Get all reading logs
- `POST /api/reading-logs` - Create reading log
- `PUT /api/reading-logs/<id>` - Update reading log

### Analytics
- `GET /api/analytics/overview` - Overall statistics
- `GET /api/analytics/weekly-pattern` - Weekly reading patterns
- `GET /api/analytics/reading-stats` - Detailed reading statistics
- `GET /api/analytics/filters` - Available filter options

### Barcode Scanning
- `POST /api/scan-barcode` - Scan ISBN from image
- `GET /api/scanner-info` - Get scanner recommendations

## 🎨 Screenshots

(Add screenshots of your application here)

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📝 License

Personal use project - no license specified.

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `pyzbar` not working
- **Solution**: Install zbar library on your system
  - macOS: `brew install zbar`
  - Linux: `sudo apt-get install libzbar0`
  - Windows: Download from http://zbar.sourceforge.net/

**Issue**: Google Books API rate limit
- **Solution**: The free tier has limits. Consider adding an API key in `.env` file

**Issue**: Database locked
- **Solution**: Close any other connections to `library.db` and restart the server

### Frontend Issues

**Issue**: CORS errors
- **Solution**: Make sure Flask-CORS is installed and backend is running

**Issue**: Cannot connect to backend
- **Solution**: Verify backend is running on `http://localhost:5000`

## 🚀 Future Enhancements

- [ ] Bulk import from CSV
- [ ] Export library catalog
- [ ] Book condition tracking
- [ ] Lending history with reminders
- [ ] Reading goals and challenges
- [ ] Book series tracking
- [ ] Multi-user support
- [ ] Mobile app (iOS/Android)
- [ ] Backup and restore functionality
- [ ] Advanced search with boolean operators

## 📧 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for book lovers who want to organize their personal library without algorithmic recommendations!**