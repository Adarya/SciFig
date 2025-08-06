# SciFig AI Statistical Engine - Modular Architecture

## 🎯 Overview

This is a refactored, modular version of the SciFig AI Statistical Engine with:

- **Supabase Integration**: User authentication and data persistence
- **Modular Architecture**: Clean separation of concerns
- **JWT Authentication**: Secure user sessions
- **Role-based Access Control**: Admin, researcher, analyst, and user roles
- **Advanced Statistical Analysis**: T-tests, ANOVA, survival analysis, multivariate models
- **Publication-Quality Visualizations**: Nature, Science, Cell, NEJM journal styles

## 🏗️ Architecture

```
backend/
├── app/
│   ├── auth/           # Authentication & user management
│   ├── config/         # Settings & database configuration
│   ├── statistical/    # Statistical analysis services
│   ├── visualization/  # Figure generation services
│   ├── data/          # Data management (future)
│   ├── utils/         # Utility functions
│   └── main.py        # FastAPI app initialization
├── publication_viz_engine.py  # Original visualization engine
├── requirements.txt   # Python dependencies
├── env.example       # Environment variables template
└── start.py          # Startup script
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.11+
- Supabase account and project
- Virtual environment (recommended)

### 2. Installation

```bash
# Clone and navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Supabase Setup

**Get your Supabase credentials:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Navigate to **Settings → API**
4. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role (secret) key

### 4. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your Supabase credentials
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
SECRET_KEY="your-super-secret-jwt-key-generate-a-long-random-string"
```

### 5. Start the Server

```bash
# Start the modular application
python start.py

# Or use uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will:
- ✅ Initialize database tables automatically
- 🚀 Start on http://localhost:8000
- 📚 Provide API docs at http://localhost:8000/docs

## 🔧 API Endpoints

### Authentication (`/auth`)
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update user profile
- `POST /auth/logout` - User logout
- `GET /auth/users` - List all users (admin only)

### Statistical Analysis (`/api/v1/statistical`)
- `POST /analyze` - Perform univariate analysis
- `POST /analyze_multivariate` - Perform multivariate analysis
- `GET /methods` - Get available statistical methods
- `GET /validation/data` - Validate data for analysis

### Visualization (`/api/v1/visualization`)
- `POST /generate_display_figure` - Generate web display figures
- `POST /generate_publication_figure` - Generate publication-ready figures
- `POST /generate_code_edit_figure` - Generate customizable figures
- `GET /styles` - Get available journal styles
- `GET /formats` - Get available output formats

### Projects (`/api/v1/projects`)
- `GET /` - List user's projects with pagination and search
- `POST /` - Create a new project
- `GET /{project_id}` - Get a specific project
- `PUT /{project_id}` - Update a project
- `DELETE /{project_id}` - Delete a project
- `GET /{project_id}/stats` - Get project statistics
- `GET /{project_id}/analyses` - List analyses for a project

### Analyses (`/api/v1/analyses`)
- `GET /` - List user's analyses with optional filters
- `POST /` - Create a new analysis
- `GET /{analysis_id}` - Get a specific analysis
- `PUT /{analysis_id}` - Update an analysis
- `DELETE /{analysis_id}` - Delete an analysis

## 👥 User Roles

- **Admin**: Full system access, user management
- **Researcher**: Advanced analysis, multivariate models
- **Analyst**: Standard statistical analysis
- **User**: Basic analysis and visualization

## 📊 Statistical Methods

### Univariate Analysis
- Independent Samples T-Test
- Mann-Whitney U Test
- One-Way ANOVA
- Chi-Square Test of Independence
- Kaplan-Meier Survival Analysis

### Multivariate Analysis
- Logistic Regression
- Linear Regression
- Cox Proportional Hazards Regression
- Forest Plot Visualization

## 🎨 Visualization Styles

- **Nature**: Clean, professional styling
- **Science**: Bold, impactful visuals
- **Cell**: Vibrant, detailed figures
- **NEJM**: Medical journal styling

## 🗄️ Database Schema

The application automatically creates these tables:

### `users` table
```sql
id UUID PRIMARY KEY (references auth.users)
email TEXT UNIQUE NOT NULL
full_name TEXT
role TEXT DEFAULT 'user'
organization TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### `datasets` table
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
name TEXT NOT NULL
description TEXT
file_name TEXT
file_size INTEGER
columns_info JSONB
row_count INTEGER
upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
is_public BOOLEAN DEFAULT false
metadata JSONB
```

### `projects` table
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
name TEXT NOT NULL
description TEXT
study_type TEXT
is_shared BOOLEAN DEFAULT false
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### `analyses` table
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
dataset_id UUID REFERENCES datasets(id)
project_id UUID REFERENCES projects(id) ON DELETE SET NULL
analysis_type TEXT NOT NULL
parameters JSONB NOT NULL
results JSONB NOT NULL
figures JSONB DEFAULT '{}'
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
is_public BOOLEAN DEFAULT false
name TEXT
description TEXT
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Pydantic models for all requests

## 🧪 Testing

```bash
# Run tests (when implemented)
pytest

# Test API endpoints
curl -X GET http://localhost:8000/health
curl -X GET http://localhost:8000/api/v1/statistical/methods
```

## 🔄 Migration from Simple Server

The new modular application maintains backward compatibility with these changes:

1. **API Versioning**: New endpoints use `/api/v1/` prefix
2. **Authentication**: Optional for most endpoints (add `Authorization: Bearer <token>` header when authenticated)
3. **Enhanced Error Handling**: Better error messages and status codes
4. **Database Persistence**: Analysis results can be saved (when authenticated)

### Legacy Endpoint Mapping

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/analyze` | `/api/v1/statistical/analyze` |
| `/analyze_multivariate` | `/api/v1/statistical/analyze_multivariate` |
| `/generate_display_figure` | `/api/v1/visualization/generate_display_figure` |
| `/generate_publication_figure` | `/api/v1/visualization/generate_publication_figure` |

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check Supabase credentials
curl -H "apikey: YOUR_ANON_KEY" "https://YOUR_PROJECT_ID.supabase.co/rest/v1/"
```

### Environment Variables Not Loading
```bash
# Ensure .env file exists and has correct format
cat .env
# Check for typos in variable names
```

### Import Errors
```bash
# Verify all dependencies installed
pip list | grep fastapi
pip list | grep supabase
```

### Database Table Creation Failed
- Check if you have proper permissions in Supabase
- Verify service role key has admin privileges
- Check Supabase logs in dashboard

## 📝 Development

### Adding New Statistical Methods

1. Add method to `app/statistical/services.py`
2. Update routes in `app/statistical/routes.py`
3. Add validation rules
4. Update documentation

### Adding New Visualization Types

1. Extend `PublicationVizEngine` or `PublicationVizService`
2. Add routes in `app/visualization/routes.py`
3. Update available styles/formats endpoints

## 🤝 Contributing

1. Follow the modular architecture pattern
2. Add proper error handling and logging
3. Include type hints and docstrings
4. Update tests and documentation

## 📄 License

Same as the original SciFig AI project.

---

**Need help?** Check the API documentation at `/docs` when the server is running! 