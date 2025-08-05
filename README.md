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

**Terminal 1: Start Frontend Server (port 5173)**
```bash
# From project root
npm run dev
# Frontend will be at: http://localhost:5173
```

**Terminal 2: Start Backend Server (port 8000)**
```bash
# From backend directory
cd backend
export PYTHONPATH=$(pwd)
python simple_statistical_server.py
# Backend will be at: http://localhost:8000
```

#### 5. Verify Everything Works ✅

**Frontend Tests:**
- **Frontend**: http://localhost:5173 (SciFig AI interface)

**Backend Tests:**
- **Health Check**: `curl http://localhost:8000/health` 
  - Should return: `{"status":"healthy","service":"Statistical Engine"}`
- **Statistical Analysis**: `curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d '{"data": [{"group": "A", "value": 10}, {"group": "A", "value": 12}, {"group": "B", "value": 15}, {"group": "B", "value": 17}], "outcome_variable": "value", "group_variable": "group", "analysis_type": "independent_ttest"}'`
  - Should return statistical analysis results
- **Figure Generation**: Backend supports publication-ready figure generation endpoints

### 🆕 Current Features (Simple Statistical Server)

The system uses a **simple statistical server** (`simple_statistical_server.py`) with core functionality:

- **📊 Statistical Analysis** - T-tests, ANOVA, Chi-square, Mann-Whitney U tests
- **🧬 Survival Analysis** - Kaplan-Meier survival curves with lifelines
- **📈 Multivariate Analysis** - Logistic, linear, and Cox regression with forest plots
- **🎨 Publication Figures** - Journal-specific figure generation (Nature, Science, NEJM, Cell)
- **🔧 Code Editing** - Support for custom figure parameters and code modifications
- **📱 Display Figures** - Web-optimized figure rendering

### 📦 Dependencies

The backend uses a minimal set of Python dependencies for statistical analysis:

```bash
# Core statistical libraries
pip install fastapi uvicorn pandas numpy scipy matplotlib seaborn statsmodels lifelines
```

### ⚠️ Troubleshooting

**Common Issues & Solutions:**

1. **Backend server not starting**
   - Make sure you're in the `backend/` directory
   - Use the correct command: `python simple_statistical_server.py`
   - Install missing dependencies: `pip install -r requirements.txt`

2. **"ModuleNotFoundError: No module named 'jwt'"**
   - Install missing dependencies: `/opt/anaconda3/envs/scifig-ai/bin/pip install PyJWT python-jose[cryptography]`

3. **"ModuleNotFoundError: No module named 'lifelines'"**  
   - Install survival analysis package: `/opt/anaconda3/envs/scifig-ai/bin/pip install lifelines`

4. **Database warnings are normal**
   - The "degraded" status is expected in development
   - Core statistical and API functionality works regardless

5. **Port already in use**
   - Kill existing processes: `pkill -f python`
   - Try different ports if needed

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

**Simple Statistical Server (`simple_statistical_server.py`)**:
- 🎯 **Single Port** (8000): Statistical analysis and figure generation
- 📊 **Core Statistics**: T-tests, ANOVA, Chi-square, Mann-Whitney U, survival analysis
- 📈 **Multivariate Models**: Logistic, linear, and Cox regression
- 🎨 **Publication Figures**: Journal-ready visualizations with multiple format support
- 🖥️ **Web Interface**: Compatible with React frontend via CORS
- ⚡ **Fast Processing**: Direct Python statistical computation without database overhead