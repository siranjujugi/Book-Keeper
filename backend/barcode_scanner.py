"""
Barcode Scanner Module for ISBN Detection

This module provides functionality to scan ISBN barcodes using:
1. Webcam/USB camera (for desktop use)
2. Mobile phone camera (via web interface)

For best results with physical books:
- Use good lighting
- Hold the barcode steady and flat
- Ensure the barcode is in focus
- Try different angles if not detecting

Hardware Options:
1. FREE: Use your smartphone camera via the web interface
2. Budget (~$20-30): USB Barcode Scanner (plug-and-play, works like keyboard)
3. Budget (~$15-25): Webcam with good resolution (720p or higher)

Recommended: Start with your smartphone - it's free and works great!
"""

from PIL import Image
import io
import base64

try:
    from pyzbar.pyzbar import decode
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False
    print("Warning: pyzbar not installed. Barcode scanning will not work.")
    print("Install with: pip install pyzbar")
    print("On macOS, you may also need: brew install zbar")
    print("On Linux: sudo apt-get install libzbar0")

class BarcodeScanner:
    """Handle barcode scanning from images"""
    
    @staticmethod
    def scan_from_image(image_data):
        """
        Scan barcode from image data
        
        Args:
            image_data: Can be:
                - PIL Image object
                - Base64 encoded image string
                - File path string
                - Bytes object
        
        Returns:
            ISBN string if found, None otherwise
        """
        if not PYZBAR_AVAILABLE:
            raise RuntimeError("pyzbar library is not installed")
        
        try:
            # Convert various input types to PIL Image
            if isinstance(image_data, str):
                if image_data.startswith('data:image'):
                    # Base64 encoded image from web
                    image_data = image_data.split(',')[1]
                    image_data = base64.b64decode(image_data)
                    image = Image.open(io.BytesIO(image_data))
                else:
                    # File path
                    image = Image.open(image_data)
            elif isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = image_data
            
            # Decode barcodes from image
            barcodes = decode(image)
            
            # Look for ISBN barcodes (EAN-13 format)
            for barcode in barcodes:
                barcode_data = barcode.data.decode('utf-8')
                barcode_type = barcode.type
                
                # ISBN-13 uses EAN-13 format, ISBN-10 uses EAN-10
                if barcode_type in ['EAN13', 'EAN8', 'ISBN13', 'ISBN10']:
                    # Validate ISBN format
                    if BarcodeScanner._is_valid_isbn(barcode_data):
                        return barcode_data
            
            return None
            
        except Exception as e:
            print(f"Error scanning barcode: {str(e)}")
            return None
    
    @staticmethod
    def _is_valid_isbn(isbn_string):
        """
        Validate ISBN format
        
        Args:
            isbn_string: String to validate
            
        Returns:
            True if valid ISBN format, False otherwise
        """
        # Remove hyphens and spaces
        isbn = isbn_string.replace('-', '').replace(' ', '')
        
        # Check if it's numeric and correct length
        if not isbn.isdigit():
            return False
        
        if len(isbn) not in [10, 13]:
            return False
        
        # For ISBN-13, first 3 digits should be 978 or 979
        if len(isbn) == 13:
            if not isbn.startswith(('978', '979')):
                return False
        
        return True
    
    @staticmethod
    def get_scanner_recommendations():
        """
        Get recommendations for barcode scanning hardware
        
        Returns:
            Dictionary with hardware recommendations
        """
        return {
            "free_option": {
                "name": "Smartphone Camera",
                "cost": "$0",
                "description": "Use your phone's camera via the web interface",
                "pros": ["Free", "High quality", "Always with you", "Easy to use"],
                "cons": ["Requires web interface", "Need to switch between devices"],
                "setup": "Just open the web app on your phone and use the camera feature"
            },
            "budget_scanner": {
                "name": "USB Barcode Scanner",
                "cost": "$20-30",
                "examples": [
                    "Tera Wireless Barcode Scanner (~$25)",
                    "TaoTronics Wired Barcode Scanner (~$20)",
                    "Inateck Barcode Scanner (~$25)"
                ],
                "description": "Handheld scanner that works like a keyboard",
                "pros": ["Very fast", "Plug and play", "No software needed", "Professional feel"],
                "cons": ["Additional hardware", "Wired models less flexible"],
                "setup": "Plug in via USB, scan barcode, ISBN appears as typed text"
            },
            "webcam_option": {
                "name": "USB Webcam",
                "cost": "$15-25",
                "examples": [
                    "Logitech C270 (~$20)",
                    "Microsoft LifeCam (~$25)"
                ],
                "description": "Use a webcam to capture barcode images",
                "pros": ["Dual purpose (video calls + scanning)", "Good for desktop setup"],
                "cons": ["Slower than dedicated scanner", "Requires good lighting"],
                "setup": "Connect webcam, use web interface to capture and scan"
            },
            "recommendation": "Start with your smartphone camera (free). If you're adding 100+ books and want speed, get a USB barcode scanner (~$25)."
        }


# Flask endpoint for barcode scanning
def create_barcode_endpoint(app):
    """Add barcode scanning endpoint to Flask app"""
    from flask import request, jsonify
    
    @app.route('/api/scan-barcode', methods=['POST'])
    def scan_barcode():
        """
        Scan barcode from uploaded image
        
        Expects:
            - image: base64 encoded image or file upload
        
        Returns:
            - isbn: detected ISBN or null
            - success: boolean
        """
        try:
            if 'image' in request.files:
                # File upload
                file = request.files['image']
                image_data = file.read()
            elif 'image' in request.json:
                # Base64 encoded image
                image_data = request.json['image']
            else:
                return jsonify({'error': 'No image provided'}), 400
            
            isbn = BarcodeScanner.scan_from_image(image_data)
            
            if isbn:
                return jsonify({
                    'success': True,
                    'isbn': isbn,
                    'message': 'Barcode detected successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'isbn': None,
                    'message': 'No valid ISBN barcode detected in image'
                }), 200
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/scanner-info', methods=['GET'])
    def get_scanner_info():
        """Get information about barcode scanning options"""
        return jsonify({
            'pyzbar_installed': PYZBAR_AVAILABLE,
            'recommendations': BarcodeScanner.get_scanner_recommendations()
        }), 200

# Made with Bob
