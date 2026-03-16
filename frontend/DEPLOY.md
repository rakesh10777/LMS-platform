# Frontend Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)
```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration
1. Push code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Import your repo
4. Select this folder (`frontend`)
5. Deploy

## Environment Variables

Before deploying, update the backend URL:

### Option A: In vercel.json (for API proxy)
Edit `vercel.json` and replace `YOUR-RENDER-URL.onrender.com` with your actual backend URL.

### Option B: As Environment Variable
In Vercel dashboard, add:
- Key: `VITE_API_URL`
- Value: `https://your-backend.onrender.com`

Then in `src/services/api.js`, make sure line 1 reads:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

## Build for Production
```bash
npm run build
```

The output will be in the `dist` folder.
