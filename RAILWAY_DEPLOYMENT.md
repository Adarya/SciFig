# Railway All-in-One Deployment Guide

Deploy your entire SciFig application (frontend + backend) to Railway in **under 10 minutes**!

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your Environment (2 minutes)
1. **Set up Supabase** (if you haven't already):
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings > API
   - Copy your `URL`, `anon key`, and `service_role key`

2. **Generate a secure JWT secret**:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### Step 2: Deploy to Railway (5 minutes)
1. **Create Railway account**: [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the SciFig repository

3. **Railway will automatically**:
   - Detect the `railway.json` configuration
   - Use the root `Dockerfile` (serves both frontend + backend)
   - Build and deploy your application
   - Provide you with a live URL

### Step 3: Configure Backend Environment Variables (3 minutes) 🔒
In your Railway dashboard, go to **Variables** tab and add these **BACKEND** variables:

```env
# 🔒 SENSITIVE: Supabase Configuration (from your Supabase dashboard)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 🔒 SENSITIVE: JWT Secret (generated above)
SECRET_KEY=your-32-character-secret-key-here

# Application Settings
APP_NAME=SciFig AI Statistical Engine
APP_VERSION=2.0.0
DEBUG=false
HOST=0.0.0.0
PORT=8000

# CORS - Railway auto-generates your domain
ALLOWED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}

# File Upload Settings
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
MAX_DATASET_SIZE=100000
CACHE_RESULTS=true
```

**Frontend variables are automatically configured** via `railway.json` during build! 🎉

### Step 4: Deploy and Test (2 minutes)
1. **Railway auto-deploys** after you set environment variables
2. **Test your application**:
   - Visit your Railway URL (e.g., `https://scifig-production.railway.app`)
   - Test the frontend interface
   - Upload a CSV and run an analysis
   - Check backend health at `/health`

## ✅ **That's it! Your app is live!**

---

## 🔧 **Railway Configuration Details**

### What Railway Does Automatically:
- ✅ **Multi-stage build**: Builds frontend, then backend with frontend included
- ✅ **Health checks**: Monitors `/health` endpoint
- ✅ **Auto-scaling**: Scales based on traffic
- ✅ **HTTPS**: Automatic SSL certificates
- ✅ **Domain**: Provides `*.railway.app` domain
- ✅ **Logs**: Real-time application logs
- ✅ **Metrics**: CPU, memory, network monitoring

### Project Structure on Railway:
```
Railway Container:
├── Frontend (React/Vite) → served at /
├── Backend API (FastAPI) → served at /api/v1/*
├── Health checks → /health
├── Static files → /uploads/*
└── Legacy endpoints → /analyze, etc.
```

---

## 🛠️ **Advanced Configuration**

### Custom Domain (Optional):
1. Go to Railway dashboard → Settings
2. Add your custom domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` environment variable

### Scaling (Optional):
Railway automatically scales, but you can configure:
- **Memory**: 512MB - 32GB
- **CPU**: 1-8 vCPUs
- **Replicas**: 1-10 instances

### Monitoring:
- **Logs**: Real-time in Railway dashboard
- **Metrics**: Built-in CPU/memory/network graphs
- **Alerts**: Configure notifications for errors

---

## 🔍 **Troubleshooting**

### Common Issues:

1. **Build Fails**:
   - Check that all files are committed to GitHub
   - Verify `railway.json` points to correct Dockerfile
   - Check build logs in Railway dashboard

2. **Environment Variables**:
   - Ensure all required variables are set
   - No spaces around `=` in variable values
   - Restart deployment after adding variables

3. **Supabase Connection**:
   - Verify Supabase project is active
   - Check API keys are correct
   - Ensure database tables exist

4. **Frontend Not Loading**:
   - Check if build completed successfully
   - Verify static files are served
   - Check browser console for errors

### Debugging Commands:
```bash
# View Railway logs
railway logs

# Connect to Railway shell
railway shell

# Check environment variables
railway variables
```

---

## 💰 **Pricing**

Railway Pricing (as of 2024):
- **Hobby Plan**: $5/month (sufficient for most use cases)
- **Pro Plan**: $20/month (higher limits)
- **Usage-based**: Pay for actual resource consumption

Estimated monthly cost for SciFig: **$5-15** depending on usage.

---

## 📞 **Support**

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)  
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

## 🎉 **Next Steps After Deployment**

1. **Test thoroughly** with real data
2. **Set up monitoring** alerts
3. **Configure backups** for your Supabase database
4. **Add custom domain** if needed
5. **Monitor usage** and costs

**Congratulations! Your SciFig app is now live on Railway!** 🚀
