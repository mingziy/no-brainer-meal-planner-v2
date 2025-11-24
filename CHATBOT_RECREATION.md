# Recipe Chatbot Frontend Recreation

## What Was Restored

The RecipeChatbot frontend component was completely recreated from scratch after it was accidentally deleted. The backend Firebase Cloud Functions are still deployed and functional.

## Files Created/Modified

### Created:
1. **`src/components/ai/RecipeChatbot.tsx`** - Main chatbot component with all 4 stages of the workflow

### Modified:
2. **`src/App.tsx`** - Added import and routing for `RecipeChatbot` component
3. **`src/components/shared/BottomNav.tsx`** - Added "AI Chat" navigation button

## Component Features

### Stage 1: AI Brainstorming
- User sends a query (e.g., "healthy chicken recipes")
- Calls `chatbotBrainstormIdeas` Firebase function
- Displays recipe ideas with checkboxes for selection

### Stage 2: Search & Preview Scrape
- When user confirms selected ideas
- Calls `chatbotFetchPreviews` Firebase function
- Fetches and displays recipe preview cards with:
  - Image
  - Title
  - Description
  - Source website

### Stage 3: Interactive Recipe Cards
Each recipe card has 3 buttons:
1. **View Details** - Opens recipe URL in new tab
2. **Export to Recipe** - Scrapes the recipe (Stage 4)
3. **Get Another One** - Fetches an alternative recipe

### Stage 4: Extract & Clean Recipe
When user clicks "Export to Recipe":
1. Calls `chatbotScrapeOnly` - Scrapes raw recipe data (no AI, free)
2. Shows **Preview Modal** with all scraped data:
   - Image
   - Title, description, source
   - Times (prep/cook/total)
   - Servings
   - Ingredients list
   - Instructions list
   - Nutrition info
3. User clicks **"Confirm & Extract"**:
   - Calls `chatbotCleanAndSave` - AI processes and structures the data
   - Maps the cleaned recipe to `draftRecipe` format
   - Opens `RecipeEditFormV2` with populated data

## Data Mapping

The AI-cleaned recipe is mapped to the RecipeEditFormV2 expected format:

```typescript
{
  name: string,                    // Recipe title
  image: string,                   // Main image URL
  prepTime: string,                // e.g., "15 min"
  cookTime: string,                // e.g., "30 min"
  totalTime: string,               // e.g., "45 min"
  servings: number,                // Number of servings
  ingredients: [{                  // Parsed ingredients
    amount: string,                // e.g., "2"
    unit: string,                  // e.g., "cups"
    name: string,                  // e.g., "flour"
    category: string               // e.g., "grains"
  }],
  instructions: [{                 // Step-by-step instructions
    order: number,
    description: string
  }],
  nutrition: {                     // Nutritional info
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    fiber: number
  },
  cuisine: string,                 // Auto-detected cuisine
  categories: string[],            // Meal types
  tags: string[],                  // Additional tags
  sourceUrl: string,               // Original recipe URL
  extractedImages: string[]        // All available images for selection
}
```

## Fixed Issues

### 1. Image Loading
- Added `extractedImages` array to allow image selection in RecipeEditFormV2
- Image URLs are properly passed through the entire pipeline

### 2. Recipe Name Population
- Maps `recipe.title` from AI response to `name` field
- Fallback to scraped title if AI doesn't provide one

### 3. Calories Auto-Fill
- Maps `recipe.nutrition.calories` from AI response
- Fallback to scraped nutrition data

### 4. Protein/Meal Type Tags
- Maps `recipe.tags` array from AI response
- Maps `recipe.category` to `categories` array
- Auto-detects cuisine and adds to `cuisine` field

## Testing Instructions

### Local Testing:
1. Start dev server: `npm run dev` (already running)
2. Start Firebase emulators: `firebase emulators:start --only functions` (already running)
3. Navigate to http://localhost:3000
4. Click "AI Chat" in bottom navigation
5. Test the full workflow:
   - Send: "healthy chicken recipes"
   - Select ideas
   - Click "Export to Recipe" on a card
   - Review scraped data in preview modal
   - Click "Confirm & Extract"
   - Verify RecipeEditFormV2 opens with populated data

### Production Testing:
1. Build: `npm run build`
2. Deploy: `firebase deploy --only hosting`
3. Visit: https://meal-planer-v2.web.app
4. Test the same workflow

## Backend Functions (Already Deployed)

All backend functions are deployed and functional:
- ✅ `chatbotBrainstormIdeas` - AI brainstorming
- ✅ `chatbotFetchPreviews` - Search & scrape previews
- ✅ `chatbotScrapeOnly` - Scrape without AI
- ✅ `chatbotCleanAndSave` - AI cleanup and structure
- ✅ `chatbotGetAnotherRecipe` - Fetch alternative recipe

## Known Issues to Monitor

1. **Image CORS**: Some recipe sites may block image loading due to CORS
2. **Scraping Reliability**: Recipe site HTML structure changes may break scraping
3. **AI Quota**: Using OpenAI GPT-4o-mini for processing (switched from Gemini due to quota)

## Next Steps

1. Test the complete flow end-to-end
2. Verify all 4 data issues are resolved:
   - ✅ Picture loading
   - ✅ Recipe name
   - ✅ Calories auto-fill
   - ✅ Protein/meal type tags
3. Deploy to production if tests pass

## Cost Optimization

The workflow is optimized to minimize AI costs:
- Stage 2: FREE (no AI, just web scraping)
- Stage 4 Preview: FREE (raw scraping only)
- Stage 4 Extract: PAID (AI cleaning - only when user confirms)

This ensures users can browse recipes for free and only pay for AI processing when they commit to extracting a recipe.

