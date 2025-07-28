from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Simple FastAPI app without complex dependencies
app = FastAPI(title="SciFig AI API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "SciFig AI Backend is running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "SciFig AI API"}

@app.post("/api/v1/analyze")
async def analyze_data(data: dict):
    """Simple endpoint to test frontend-backend communication"""
    return {
        "status": "success",
        "message": "Analysis endpoint working",
        "received_data": data
    }