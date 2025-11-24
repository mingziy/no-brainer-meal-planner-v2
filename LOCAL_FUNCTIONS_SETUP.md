# Local Firebase Functions Setup Complete

## What Was Created

### 1. `functions/package.json`
- Added all required dependencies
- Configured for Node.js 20
- Set main entry point to `index.js`

### 2. `functions/index.js`
Complete implementation of all chatbot functions:

#### Chatbot Workflow Functions:
- ✅ `chatbotBrainstormIdeas` - AI brainstorms 4-6 recipe names
- ✅ `chatbotFetchPreviews` - Searches and scrapes recipe previews (no AI)
- ✅ `chatbotScrapeOnly` - Full scrape of recipe page (no AI)
- ✅ `chatbotCleanAndSave` - AI cleans and structures recipe data
- ✅ `chatbotGetAnotherRecipe` - Fetches alternative recipe

#### Legacy Functions:
- ✅ `aiRecipeChat` - General AI chat function

### 3. `functions/.runtimeconfig.json`
- Local emulator configuration with API keys
- Allows emulator to access OpenAI and Gemini APIs

### 4. Re-enabled Emulator Connection
- `src/config/firebase.ts` now connects to localhost:5001 in development

## Features Implemented

### Smart Recipe Search
- Searches Allrecipes.com first
- Scrapes actual recipe pages
- Extracts preview data (title, image, description)
- Falls back to Google search if needed

### Comprehensive Scraping
- Extracts JSON-LD Recipe schema if available
- Falls back to manual HTML parsing
- Extracts:
  - Ingredients list
  - Step-by-step instructions
  - Prep/cook/total times
  - Servings
  - Nutrition info (if available)

### AI Processing
- Uses OpenAI GPT-4o-mini for cost-efficiency
- Parses ingredients into structured format (amount, unit, name, category)
- Cleans and formats all text
  - Estimates nutrition if not provided
- Detects cuisine and category
- Generates relevant tags

## How to Test

### 1. Verify Emulator is Running
```bash
curl http://localhost:5001
```

Should see Firebase emulator UI.

### 2. Hard Refresh Browser
Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)

### 3. Test the Full Workflow
1. Navigate to http://localhost:3000
2. Click "AI Chat" in bottom nav
3. Type: "healthy chicken recipes"
4. Click Send
5. **Expected**: AI brainstorms ideas in 5-10 seconds
6. Select recipe ideas with checkboxes
7. Click "Confirm Selection"
8. **Expected**: Recipe cards appear within 10-20 seconds
9. Click "Export to Recipe" on any card
10. **Expected**: Preview modal shows scraped data
11. Click "Confirm & Extract"
12. **Expected**: RecipeEditFormV2 opens with populated data

## Function Details

### Memory & Timeout Settings
- `chatbotBrainstormIdeas`: 256MB, 60s
- `chatbotFetchPreviews`: 512MB, 120s (searches multiple recipes)
- `chatbotScrapeOnly`: 512MB, 60s
- `chatbotCleanAndSave`: 1GB, 120s (AI processing)
- `chatbotGetAnotherRecipe`: 512MB, 60s

### API Costs (OpenAI GPT-4o-mini)
- Brainstorm: ~200 tokens (~$0.0001)
- Clean & Save: ~2000 tokens (~$0.001)
- Total per recipe extraction: **~$0.0011**

Very cost-effective!

## Troubleshooting

### If Functions Don't Load
```bash
# Stop emulator
pkill -f "firebase emulators"

# Restart
cd /Users/mingziy/MealPlanner/figma-design
firebase emulators:start --only functions
```

### If API Keys Don't Work
The `.runtimeconfig.json` file provides API keys to the emulator. If you get API key errors:

```bash
# Check the file exists
ls -la functions/.runtimeconfig.json

# Verify content
cat functions/.runtimeconfig.json
```

### If Scraping Fails
Some recipe sites block scrapers. The function will:
1. Try Allrecipes first (most reliable)
2. Fall back to Google search link if scraping fails
3. Return basic preview data even if full scraping fails

### Check Emulator Logs
The functions log extensively. Check the terminal running the emulator for detailed logs:
- `[chatbotBrainstormIdeas]` - AI brainstorming logs
- `[chatbotFetchPreviews]` - Search and scrape logs
- `[chatbotScrapeOnly]` - Scraping logs
- `[chatbotCleanAndSave]` - AI processing logs

## Next Steps

### Test Locally
Test the complete flow end-to-end with the local emulator.

### Deploy to Production
Once testing is complete:
```bash
firebase deploy --only functions
```

This will update the production functions with any changes you make locally.

### Modify Functions
Edit `functions/index.js` to:
- Add more recipe sites
- Improve scraping logic
- Adjust AI prompts
- Add new features

The emulator will auto-reload on file changes!

## File Structure
```
functions/
├── index.js              # Main functions file (YOU ARE HERE)
├── package.json          # Dependencies
├── .runtimeconfig.json   # Local API keys (gitignored)
├── node_modules/         # Installed packages
└── src/
    └── analyze-food.ts   # Legacy function
```

## Status
- ✅ Functions recreated
- ✅ Emulator running
- ✅ API keys configured
- ✅ Frontend connected to emulator
- ✅ Ready to test!

**Everything is set up for local development!** 🎉

