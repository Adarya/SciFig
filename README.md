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
- **🔬 Comprehensive Statistical Tests** - T-tests, ANOVA, Chi-square, survival analysis
- **📝 Auto-Generated Methods** - Complete methods sections following publication guidelines
- **🎨 Interactive Figure Editor** - Code editor and natural language modification interface
- **👥 Real-time Collaboration** - Share projects and collaborate with co-authors
- **🔒 HIPAA Compliant** - Secure data handling for medical research
- **⚡ Backend Processing** - Fast, scalable statistical computing with Python/FastAPI

## 🚀 Quick Start (Complete Setup)

### Prerequisites

**System Requirements:**
- **Node.js** 18+ with npm
- **Python** 3.11+ 
- **Conda** (recommended) or **Docker**
- **Git**

**Optional (for advanced setup):**
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 🎯 Option 1: Full Development Setup (Recommended)

This setup gives you both frontend and backend running locally with persistent database.

#### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone https://github.com/your-username/scifig-ai.git
cd scifig-ai

# Setup frontend dependencies
npm install

# Setup backend
cd backend
```

#### 2. Backend Setup with Conda (Recommended)
```bash
# Quick automated setup (Linux/Mac)
./setup_env.sh

# OR Windows
setup_env.bat

# OR Manual conda setup
conda env create -f environment.yml
conda activate scifig-ai

# Verify installation
python run_tests.py --quick
```

#### 3. Database Setup with Docker
```bash
# Start PostgreSQL and Redis (from backend directory)
docker-compose up -d db redis

# Run database migrations
conda activate scifig-ai
alembic upgrade head

# Verify database connection
python -c "from app.core.database import check_db_connection; import asyncio; print('DB Connected:', asyncio.run(check_db_connection()))"
```

#### 4. Start Both Services
```bash
# Terminal 1: Start Backend (from backend/ directory)
conda activate scifig-ai
uvicorn app.main:app --reload
# Backend will be at: http://localhost:8000

# Terminal 2: Start Frontend (from root directory)
npm run dev
# Frontend will be at: http://localhost:5173
```

#### 5. Verify Everything Works
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/docs (Swagger docs)
- **Backend Health**: http://localhost:8000/health
- **Auth Check**: `curl http://localhost:8000/api/v1/auth/check`

### 🐳 Option 2: Docker Setup (Production-like)

```bash
# Clone repository
git clone https://github.com/your-username/scifig-ai.git
cd scifig-ai

# Setup environment (backend)
cd backend
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Run migrations
docker-compose run backend alembic upgrade head

# Access services
# Frontend: http://localhost:3000 (when Docker frontend added)
# Backend: http://localhost:8000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### ⚡ Option 3: Frontend-Only (No Backend)

If you just want to run the frontend with mock data:

```bash
git clone https://github.com/your-username/scifig-ai.git
cd scifig-ai
npm install
npm run dev
```

Frontend will be at http://localhost:5173 with simulated backend responses.

## 🏗️ Project Structure

```
scifig-ai/                    # Root (Frontend)
├── src/                      # React frontend source
│   ├── components/           # React components
│   │   ├── LandingPage.tsx   # Marketing landing page
│   │   ├── Dashboard.tsx     # User dashboard  
│   │   ├── AnalysisWorkflow.tsx # Main analysis workflow
│   │   ├── FigureAnalyzer.tsx   # Figure analysis tool
│   │   ├── ResultsView.tsx      # Analysis results display
│   │   ├── VisualizationEditor.tsx # Interactive figure editor
│   │   └── AuthModal.tsx        # Authentication modal
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Frontend utilities
│   └── docs/                # Documentation
├── backend/                  # Python FastAPI backend
│   ├── app/                  # FastAPI application
│   │   ├── main.py           # FastAPI entry point
│   │   ├── api/v1/           # API endpoints
│   │   │   ├── analysis.py   # Statistical analysis endpoints
│   │   │   ├── files.py      # File upload endpoints
│   │   │   └── auth.py       # Authentication endpoints  
│   │   ├── core/             # Core configuration
│   │   ├── models/           # SQLAlchemy database models
│   │   └── services/         # Business logic services
│   ├── static/               # Generated figures storage
│   ├── uploads/              # Temporary file storage
│   ├── alembic/              # Database migrations
│   ├── tests/                # Python tests
│   ├── requirements.txt      # Python dependencies
│   ├── environment.yml       # Conda environment
│   └── docker-compose.yml    # Local services
├── package.json              # Frontend dependencies
└── README.md                 # This file
```

## 🔧 Development Workflow

### Daily Development

```bash
# Start your development environment
cd scifig-ai

# Terminal 1: Backend
cd backend
conda activate scifig-ai
uvicorn app.main:app --reload

# Terminal 2: Frontend  
npm run dev

# Terminal 3: Watch tests (optional)
cd backend
python run_tests.py --watch
```

### Available Scripts

**Frontend (from root):**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend (from backend/):**
```bash
# Development
uvicorn app.main:app --reload    # Start development server
python run_tests.py              # Run all tests
python run_tests.py --quick      # Run quick tests only
python run_tests.py --coverage   # Run with coverage

# Database
alembic upgrade head             # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000  # Production server
```

## 📊 API Usage Examples

### 1. Upload and Analyze Data

```bash
# Upload a CSV file
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_data.csv"

# Response: {"dataset_id": "abc123", "filename": "your_data.csv", ...}

# Run statistical analysis  
curl -X POST "http://localhost:8000/api/v1/run" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "abc123",
    "outcome_variable": "blood_pressure",
    "group_variable": "treatment_group"
  }'

# Response: Analysis results with figures
```

### 2. Authentication Endpoints

```bash
# Check authentication status
curl http://localhost:8000/api/v1/auth/check

# Login (development mode)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Get user profile (requires auth)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer your_token"
```

### 3. View Generated Figures

After running an analysis, figures are available at:
- `http://localhost:8000/static/figures/{analysis_id}_figure.png`

## 🔐 Environment Configuration

### Backend Environment (.env)

Create `backend/.env`:

```env
# Database (for production - Docker uses defaults)
DATABASE_URL=postgresql://scifig:password@localhost:5432/scifig_ai

# Authentication (for Supabase integration)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SECRET_KEY=your_secret_key_for_jwt

# Optional
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your_openai_key
ALLOWED_HOSTS=["http://localhost:5173", "http://localhost:3000"]
```

### Frontend Environment

Create `.env` (root directory):

```env
# Supabase (if using real auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API (for production)
VITE_API_BASE_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
conda activate scifig-ai

# Run all tests
python run_tests.py

# Quick tests only (skip slow integration tests)
python run_tests.py --quick

# With coverage report
python run_tests.py --coverage

# Specific test files
python run_tests.py tests/test_statistical_engine.py

# Verbose output
python run_tests.py --verbose
```

### Frontend Tests

```bash
# Unit tests
npm run test

# E2E tests (when implemented)
npm run test:e2e
```

## 📈 Features Currently Implemented

### ✅ Backend (Python/FastAPI)
- **Statistical Engine**: T-tests, Chi-square, assumption checking
- **File Processing**: CSV/Excel upload with smart parsing
- **Figure Generation**: Publication-ready plots (Nature/Science styles)
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Authentication**: Supabase integration with JWT tokens
- **API**: RESTful endpoints with OpenAPI documentation

### ✅ Frontend (React/TypeScript)
- **Analysis Workflow**: Step-by-step guided analysis
- **Interactive Editor**: Monaco code editor + natural language interface
- **Figure Display**: Real-time figure rendering and customization
- **Authentication**: Supabase Auth with Google OAuth
- **Responsive Design**: Mobile-friendly with Tailwind CSS

## 🚧 Development Roadmap

### Phase 3: Frontend-Backend Integration (Current)
- [ ] Replace frontend statistical engine with backend API calls
- [ ] Real-time progress updates for long-running analyses
- [ ] File upload integration with backend processing
- [ ] User session management across frontend/backend

### Phase 4: Advanced Features
- [ ] Real-time collaboration with WebSockets
- [ ] Advanced statistical tests (ANOVA, regression, survival analysis)
- [ ] Batch analysis processing
- [ ] API rate limiting and monitoring

## 🐛 Troubleshooting

### Common Issues

**1. Backend won't start:**
```bash
# Check conda environment
conda activate scifig-ai
python --version  # Should be 3.11+

# Check database connection
docker-compose up -d db
python -c "from app.core.database import check_db_connection; import asyncio; print(asyncio.run(check_db_connection()))"

# Check dependencies
pip install -r requirements.txt
```

**2. Frontend can't connect to backend:**
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS settings in backend/.env
ALLOWED_HOSTS=["http://localhost:5173"]
```

**3. Database migration errors:**
```bash
# Reset database (development only)
docker-compose down -v
docker-compose up -d db
alembic upgrade head
```

**4. Import errors in Python:**
```bash
# Make sure you're in the backend directory
cd backend
python -c "import app.main"  # Should not error
```

### Performance Tips

- **Development**: Use `uvicorn --reload` for backend hot reloading
- **Testing**: Use `--quick` flag to skip slow tests during development
- **Database**: Docker PostgreSQL is fine for development; use cloud for production
- **Frontend**: Vite provides fast HMR for React development

## 🚀 Deployment

### Production Deployment

**Backend (FastAPI):**
```bash
# Build and deploy
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# With gunicorn for production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

**Frontend (React):**
```bash
# Build for production
npm run build

# Deploy to Netlify/Vercel/etc.
# Upload dist/ directory
```

### Docker Production

```dockerfile
# Dockerfile example for backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Setup development environment** following the Quick Start guide
4. **Make your changes** with proper tests
5. **Run tests**: `python run_tests.py` (backend) and `npm test` (frontend)
6. **Submit a pull request**

### Development Guidelines
- **Backend**: Follow FastAPI conventions, add tests for new endpoints
- **Frontend**: Use TypeScript, follow React best practices
- **Database**: Use Alembic migrations for schema changes
- **Tests**: Maintain >80% code coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI**: High-performance API framework
- **React + Vite**: Modern frontend development
- **SciPy/NumPy**: Statistical computing foundation
- **Supabase**: Authentication and database services
- **Plotly**: Interactive scientific visualization

## 📞 Support

- **Documentation**: Coming soon
- **Issues**: [GitHub Issues](https://github.com/your-username/scifig-ai/issues)
- **Email**: support@scifig.ai

---

<div align="center">
  <p>Made with ❤️ for the scientific research community</p>
  <p><strong>Full-stack platform for modern statistical analysis</strong></p>
</div>