import requests
from typing import Optional, Dict

class ISBNService:
    """Service to fetch book information from ISBN using Google Books API"""
    
    GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"
    
    @staticmethod
    def fetch_book_info(isbn: str) -> Optional[Dict]:
        """
        Fetch book information from Google Books API using ISBN
        
        Args:
            isbn: ISBN-10 or ISBN-13 number
            
        Returns:
            Dictionary with book information or None if not found
        """
        try:
            # Clean ISBN (remove hyphens and spaces)
            clean_isbn = isbn.replace('-', '').replace(' ', '')
            
            # Query Google Books API
            params = {'q': f'isbn:{clean_isbn}'}
            response = requests.get(ISBNService.GOOGLE_BOOKS_API, params=params, timeout=10)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            if 'items' not in data or len(data['items']) == 0:
                return None
            
            # Extract book information from first result
            book_data = data['items'][0]['volumeInfo']
            
            # Extract relevant fields
            book_info = {
                'title': book_data.get('title', ''),
                'author': ', '.join(book_data.get('authors', [])),
                'publisher': book_data.get('publisher', ''),
                'publication_year': ISBNService._extract_year(book_data.get('publishedDate', '')),
                'language': book_data.get('language', ''),
                'pages': book_data.get('pageCount'),
                'description': book_data.get('description', ''),
                'cover_image_url': ISBNService._get_cover_image(book_data),
                'genre': ', '.join(book_data.get('categories', [])),
                'isbn': clean_isbn
            }
            
            return book_info
            
        except Exception as e:
            print(f"Error fetching book info for ISBN {isbn}: {str(e)}")
            return None
    
    @staticmethod
    def _extract_year(date_string: str) -> Optional[int]:
        """Extract year from date string (format: YYYY-MM-DD or YYYY)"""
        if not date_string:
            return None
        try:
            return int(date_string.split('-')[0])
        except (ValueError, IndexError):
            return None
    
    @staticmethod
    def _get_cover_image(book_data: Dict) -> Optional[str]:
        """Get the best quality cover image URL"""
        image_links = book_data.get('imageLinks', {})
        
        # Prefer larger images
        for size in ['extraLarge', 'large', 'medium', 'small', 'thumbnail', 'smallThumbnail']:
            if size in image_links:
                return image_links[size]
        
        return None

# Made with Bob
