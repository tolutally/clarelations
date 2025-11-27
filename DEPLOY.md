# Deployment Guide

## Railway Deployment

### 1. Deploy Backend Service
```bash
cd backend
railway init
railway up
```

**Environment Variables for Backend:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `VITE_ALLOWED_EMAILS`
- `NODE_ENV=production`

### 2. Deploy Frontend Service
```bash
cd frontend
railway init
railway up
```

**Environment Variables for Frontend:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  
- `VITE_API_URL` (your backend Railway URL)
- `NODE_ENV=production`

## Local Development

```bash
# Install dependencies
npm install && cd backend && npm install && cd ../frontend && npm install

# Run both services
npm run dev

# Or run individually
npm run backend:dev   # Backend on port 3001
npm run frontend:dev  # Frontend on port 5173
```

## Production Build

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`