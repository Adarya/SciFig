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

# Verify installation works
python -c "from publication_viz_engine import PublicationVizEngine; print('✅ Backend ready')"
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
python simple_statistical_server.py

# ✅ Backend will be at: http://localhost:8000
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

🎉 **You're ready to go!** Upload your data and start creating publication-ready statistical analyses.

---

## 📋 What's Included

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

1. **Frontend won't start (`vite: command not found`)**
   - Install dependencies: `yarn install` or `npm install`
   - Use Yarn if npm has permission issues: `yarn install`

2. **Backend import errors**
   - Install dependencies: `cd backend && pip install -r requirements.txt`
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