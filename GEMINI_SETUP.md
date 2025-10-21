# 🤖 Gemini AI Setup Guide

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 2: Create Environment File

Create a file called `.env.local` in the project root:

```bash
# In /Users/mingziy/MealPlanner/figma-design/
touch .env.local
```

## Step 3: Add Your API Key

Open `.env.local` and add:

```env
VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with the actual key you copied.

## Step 4: Restart Dev Server

```bash
npm run dev
```

## ⚠️ Security Note

- ✅ `.env.local` is already in `.gitignore` (safe)
- ❌ Never commit your API key to git
- ⚠️ The API key will be visible in browser (for personal use only)
- 🔒 For production, move to backend server

## 📊 Free Tier Limits

- **1,500 requests per day** (more than enough!)
- Rate limit: 60 requests per minute
- No credit card required

## ✅ Testing

After setup, upload a recipe screenshot and the AI will automatically parse it!


