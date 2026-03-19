# Notes App - Full Stack Application

A modern notes application with user authentication and PostgreSQL database.

## Features
- 🔐 User authentication (register/login)
- 📝 Create, read, update, and delete notes
- 📊 Statistics dashboard
- 📤 Export notes as text files
- 📱 Responsive design
- 🌐 Cloud storage with PostgreSQL

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript (Vercel)
- **Backend**: Node.js, Express (Render)
- **Database**: PostgreSQL (Neon.tech)

## Live Demo
- Frontend: https://your-app.vercel.app
- Backend API: https://your-backend.onrender.com

## Local Development

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (or Neon.tech account)

### Setup Instructions

1. **Clone the repository**
   git clone https://github.com/yourusername/notes-app.git
   cd notes-app

2. **Backend setup**
-  cd backend
-  npm install
-  cp .env.example .env
-  # Edit .env with your database credentials
-  npm run dev
3. **Frontend Setup**
-  cd frontend
   # Update API_URL in script.js to point to your backend
   # Serve locally with:
-  python -m http.server 3000
   # or
-  npx http-server -p 3000
4. **Open the app**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health