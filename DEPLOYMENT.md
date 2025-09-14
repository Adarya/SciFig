# SciFig Deployment Guide

## 🚀 Quick Deployment Options (Fastest to Most Robust)

### Option 1: Vercel (Frontend) + Railway (Backend) - **FASTEST** ⚡
**Setup time: 5-8 minutes**

#### Backend on Railway:
1. **Create Railway account**: [railway.app](https://railway.app)
2. **Deploy from GitHub**:
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Add deployment config"
   git push origin main
   ```
3. **Connect Repository**: New Project → Deploy from GitHub → Select SciFig repo
4. **Set Environment Variables** in Railway dashboard:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   SECRET_KEY=your-32-char-secret-key
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```
5. **Deploy**: Railway auto-detects the `backend/Dockerfile` and deploys
6. **Get Backend URL**: Copy the generated Railway URL (e.g., `https://scifig-backend.railway.app`)

#### Frontend on Vercel:
1. **Create Vercel account**: [vercel.com](https://vercel.com)
2. **Import Project**: Dashboard → New Project → Import from Git
3. **Configure**:
   - Framework: Vite
   - Build Command: `yarn build`
   - Output Directory: `dist`
4. **Set Environment Variable**:
   ```
   VITE_API_BASE_URL=https://your-railway-url.railway.app/api/v1
   ```
5. **Deploy**: Vercel builds and deploys automatically

**✅ Your app is live in ~5-8 minutes!**

---

### Option 2: Render (All-in-One) - **SIMPLE** 
**Setup time: 8-10 minutes**

1. **Create Render account**: [render.com](https://render.com)
2. **Connect GitHub repository**
3. **Use the provided `render.yaml`** - Render will auto-detect it
4. **Set Environment Variables** in Render dashboard (same as Railway above)
5. **Deploy both services** simultaneously

---

### Option 3: Docker + Any Platform - **MOST FLEXIBLE**
**Setup time: 10-15 minutes**

Use the provided Docker configurations with any platform:

#### Local Testing:
```bash
# Copy environment file
cp backend/env.example .env

# Edit .env with your actual Supabase credentials
# Build and run
docker-compose up --build
```

#### Deploy to:
- **Railway**: Use `railway.json` config
- **Render**: Use Docker build option
- **AWS/GCP/Azure**: Use container services
- **DigitalOcean App Platform**
- **Heroku Container Registry**

---

## 🔧 Environment Variables Setup

### Required Variables:
```env
# Get from Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Generate a secure 32+ character secret key
SECRET_KEY=your-super-secure-secret-key-here-32-chars-minimum

# Update after deploying frontend
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-domain.vercel.app
```

### Generate Secret Key:
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

---

## 🧪 Testing Your Deployment

### Health Checks:
1. **Backend Health**: `https://your-backend-url/health`
2. **API Status**: `https://your-backend-url/`  
3. **Frontend**: Visit your frontend URL
4. **Full Integration**: Test file upload and analysis

### Common Issues:
- **CORS Errors**: Update `ALLOWED_ORIGINS` with your frontend URL
- **Supabase Connection**: Verify credentials in environment variables
- **File Upload**: Check upload directory permissions
- **Scientific Libraries**: Ensure Docker has sufficient memory (1GB+)

---

## 📊 Platform Comparison

| Platform | Speed | Cost | Complexity | Best For |
|----------|-------|------|------------|----------|
| **Vercel + Railway** | ⚡⚡⚡ | Free tiers available | ⭐ | Quick MVP, demos |
| **Render** | ⚡⚡ | $7/month combined | ⭐⭐ | Simple management |
| **Docker + Cloud** | ⚡ | $10-30/month | ⭐⭐⭐ | Production, scaling |

---

## 🎯 Recommended Workflow:

1. **Start with Vercel + Railway** for immediate deployment
2. **Test thoroughly** with real data
3. **Scale to dedicated hosting** when needed
4. **Add monitoring** and automated backups

---

## 📞 Need Help?

- Check deployment logs in your platform dashboard
- Verify all environment variables are set correctly
- Test locally with Docker first if issues occur
- Ensure your Supabase database is accessible

**Ready to deploy? Start with Option 1 for the fastest results!** 🚀
