# SciFig AI Backend

FastAPI-based backend for the SciFig AI statistical analysis platform.

## 🚀 Quick Start

### Option 1: Conda Environment (Recommended for Development)

1. **Quick setup:**
   ```bash
   cd backend
   ./setup_env.sh          # Linux/Mac
   # OR setup_env.bat       # Windows
   ```

2. **Manual setup:**
   ```bash
   conda env create -f environment.yml
   conda activate scifig-ai
   ```

3. **Run tests:**
   ```bash
   python run_tests.py
   ```

4. **Start development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Option 2: Docker (Production)

1. **Clone and setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations:**
   ```bash
   docker-compose run migrate
   ```

4. **Access the API:**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

### Option 3: Manual Setup

1. **Python setup:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database setup:**
   ```bash
   # Install PostgreSQL and Redis locally
   # Or use Docker:
   docker run -d --name scifig-postgres -p 5432:5432 -e POSTGRES_DB=scifig_ai -e POSTGRES_USER=scifig -e POSTGRES_PASSWORD=password postgres:15
   docker run -d --name scifig-redis -p 6379:6379 redis:7-alpine
   ```

3. **Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URLs
   ```

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## 📊 Core Features Implemented

### ✅ Statistical Engine
- **T-tests**: Independent samples, paired, Welch's
- **Chi-square**: Independence testing
- **Assumption checking**: Normality (Shapiro-Wilk), equal variance (Levene)
- **Effect sizes**: Cohen's d, Cramér's V
- **Smart test selection**: AI-powered recommendations

### ✅ File Processing
- **Formats**: CSV, Excel (.xlsx, .xls)
- **Auto-detection**: Variable types, roles (outcome/group/time)
- **Data quality**: Missing data analysis, outlier detection
- **Smart parsing**: Multiple encodings, separators

### ✅ Figure Generation
- **Journal styles**: Nature, Science, NEJM formatting
- **Chart types**: Box plots, bar plots, scatter plots
- **Statistical annotations**: Significance stars, p-values
- **Export formats**: PNG, SVG (PDF/EPS coming soon)

### ✅ API Endpoints
```
POST /api/v1/upload          # File upload & processing
POST /api/v1/analysis/run    # Run statistical analysis
GET  /api/v1/analysis/{id}   # Get analysis results
GET  /api/v1/analysis/{id}/figures  # Get generated figures
POST /api/v1/auth/login      # User authentication
GET  /api/v1/auth/me         # User profile
```

## 🔧 Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   └── config.py        # Configuration settings
│   ├── api/v1/              # API endpoints
│   │   ├── analysis.py      # Analysis endpoints
│   │   ├── files.py         # File upload endpoints
│   │   └── auth.py          # Authentication endpoints
│   ├── models/
│   │   └── database.py      # SQLAlchemy models
│   └── services/
│       ├── statistical_engine.py  # Core statistics
│       ├── figure_generator.py    # Plot generation
│       ├── file_processor.py      # File handling
│       └── auth.py                # Authentication
├── static/                  # Generated figures
├── uploads/                 # Temporary file storage
└── requirements.txt         # Python dependencies
```

## 📈 Performance Features

- **Async processing**: All endpoints are async
- **Background jobs**: Figure generation runs in background
- **Caching**: Results cached for repeated analyses
- **Streaming**: Large file upload support
- **Validation**: Input validation with Pydantic

## 🧪 Testing the API

### 1. Upload a file:
```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_data.csv"
```

### 2. Run analysis:
```bash
curl -X POST "http://localhost:8000/api/v1/analysis/run" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "file-id-from-upload",
    "outcome_variable": "outcome",
    "group_variable": "group"
  }'
```

### 3. Get results:
```bash
curl "http://localhost:8000/api/v1/analysis/{analysis_id}"
```

## 🔒 Security

- **Optional authentication**: Works with/without login
- **File validation**: Size, type, content checks
- **Input sanitization**: All inputs validated
- **CORS**: Configurable for frontend integration
- **Rate limiting**: Coming soon

## 📊 Data Flow

```
1. File Upload → Validation → Processing → Metadata Extraction
2. Analysis Request → Data Profiling → Test Selection → Execution
3. Results → Figure Generation → Storage → API Response
```

## 🚧 Current Limitations (TODOs)

- [ ] Full database integration (using mock data)
- [ ] Real Supabase authentication
- [ ] Advanced statistical tests (ANOVA, regression, survival)
- [ ] Real-time collaboration features
- [ ] Comprehensive error handling
- [ ] Rate limiting and monitoring
- [ ] Production deployment configuration

## 🔧 Development

### Adding new statistical tests:
1. Add test enum to `TestType` in `statistical_engine.py`
2. Implement test logic in `StatisticalExecutor`
3. Add test registry entry in `StatisticalBrain`
4. Update recommendation logic

### Adding new figure types:
1. Add method to `FigureGenerator`
2. Update the background task in `analysis.py`
3. Add corresponding API endpoint

### Environment Variables:
```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SECRET_KEY=your_secret_key

# Optional
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key
```

## 🤝 Integration with Frontend

The backend is designed to work with the existing React frontend:

1. **File upload**: Replace frontend file processing with API calls
2. **Analysis**: Move statistical calculations from client to server
3. **Results**: Persist results in database instead of local state
4. **Figures**: Serve generated figures via static file endpoints

### Example Frontend Integration:
```typescript
// Replace current file upload
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// Replace current analysis execution
const runAnalysis = async (config: AnalysisConfig) => {
  const response = await fetch('/api/v1/analysis/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  
  return response.json();
};
```

This backend provides a solid foundation for migrating from a frontend-only app to a full-stack platform with proper data persistence, scalable statistical computing, and publication-ready figure generation. 