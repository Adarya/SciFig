# Railway Authentication Fix

## 🚨 Issue
Authentication was failing because frontend was using placeholder Supabase URL (`your-project.supabase.co`) instead of the real one.

## ✅ Fix Applied
1. **Updated `railway.json`** - Added Supabase environment variables to build args:
   ```json
   "VITE_SUPABASE_URL": "${{SUPABASE_URL}}",
   "VITE_SUPABASE_ANON_KEY": "${{SUPABASE_ANON_KEY}}"
   ```

2. **Updated `Dockerfile`** - Added proper environment variable handling:
   ```dockerfile
   ARG VITE_SUPABASE_URL
   ARG VITE_SUPABASE_ANON_KEY
   ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
   ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
   ```

## 🔧 What Railway Will Do Now
1. **Build Stage**: Pass your actual Supabase URL/key from Railway env vars
2. **Frontend Build**: Vite will compile with real Supabase configuration  
3. **Runtime**: Authentication will use your real Supabase project

## 📋 Next Steps
1. **Verify Railway Environment Variables** are set:
   - `SUPABASE_URL` (backend)
   - `SUPABASE_ANON_KEY` (backend) 
   - `SUPABASE_SERVICE_ROLE_KEY` (backend)

2. **Configure Supabase OAuth Redirect URLs**:
   - Site URL: `https://scifig-production.up.railway.app`
   - Redirect URLs: `https://scifig-production.up.railway.app/auth/callback`

3. **Deploy**: `git push` will trigger Railway rebuild with proper auth config

## ✅ Expected Result
Authentication URL will change from:
```
❌ https://your-project.supabase.co/auth/v1/authorize...
```
To:
```
✅ https://nynbcyrlppmkwkhxdyyo.supabase.co/auth/v1/authorize...
```

Authentication should work perfectly! 🎉
