from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

class Book(Base):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True)
    isbn = Column(String(13), unique=True, nullable=True)
    title = Column(String(500), nullable=False)
    author = Column(String(300), nullable=False)
    publisher = Column(String(200))
    publication_year = Column(Integer)
    language = Column(String(50))
    genre = Column(String(100))
    pages = Column(Integer)
    location = Column(String(100))  # Physical location in your library
    cover_image_url = Column(String(500))
    description = Column(Text)
    date_added = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    reading_logs = relationship('ReadingLog', back_populates='book', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'isbn': self.isbn,
            'title': self.title,
            'author': self.author,
            'publisher': self.publisher,
            'publication_year': self.publication_year,
            'language': self.language,
            'genre': self.genre,
            'pages': self.pages,
            'location': self.location,
            'cover_image_url': self.cover_image_url,
            'description': self.description,
            'date_added': self.date_added.isoformat() if self.date_added else None
        }

class ReadingLog(Base):
    __tablename__ = 'reading_logs'
    
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey('books.id'), nullable=False)
    status = Column(String(20), nullable=False)  # 'reading', 'completed', 'borrowed', 'returned'
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    borrower_name = Column(String(200))  # If book is borrowed
    notes = Column(Text)
    rating = Column(Float)  # Personal rating 1-5
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship('Book', back_populates='reading_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'borrower_name': self.borrower_name,
            'notes': self.notes,
            'rating': self.rating,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Database initialization
def init_db(db_path='library.db'):
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()

def get_session(db_path='library.db'):
    engine = create_engine(f'sqlite:///{db_path}')
    Session = sessionmaker(bind=engine)
    return Session()

# Made with Bob
