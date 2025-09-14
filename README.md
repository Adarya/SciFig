# SciFig AI - Scientific Figure Analysis Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.104.1-green?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Python-3.11-yellow?style=for-the-badge&logo=python" alt="Python" />
</div>

## 🧬 Overview

SciFig AI is a full-stack platform that transforms how medical researchers create publication-ready analyses and figures. Using a combination of AI-powered recommendations and robust statistical engines, it makes statistical analysis accessible to researchers without extensive statistics backgrounds.

### ✨ Key Features

- **🤖 AI-Powered Analysis Selection** - Smart recommendations based on your data structure  
- **📊 Publication-Ready Figures** - Journal-specific formatting (Nature, Science, NEJM)
- **🔬 Comprehensive Statistical Tests** - T-tests, ANOVA, Chi-square, survival analysis with Kaplan-Meier
- **📝 Auto-Generated Methods** - Complete methods sections following publication guidelines
- **🎨 Interactive Figure Editor** - Code editor and natural language modification interface
- **👥 Real-time Collaboration** - Share projects and collaborate with co-authors
- **🔒 HIPAA Compliant** - Secure data handling for medical research
- **⚡ Backend Processing** - Fast, scalable statistical computing with Python/FastAPI

## 🚀 Quick Start

### Prerequisites

**System Requirements:**
- **Node.js** 18+ (with npm or yarn)
- **Python** 3.8+ 
- **Git**

### 🎯 Simple Setup (2 Terminal Process)

Get SciFig AI running locally in under 5 minutes:

#### 1. Clone Repository
```bash
git clone https://github.com/Adarya/SciFig.git
cd SciFig
```

#### 2. Frontend Setup
```bash
# Install dependencies using Yarn (recommended) or npm
yarn install
# OR: npm install

# If you encounter npm permission issues, use:
# yarn install
```

#### 3. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Setup environment variables (required for database connection)
cp env.example .env
# Edit .env file with your Supabase credentials (see Environment Setup below)

# Verify installation works
python -c "import fastapi, pandas, numpy; print('✅ Backend dependencies ready')"
```

#### 4. Start Both Services

**Terminal 1: Frontend (port 5173)**
```bash
# From project root
yarn dev
# OR: npm run dev

# ✅ Frontend will be at: http://localhost:5173
```

**Terminal 2: Backend (port 8000)**
```bash
# From backend directory
cd backend
python start.py

# ✅ Backend will be at: http://localhost:8000
# ✅ API Documentation: http://localhost:8000/docs
```

#### 5. Verify Everything Works ✅

**Access the Application:**
- **🌐 Frontend**: http://localhost:5173 (SciFig AI interface)
- **🔧 Backend API**: http://localhost:8000/health (should show: `{"status":"healthy","service":"Statistical Engine"}`)

**Quick Test:**
```bash
# Test backend health
curl http://localhost:8000/health

# Test statistical analysis
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"data": [{"group": "A", "value": 10}, {"group": "A", "value": 12}, {"group": "B", "value": 15}, {"group": "B", "value": 17}], "outcome_variable": "value", "group_variable": "group", "analysis_type": "independent_ttest"}'
```

### 🔧 Environment Setup (Required for Backend)

Before running the backend, you need to configure your environment variables:

#### 1. Create Environment File
```bash
cd backend
cp env.example .env
```

#### 2. Configure Supabase (Database)
Edit the `.env` file with your Supabase credentials:

```env
# Get these from your Supabase dashboard: Settings > API
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Generate a secure secret key for JWT tokens
SECRET_KEY="your-super-secret-jwt-key-here-make-it-long-and-random"
```

**🆓 Free Supabase Setup:**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API to find your keys
4. Copy the URL and keys to your `.env` file

🎉 **You're ready to go!** Upload your data and start creating publication-ready statistical analyses.

---

## 📋 What's Included

### 🆕 Current Features (Modular FastAPI Backend)

The system uses a **modular FastAPI backend** with Supabase database integration:

- **🔐 User Authentication** - JWT-based auth with user roles (Admin, Researcher, Analyst, User)
- **📊 Statistical Analysis** - T-tests, ANOVA, Chi-square, Mann-Whitney U tests
- **🧬 Survival Analysis** - Kaplan-Meier survival curves with lifelines
- **📈 Multivariate Analysis** - Logistic, linear, and Cox regression with forest plots
- **🎨 Publication Figures** - Journal-specific figure generation (Nature, Science, NEJM, Cell)
- **📁 Project Management** - Persistent projects and analyses with Supabase database
- **🔧 Code Editing** - Support for custom figure parameters and code modifications
- **📱 Display Figures** - Web-optimized figure rendering
- **👥 User Management** - Admin panel for user and project oversight

### 📦 Dependencies

The backend uses a comprehensive set of Python dependencies for full-stack functionality:

```bash
# Install all dependencies
pip install -r requirements.txt

# Core libraries include:
# - FastAPI + Uvicorn (web framework)
# - Pandas, NumPy, SciPy (data processing)
# - Matplotlib, Seaborn (visualization)
# - Statsmodels, Lifelines (statistical analysis)
# - Supabase (database integration)
# - Python-Jose (JWT authentication)
```

### ⚠️ Troubleshooting

**Common Issues & Solutions:**

1. **Frontend won't start (`vite: command not found`)**
   - Install dependencies: `yarn install` or `npm install`
   - Use Yarn if npm has permission issues: `yarn install`

2. **Backend import errors**
   - Install dependencies: `cd backend && pip install -r requirements.txt`
   - Check environment file: Make sure `.env` exists with valid Supabase credentials
   - For specific missing packages: `pip install package-name`

3. **Port already in use**
   - Kill existing processes: `pkill -f python` or `pkill -f node`
   - Check what's using the port: `lsof -ti:8000` or `lsof -ti:5173`

4. **npm permission errors**
   - Switch to Yarn: `yarn install` and `yarn dev`
   - Or fix npm permissions: `sudo chown -R $(whoami) ~/.npm`

5. **Backend server won't start**
   - Make sure you're in the `backend/` directory
   - Check Python version: `python --version` (needs 3.8+)
   - Verify requirements: `python -c "import fastapi, pandas, numpy; print('✅ Core dependencies OK')"`
   - Check environment file: Ensure `.env` exists with valid Supabase credentials
   - Database connection: Verify Supabase project is active and keys are correct

## 🧪 Testing the Server

### Quick Testing

Test that the server is working properly:

```bash
# Health check
curl http://localhost:8000/health

# Simple statistical analysis test
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"data": [{"group": "A", "value": 10}, {"group": "A", "value": 12}, {"group": "B", "value": 15}, {"group": "B", "value": 17}], "outcome_variable": "value", "group_variable": "group", "analysis_type": "independent_ttest"}'
```

## 🏗️ Architecture Overview

**Modular FastAPI Backend (`start.py`)**:
- 🎯 **Single Port** (8000): RESTful API with comprehensive endpoints
- 🔐 **Authentication**: JWT-based auth with user roles and session management
- 📊 **Core Statistics**: T-tests, ANOVA, Chi-square, Mann-Whitney U, survival analysis
- 📈 **Multivariate Models**: Logistic, linear, and Cox regression with forest plots
- 🎨 **Publication Figures**: Journal-ready visualizations with multiple format support
- 🗄️ **Database Integration**: Persistent data storage with Supabase PostgreSQL
- 📁 **Project Management**: User projects, analyses, and collaboration features
- 🖥️ **Web Interface**: Compatible with React frontend via CORS
- ⚡ **Scalable Processing**: Async FastAPI with database-backed persistence