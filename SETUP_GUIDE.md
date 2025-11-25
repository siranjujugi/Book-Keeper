# Quick Setup Guide

## Step 1: Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Start the server
python app.py
```

Backend will run at: **http://localhost:5001**

You should see:
```
* Serving Flask app 'app'
* Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
* Running on http://0.0.0.0:5001
```

## Step 2: Start the Frontend

Open a **new terminal window** and run:

```bash
# Navigate to frontend directory
cd frontend

# Start Angular development server
ng serve
```

Frontend will run at: **http://localhost:4200**

## Step 3: Access the Application

Open your browser and go to: **http://localhost:4200**

You should see the Library Management System interface!

## Quick Test

1. Click "Add New Book" button
2. Fill in:
   - Title: "Test Book"
   - Author: "Test Author"
3. Click "Add Book"
4. You should see your book in the list!

## Troubleshooting

### Backend Issues

**Port 5000 already in use (macOS)**
- Solution: We've configured the app to use port 5001
- Alternative: Disable AirPlay Receiver in System Preferences

**pyzbar warning**
- This is optional - barcode scanning will work via image upload
- To enable full barcode support: `brew install zbar` (macOS)

### Frontend Issues

**Cannot connect to backend**
- Make sure backend is running on port 5001
- Check that you see the Flask server output

**CORS errors**
- Backend should have Flask-CORS installed
- Restart both servers if needed

## Next Steps

1. **Add your first book** using the "Add New Book" button
2. **Try ISBN lookup** - Enter an ISBN and click "Fetch Info"
3. **View Analytics** - Click the Analytics tab (will show data once you add books)
4. **Test Search** - Use the search box to find books

## Hardware for Barcode Scanning

### Free Option (Recommended to Start)
- Use your smartphone camera
- Click "Scan Barcode" button
- Take a photo of the ISBN barcode
- System will extract and fetch book info

### Budget Option ($20-30)
- USB Barcode Scanner
- Plug and play - works like a keyboard
- Recommended for bulk scanning (100+ books)

## Need Help?

Check the main README.md for detailed documentation and troubleshooting.