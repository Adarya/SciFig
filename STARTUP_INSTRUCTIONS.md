# SciFig Backend Branch - Startup Instructions

## Prerequisites

Before starting the servers, you need to add your API keys to the environment files.

## 1. Configure Environment Variables

### Backend Configuration
Edit `/SciFig_backend/backend/.env` and add your keys:

```env
# Required Supabase Keys
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Generate a secure secret key (use a long random string)
SECRET_KEY="your-super-secret-jwt-key-here"
```

### Frontend Configuration
Edit `/SciFig_backend/.env` and add your keys:

```env
# Must match the backend Supabase configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# Optional: Google Gemini API for AI features
VITE_GEMINI_API_KEY="your-gemini-api-key-here"
```

## 2. Start the Backend Server

Open Terminal 1 and run:

```bash
cd /Users/adary/Documents/SciFig_AI/SciFig_backend/backend
source venv/bin/activate
python start.py
```

Alternatively, you can use:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 3. Start the Frontend Server

Open Terminal 2 and run:

```bash
cd /Users/adary/Documents/SciFig_AI/SciFig_backend
npm run dev
```

The frontend will be available at:
- Application: http://localhost:5173

## 4. Verify Setup

1. Check backend health: http://localhost:8000/health
2. View API documentation: http://localhost:8000/docs
3. Access the application: http://localhost:5173

## Key Features Available

### Backend Endpoints:
- **Authentication**: `/auth/signup`, `/auth/login`
- **Statistical Analysis**: `/api/v1/statistical/analyze`
- **Visualization**: `/api/v1/visualization/generate_publication_figure`
- **Projects**: `/api/v1/projects/`
- **Analyses**: `/api/v1/analyses/`

### Frontend Features:
- User authentication
- Project management
- Statistical analysis workflows
- Publication-quality figure generation
- Data upload and preview
- Interactive code editor

## Troubleshooting

### Port Already in Use
If port 8000 or 5173 is already in use:
```bash
# Kill processes on port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill processes on port 5173
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Issues
- Verify Supabase credentials are correct
- Check if Supabase project is active
- Ensure service role key has proper permissions

### Missing Dependencies
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

## Notes

- The backend will automatically create database tables on first run
- User roles: Admin, Researcher, Analyst, User
- All data is persisted in Supabase
- Authentication uses JWT tokens