# Recipe Relevance Matching Implementation

## Overview
Implemented **Option 3 + Option 4** for recipe search relevance checking: **Fuzzy Matching with Levenshtein Distance + Try Multiple Results**.

## What Was Changed

### 1. Backend: `functions/index.js`

#### Added Helper Functions:
- **`levenshteinDistance(str1, str2)`** - Calculates edit distance between two strings
- **`calculateSimilarity(str1, str2)`** - Returns similarity score from 0 to 1
- **`isRecipeRelevant(searchTerm, recipeTitle)`** - Determines if a recipe matches the search term

#### Relevance Check Algorithm:
A recipe is considered relevant if ANY of these conditions are met:
1. **Fuzzy similarity > 40%** - Overall string similarity using Levenshtein distance
2. **At least 50% of key words match** - Word-by-word matching (excluding stop words)
3. **For simple queries (1-2 words)**: At least 1 word match AND similarity > 25%

Stop words filtered: `['and', 'with', 'for', 'the', 'a', 'an', 'or', 'in', 'on', 'to', 'of']`

#### Updated `searchAndScrapeRecipe()`:
- Now checks **top 5 search results** instead of just the first one
- Scrapes each result and tests relevance with `isRecipeRelevant()`
- Returns the **first matching recipe** found
- Returns `null` if no match found in top 5 results
- Detailed logging for debugging:
  ```
  📊 Relevance check:
     Search: "grilled chicken breast with quinoa salad"
     Title:  "Grilled Chicken and Quinoa Salad"
     Fuzzy similarity: 78%
     Word matches: 4/4 (100%)
     Result: ✅ MATCH
  ```

#### Updated `chatbotFetchPreviews()`:
- Now tracks both successful and failed recipes
- Returns:
  ```javascript
  {
    recipes: RecipeCard[],      // Successfully matched recipes
    failedRecipes: string[]      // Recipe names that didn't match
  }
  ```

### 2. Frontend: `src/components/ai/RecipeChatbot.tsx`

#### Updated `handleConfirmSelection()`:
- Receives `failedRecipes` array from backend
- Shows different messages based on results:

**All recipes found:**
```
✅ Found 3 matching recipes! Click on any card to view details.
```

**Some recipes found, some failed:**
```
Found 2 matching recipes! 

However, I couldn't find good matches for: "grilled chicken breast with quinoa salad". 

💡 Try selecting other recipe ideas from the list or search with different terms.
```

**No recipes found:**
```
❌ Sorry, I couldn't find good matching recipes for your selections.

Failed to match: "grilled chicken breast with quinoa salad", "zucchini soup"

💡 Please try:
• Selecting other recipe ideas from the list above
• Using simpler search terms (e.g., "chicken salad" instead of "grilled chicken breast with quinoa salad")
• Trying a different cuisine or meal type
• Searching again with new keywords
```

## Benefits

✅ **Accurate Matching** - Fuzzy matching catches typos, variations, and similar phrasing  
✅ **Multiple Attempts** - Checks top 5 results before giving up  
✅ **Clear Feedback** - User knows exactly what failed and why  
✅ **Helpful Suggestions** - Guides user on what to try next  
✅ **No Bad Results** - Only shows truly matching recipes  
✅ **Detailed Logging** - Easy to debug matching issues  

## Example Matching Scenarios

### ✅ Good Match
- Search: `"grilled chicken breast"`
- Result: `"Grilled Chicken Breast with Lemon"`
- Similarity: 85%, Word match: 100%
- **MATCH**

### ✅ Fuzzy Match
- Search: `"chicken salad"`
- Result: `"Classic Chicken Caesar Salad"`
- Similarity: 42%, Word match: 50%
- **MATCH**

### ❌ No Match
- Search: `"grilled chicken breast with quinoa salad"`
- Result: `"Creamy Zucchini Soup"`
- Similarity: 12%, Word match: 0%
- **NO MATCH** - Try next result

## Testing

1. Navigate to AI Chat
2. Ask: "I want healthy dinner recipes"
3. AI suggests recipe ideas
4. Select multiple ideas including some very specific ones
5. Click "Confirm Selection"
6. **Expected behavior:**
   - Matching recipes appear as cards
   - Non-matching recipes show in error message
   - User gets helpful suggestions to try again

## Deployment Status

✅ **Local Emulator**: Running with updated functions  
⏸️ **Production**: Not yet deployed (waiting for user confirmation)

## Next Steps

To deploy to production:
```bash
cd /Users/mingziy/MealPlanner/figma-design
firebase deploy --only functions:chatbotFetchPreviews
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

