from flask import Flask, request, jsonify
from flask_cors import CORS
from models import Book, ReadingLog, init_db, get_session
from isbn_service import ISBNService
from barcode_scanner import create_barcode_endpoint
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import os

app = Flask(__name__)
CORS(app)

# Initialize database
db_session = init_db('library.db')

# Add barcode scanning endpoints
create_barcode_endpoint(app)

# ============= BOOK ENDPOINTS =============

@app.route('/api/books', methods=['GET'])
def get_books():
    """Get all books with optional filtering"""
    try:
        session = get_session()
        query = session.query(Book)
        
        # Apply filters
        search = request.args.get('search')
        language = request.args.get('language')
        genre = request.args.get('genre')
        author = request.args.get('author')
        
        if search:
            query = query.filter(
                (Book.title.ilike(f'%{search}%')) |
                (Book.author.ilike(f'%{search}%')) |
                (Book.isbn.ilike(f'%{search}%'))
            )
        
        if language:
            query = query.filter(Book.language == language)
        
        if genre:
            query = query.filter(Book.genre.ilike(f'%{genre}%'))
        
        if author:
            query = query.filter(Book.author.ilike(f'%{author}%'))
        
        books = query.all()
        session.close()
        
        return jsonify([book.to_dict() for book in books]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get a specific book by ID"""
    try:
        session = get_session()
        book = session.query(Book).filter(Book.id == book_id).first()
        session.close()
        
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        return jsonify(book.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books', methods=['POST'])
def create_book():
    """Create a new book entry"""
    try:
        data = request.json
        session = get_session()
        
        book = Book(
            isbn=data.get('isbn'),
            title=data['title'],
            author=data['author'],
            publisher=data.get('publisher'),
            publication_year=data.get('publication_year'),
            language=data.get('language'),
            genre=data.get('genre'),
            pages=data.get('pages'),
            location=data.get('location'),
            cover_image_url=data.get('cover_image_url'),
            description=data.get('description')
        )
        
        session.add(book)
        session.commit()
        book_dict = book.to_dict()
        session.close()
        
        return jsonify(book_dict), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    """Update an existing book"""
    try:
        data = request.json
        session = get_session()
        
        book = session.query(Book).filter(Book.id == book_id).first()
        if not book:
            session.close()
            return jsonify({'error': 'Book not found'}), 404
        
        # Update fields
        for key, value in data.items():
            if hasattr(book, key) and key != 'id':
                setattr(book, key, value)
        
        session.commit()
        book_dict = book.to_dict()
        session.close()
        
        return jsonify(book_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """Delete a book"""
    try:
        session = get_session()
        book = session.query(Book).filter(Book.id == book_id).first()
        
        if not book:
            session.close()
            return jsonify({'error': 'Book not found'}), 404
        
        session.delete(book)
        session.commit()
        session.close()
        
        return jsonify({'message': 'Book deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/isbn/<isbn>', methods=['GET'])
def fetch_book_by_isbn(isbn):
    """Fetch book information from ISBN using Google Books API"""
    try:
        book_info = ISBNService.fetch_book_info(isbn)
        
        if not book_info:
            return jsonify({'error': 'Book not found for this ISBN'}), 404
        
        return jsonify(book_info), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= READING LOG ENDPOINTS =============

@app.route('/api/reading-logs', methods=['GET'])
def get_reading_logs():
    """Get all reading logs with optional filtering"""
    try:
        session = get_session()
        query = session.query(ReadingLog)
        
        book_id = request.args.get('book_id')
        status = request.args.get('status')
        
        if book_id:
            query = query.filter(ReadingLog.book_id == book_id)
        
        if status:
            query = query.filter(ReadingLog.status == status)
        
        logs = query.order_by(ReadingLog.created_at.desc()).all()
        session.close()
        
        return jsonify([log.to_dict() for log in logs]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reading-logs', methods=['POST'])
def create_reading_log():
    """Create a new reading log entry"""
    try:
        data = request.json
        session = get_session()
        
        log = ReadingLog(
            book_id=data['book_id'],
            status=data['status'],
            start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
            borrower_name=data.get('borrower_name'),
            notes=data.get('notes'),
            rating=data.get('rating')
        )
        
        session.add(log)
        session.commit()
        log_dict = log.to_dict()
        session.close()
        
        return jsonify(log_dict), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reading-logs/<int:log_id>', methods=['PUT'])
def update_reading_log(log_id):
    """Update a reading log"""
    try:
        data = request.json
        session = get_session()
        
        log = session.query(ReadingLog).filter(ReadingLog.id == log_id).first()
        if not log:
            session.close()
            return jsonify({'error': 'Reading log not found'}), 404
        
        # Update fields
        for key, value in data.items():
            if hasattr(log, key) and key != 'id':
                if key in ['start_date', 'end_date'] and value:
                    setattr(log, key, datetime.fromisoformat(value))
                else:
                    setattr(log, key, value)
        
        session.commit()
        log_dict = log.to_dict()
        session.close()
        
        return jsonify(log_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= ANALYTICS ENDPOINTS =============

@app.route('/api/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """Get overall library statistics"""
    try:
        session = get_session()
        
        total_books = session.query(func.count(Book.id)).scalar()
        
        # Books by language
        books_by_language = session.query(
            Book.language,
            func.count(Book.id)
        ).group_by(Book.language).all()
        
        # Books by genre
        books_by_genre = session.query(
            Book.genre,
            func.count(Book.id)
        ).group_by(Book.genre).all()
        
        # Currently borrowed books
        borrowed_books = session.query(func.count(ReadingLog.id)).filter(
            ReadingLog.status == 'borrowed'
        ).scalar()
        
        # Books read this year
        current_year = datetime.now().year
        books_read_this_year = session.query(func.count(ReadingLog.id)).filter(
            ReadingLog.status == 'completed',
            extract('year', ReadingLog.end_date) == current_year
        ).scalar()
        
        session.close()
        
        return jsonify({
            'total_books': total_books,
            'books_by_language': [{'language': lang, 'count': count} for lang, count in books_by_language if lang],
            'books_by_genre': [{'genre': genre, 'count': count} for genre, count in books_by_genre if genre],
            'borrowed_books': borrowed_books,
            'books_read_this_year': books_read_this_year
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/weekly-pattern', methods=['GET'])
def get_weekly_pattern():
    """Get weekly reading patterns for the last 12 weeks"""
    try:
        session = get_session()
        
        # Calculate date 12 weeks ago
        twelve_weeks_ago = datetime.now() - timedelta(weeks=12)
        
        # Get completed books grouped by week
        weekly_data = session.query(
            func.strftime('%Y-%W', ReadingLog.end_date).label('week'),
            func.count(ReadingLog.id).label('count')
        ).filter(
            ReadingLog.status == 'completed',
            ReadingLog.end_date >= twelve_weeks_ago
        ).group_by('week').order_by('week').all()
        
        # Get books started grouped by week
        weekly_started = session.query(
            func.strftime('%Y-%W', ReadingLog.start_date).label('week'),
            func.count(ReadingLog.id).label('count')
        ).filter(
            ReadingLog.start_date >= twelve_weeks_ago
        ).group_by('week').order_by('week').all()
        
        session.close()
        
        return jsonify({
            'books_completed': [{'week': week, 'count': count} for week, count in weekly_data],
            'books_started': [{'week': week, 'count': count} for week, count in weekly_started]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/reading-stats', methods=['GET'])
def get_reading_stats():
    """Get detailed reading statistics"""
    try:
        session = get_session()
        
        # Average books per month
        current_year = datetime.now().year
        books_per_month = session.query(
            extract('month', ReadingLog.end_date).label('month'),
            func.count(ReadingLog.id).label('count')
        ).filter(
            ReadingLog.status == 'completed',
            extract('year', ReadingLog.end_date) == current_year
        ).group_by('month').all()
        
        # Most read genres
        genre_stats = session.query(
            Book.genre,
            func.count(ReadingLog.id).label('count')
        ).join(ReadingLog).filter(
            ReadingLog.status == 'completed'
        ).group_by(Book.genre).order_by(func.count(ReadingLog.id).desc()).limit(10).all()
        
        # Most read languages
        language_stats = session.query(
            Book.language,
            func.count(ReadingLog.id).label('count')
        ).join(ReadingLog).filter(
            ReadingLog.status == 'completed'
        ).group_by(Book.language).order_by(func.count(ReadingLog.id).desc()).all()
        
        # Average rating
        avg_rating = session.query(func.avg(ReadingLog.rating)).filter(
            ReadingLog.rating.isnot(None)
        ).scalar()
        
        session.close()
        
        return jsonify({
            'books_per_month': [{'month': int(month), 'count': count} for month, count in books_per_month],
            'top_genres': [{'genre': genre, 'count': count} for genre, count in genre_stats if genre],
            'languages_read': [{'language': lang, 'count': count} for lang, count in language_stats if lang],
            'average_rating': float(avg_rating) if avg_rating else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/filters', methods=['GET'])
def get_filter_options():
    """Get available filter options (languages, genres, authors)"""
    try:
        session = get_session()
        
        languages = session.query(Book.language).distinct().filter(Book.language.isnot(None)).all()
        genres = session.query(Book.genre).distinct().filter(Book.genre.isnot(None)).all()
        authors = session.query(Book.author).distinct().filter(Book.author.isnot(None)).all()
        
        session.close()
        
        return jsonify({
            'languages': sorted([lang[0] for lang in languages if lang[0]]),
            'genres': sorted([genre[0] for genre in genres if genre[0]]),
            'authors': sorted([author[0] for author in authors if author[0]])
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= HEALTH CHECK =============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Library Management System API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

# Made with Bob
