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

## 🚀 Quick Start (Updated January 2025)

### Prerequisites

**System Requirements:**
- **Node.js** 18+ with npm
- **Python** 3.11+ 
- **Conda** (strongly recommended)
- **Git**

**Optional (for advanced setup):**
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 🎯 Recommended Setup (Current Working Configuration)

This setup gives you both frontend and backend running locally with all functionality working.

#### 1. Clone Repository
```bash
git clone https://github.com/your-username/scifig-ai.git
cd scifig-ai
```

#### 2. Frontend Setup
```bash
# Install dependencies (may show some warnings - these are normal)
npm install

# Build the frontend
npm run build
```

#### 3. Backend Setup with Conda
```bash
cd backend

# Create conda environment with all dependencies
conda env create -f environment.yml

# Install additional dependencies that may be missing
/opt/anaconda3/envs/scifig-ai/bin/pip install PyJWT python-jose[cryptography] supabase lifelines

# Verify all dependencies work
/opt/anaconda3/envs/scifig-ai/bin/python -c "import jwt; import supabase; import lifelines; from publication_viz_engine import PublicationVizEngine; print('✅ All dependencies working')"
```

#### 4. Start Services

**Terminal 1: Start Frontend Server (port 3000)**
```bash
# From project root
python3 server.py
# Frontend will be at: http://localhost:3000
```

**Terminal 2: Start Backend Server (port 8000)**
```bash
# From backend directory
cd backend
export PYTHONPATH=$(pwd)
/opt/anaconda3/envs/scifig-ai/bin/python -m uvicorn scifig_api_server:app --reload --host 127.0.0.1 --port 8000
# Backend will be at: http://localhost:8000
```

#### 5. Verify Everything Works ✅

**Frontend Tests:**
- **Frontend**: http://localhost:3000 (SciFig AI interface)

**Backend Tests:**
- **Health Check**: `curl http://localhost:8000/health` 
  - Should return: `{"status":"degraded","version":"1.0.0"...}` (degraded is normal - DB warnings don't affect functionality)
- **Statistical Analysis**: `curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d '{"data": [{"group": "A", "value": 10}, {"group": "A", "value": 12}, {"group": "B", "value": 15}, {"group": "B", "value": 17}], "outcome_variable": "value", "group_variable": "group", "analysis_type": "independent_ttest"}'`
  - Should return statistical analysis results
- **API Status**: `curl http://localhost:8000/api/v1/status`
  - Should return API analysis status
- **Figure Generation**: Backend supports publication-ready figure generation endpoints

### 🆕 New Features (Consolidated Server January 2025)

The system now uses a **single consolidated server** (`scifig_api_server.py`) with enhanced functionality:

- **🏗️ Monolithic Architecture** - Single server combining all functionality (authentication, files, statistics, figures)
- **✅ Enhanced Statistical Analysis** - Comprehensive assumption checking and test recommendations
- **✅ Kaplan-Meier Survival Analysis** - Full survival curve analysis with lifelines
- **✅ Interactive Code Editor** - Monaco editor for code manipulation  
- **✅ Publication Figure Engine** - Advanced figure generation with journal-specific styling
- **✅ Intelligent Test Recommendations** - AI-powered analysis selection based on data characteristics
- **🔍 Assumption Validation** - Automatic statistical assumption checking with fallback recommendations

### 🐳 Alternative: Docker Setup

```bash
# From backend directory
docker-compose up -d db redis

# For full containerized setup (if preferred)
cd backend
conda activate scifig-ai
alembic upgrade head  # Database migrations
```

### ⚠️ Troubleshooting

**Common Issues & Solutions:**

1. **"ModuleNotFoundError: No module named 'scifig_api_server'"**
   - Make sure you're running uvicorn from the `backend/` directory
   - Use the correct command: `uvicorn scifig_api_server:app --reload --host 127.0.0.1 --port 8000`
   - Set `PYTHONPATH` correctly: `export PYTHONPATH=$(pwd)` from backend directory

2. **"ModuleNotFoundError: No module named 'jwt'"**
   - Install missing dependencies: `/opt/anaconda3/envs/scifig-ai/bin/pip install PyJWT python-jose[cryptography]`

3. **"ModuleNotFoundError: No module named 'lifelines'"**  
   - Install survival analysis package: `/opt/anaconda3/envs/scifig-ai/bin/pip install lifelines`

4. **Database warnings are normal**
   - The "degraded" status is expected in development
   - Core statistical and API functionality works regardless

5. **Port already in use**
   - Kill existing processes: `pkill -f uvicorn` or `pkill -f python`
   - Try different ports if needed

## 🧪 Testing the Consolidated Server

### Automated Testing

We've created comprehensive tests to verify all functionality:

```bash
# Unit tests with pytest
cd backend
python -m pytest tests/test_api.py::TestHealthEndpoints tests/test_api.py::TestEnhancedStatisticalAPI -v

# Live server testing
python test_consolidated_server.py
```

### Manual Testing

1. **Health Check**: `curl http://localhost:8000/health`
2. **Enhanced Analysis**: 
   ```bash
   curl -X POST http://localhost:8000/analyze/comprehensive \
     -H "Content-Type: application/json" \
     -d '{"data": [{"group": "A", "value": 10}, {"group": "B", "value": 15}], "outcome_variable": "value", "group_variable": "group", "analysis_type": "independent_ttest"}'
   ```
3. **Test Recommendation**:
   ```bash
   curl -X POST http://localhost:8000/recommend_test \
     -H "Content-Type: application/json" \
     -d '{"outcome_type": "continuous", "n_groups": 2, "sample_size": 100, "columns": ["group", "value"]}'
   ```

## 🏗️ Architecture Overview

**Consolidated Monolithic Server (`scifig_api_server.py`)**:
- ✅ **Single Port** (8000): All functionality unified  
- ✅ **Enhanced Statistics**: Comprehensive analysis with assumption checking
- ✅ **Authentication & Users**: Full user management system
- ✅ **File Management**: Upload, processing, and data management
- ✅ **Project Management**: Collaborative research projects
- ✅ **Publication Figures**: Journal-ready visualizations
- ✅ **Legacy Compatibility**: Backwards compatible with existing frontend