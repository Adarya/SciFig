# PowerShell script to start SciFig backend server
# Usage: .\start_server.ps1

Write-Host "🚀 Starting SciFig Backend Server..." -ForegroundColor Green

# Set environment variables for PowerShell
$env:DEBUG = "true"
$env:SECRET_KEY = "your-super-secret-jwt-key-here-make-it-long-and-random-must-be-at-least-32-characters"
$env:SUPABASE_URL = "https://your-supabase-url.supabase.co"
$env:SUPABASE_KEY = "your-supabase-anon-key-here"
$env:APP_NAME = "SciFig AI Statistical Engine"
$env:APP_VERSION = "2.0.0"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:5173,http://localhost:5174"

Write-Host "📋 Environment configured:" -ForegroundColor Yellow
Write-Host "  DEBUG: $env:DEBUG"
Write-Host "  SECRET_KEY: [HIDDEN]"
Write-Host "  SUPABASE_URL: $env:SUPABASE_URL"

Write-Host "`n🔍 Running diagnostics first..."
python diagnose_figure_error.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Diagnostics passed! Starting server..." -ForegroundColor Green
    Write-Host "🌐 Server will be available at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📖 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "`nPress Ctrl+C to stop the server`n"
    
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} else {
    Write-Host "`n❌ Diagnostics failed! Please check the errors above." -ForegroundColor Red
    Write-Host "💡 Make sure you have installed all dependencies:" -ForegroundColor Yellow
    Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
}

Write-Host "`nServer stopped." -ForegroundColor Yellow
