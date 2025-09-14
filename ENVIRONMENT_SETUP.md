# Environment Variables Setup Guide

## 🔐 Frontend vs Backend Environment Variables

### Frontend Variables (Public - Compiled into Build)
- **Prefix**: `VITE_*` (for Vite/React)
- **Visibility**: Public - visible in browser
- **Usage**: Build-time configuration, API endpoints, feature flags
- **Security**: ⚠️ Never put sensitive data here!

### Backend Variables (Private - Server Only)  
- **No prefix**: Regular environment variables
- **Visibility**: Private - server-side only
- **Usage**: Database credentials, JWT secrets, API keys
- **Security**: 🔒 Contains sensitive data

---

## 🏠 Local Development Setup

### Option 1: Separate Environment Files (Recommended)

1. **Frontend** (copy `.env.frontend.example` to `.env.local`):
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_APP_NAME=SciFig AI Platform
   VITE_ENABLE_DEBUG=true
   ```

2. **Backend** (copy `.env.backend.example` to `.env`):
   ```env
   # Application
   APP_NAME=SciFig AI Statistical Engine
   DEBUG=true
   
   # Supabase (get from supabase.com dashboard)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   
   # JWT Secret (generate new)
   SECRET_KEY=your-32-character-secret-key
   ```

### Option 2: Single .env File (Simple)
Create one `.env` file with both:
```env
# Backend variables (no prefix)
SUPABASE_URL=https://your-project-id.supabase.co
SECRET_KEY=your-secret-key

# Frontend variables (VITE_ prefix)  
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=SciFig AI Platform
```

---

## 🚂 Railway Deployment Setup

### 1. Backend Variables (Private - Set in Railway Dashboard)
Go to Railway Dashboard → Variables → Add these:

```env
# Application Settings
APP_NAME=SciFig AI Statistical Engine
APP_VERSION=2.0.0
DEBUG=false
HOST=0.0.0.0
PORT=8000

# CORS (Railway auto-generates domain)
ALLOWED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}

# 🔒 Supabase (from your Supabase dashboard)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 🔒 JWT Secret (generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-generated-secret-key-here

# Upload settings
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
MAX_DATASET_SIZE=100000
CACHE_RESULTS=true
```

### 2. Frontend Variables (Public - Auto-configured in railway.json)
These are automatically set during build:
- ✅ `VITE_API_BASE_URL` → Points to your Railway domain  
- ✅ `VITE_APP_NAME` → App display name
- ✅ `VITE_APP_VERSION` → Version number

---

## 🔧 How It Works

### Build Process (Railway):
1. **Frontend Build**: Uses `VITE_*` variables → Compiled into static files
2. **Backend Build**: Uses regular env vars → Available at runtime
3. **Deployment**: Static frontend + FastAPI backend in one container

### Runtime:
```
https://your-app.railway.app/
├── Frontend (React) - serves static files, uses compiled VITE_ vars
├── /api/v1/* - Backend API, uses runtime env vars  
├── /health - Health check
└── /docs - API documentation
```

---

## 🛡️ Security Best Practices

### ✅ Safe for Frontend (VITE_*):
- API endpoints (your own backend)
- Public feature flags  
- UI configuration
- Public service URLs

### 🔒 Backend Only (No VITE_ prefix):
- Database credentials
- JWT secret keys
- Private API keys
- Service role keys
- Internal service URLs

### 🚫 Never in Frontend:
```env
# ❌ WRONG - exposes secrets to browser
VITE_SECRET_KEY=secret-key
VITE_DATABASE_PASSWORD=password  
VITE_SERVICE_ROLE_KEY=private-key

# ✅ CORRECT - backend only
SECRET_KEY=secret-key
DATABASE_PASSWORD=password
SERVICE_ROLE_KEY=private-key
```

---

## 🔍 Debugging Environment Variables

### Check Frontend Variables (Browser Console):
```javascript
// These should work (VITE_ variables)
console.log(import.meta.env.VITE_API_BASE_URL)
console.log(import.meta.env.VITE_APP_NAME)

// These should be undefined (backend variables)
console.log(import.meta.env.SECRET_KEY) // undefined (good!)
```

### Check Backend Variables (Railway Logs):
```python
# In your FastAPI code
print(f"API Base URL: {os.getenv('VITE_API_BASE_URL')}")  # None
print(f"Secret Key: {os.getenv('SECRET_KEY')}")  # Your secret
```

---

## 🚀 Quick Setup Commands

### Generate JWT Secret:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Local Development:
```bash
# Start backend (uses .env)
cd backend && uvicorn app.main:app --reload

# Start frontend (uses .env.local)  
yarn dev
```

### Deploy to Railway:
1. Set backend variables in Railway dashboard
2. Push to GitHub - Railway auto-builds with frontend variables

---

## ❓ Common Issues

**Frontend can't reach API**: Check `VITE_API_BASE_URL` points to correct backend URL

**Build fails**: Ensure all required `VITE_*` variables are set in build args

**Auth errors**: Verify `SECRET_KEY` is set in backend environment (not frontend)

**CORS errors**: Update `ALLOWED_ORIGINS` to include your frontend domain
