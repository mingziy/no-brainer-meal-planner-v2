# Bilingual Recipe Feature 🌏

## Overview
This feature automatically creates **bilingual recipes** (English + Chinese) when importing recipes from URLs. This is a **major selling point** that allows Chinese-speaking users to build a database of US/Western recipes with Chinese translations!

## How It Works

### 1. **URL Import Triggers Bilingual Parsing**
When a user imports a recipe from a URL:
- The recipe text is extracted from the webpage
- Gemini AI parses the recipe into English structured data
- Gemini AI AUTOMATICALLY translates the recipe into Chinese (简体中文)
- Both versions are saved to Firebase

### 2. **What Gets Translated**
- ✅ **Recipe Name** (`nameZh`)
- ✅ **Ingredient Names** (`ingredientsZh`) - keeps amounts/units, translates names
- ✅ **Instructions** (`instructionsZh`)

### 3. **Smart Display**
The app automatically shows the correct version based on user's language:
- **English Mode**: Shows original English recipe
- **Chinese Mode (中文)**: Shows Chinese translated version
- **Seamless switching** via Language Switcher button

### 4. **Fallback Handling**
- If Chinese translation fails → saves English version only
- If recipe doesn't have Chinese version → shows English version
- No API key → skips translation, saves English only

## Files Modified

### Data Model
- `src/types/index.ts` - Added `nameZh`, `ingredientsZh`, `instructionsZh` fields

### AI Parsing
- `src/utils/geminiRecipeParser.ts` - New `parseRecipeWithBilingualSupport()` function

### Import Flow
- `src/components/recipe/AddRecipeModal.tsx` - Uses bilingual parser for URL imports
- `src/components/recipe/RecipeEditForm.tsx` - Saves both language versions to Firebase

### Display
- `src/components/recipe/RecipeDetailsModal.tsx` - Shows correct language version
- `src/components/recipe/RecipeLibraryScreen.tsx` - Recipe cards show Chinese names

## Usage Example

### Import from URL:
1. User clicks "Import from URL"
2. Pastes: `https://www.foodnetwork.com/recipes/...`
3. App extracts recipe text
4. Gemini generates:
   - **English**: "Classic Mac and Cheese"
   - **Chinese**: "经典芝士通心粉"
5. Both saved to database!

### Language Switching:
- Click language button (EN/中文)
- All recipes instantly show in selected language
- Chinese names, ingredients, and instructions appear

## Benefits

### For Users:
- 🇨🇳 **Chinese speakers** can access US recipes in their language
- 🇺🇸 **English speakers** get original authentic recipes
- 👨‍🍳 **Bilingual users** can switch between languages
- 📚 Learn cooking terms in both languages

### For Product:
- 🎯 **Unique selling point** - no other meal planner does this
- 🌐 **Global appeal** - serves both markets
- 🤖 **AI-powered** - automatic translation at import time
- 💾 **Persistent** - translations saved in database, not generated on-the-fly

## Technical Details

### Database Schema
```typescript
interface Recipe {
  // English (original)
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  
  // Chinese (translations)
  nameZh?: string;
  ingredientsZh?: Ingredient[];  // Only ingredient.name is translated
  instructionsZh?: string[];
  
  // ... other fields
}
```

### Gemini Prompt Strategy
1. **First call**: Parse English recipe structure
2. **Second call**: Translate specific fields to Chinese
3. **Merge**: Combine both into single recipe object

### Performance
- ~2-3 seconds for bilingual parsing (2 Gemini API calls)
- Only happens during URL import
- Manual text paste = English only (faster)
- Image upload = English only (faster)

## Future Enhancements
- [ ] Support more languages (Spanish, Korean, Japanese)
- [ ] Manual translation option for manually added recipes
- [ ] Show "Has Chinese version" badge on recipe cards
- [ ] Allow editing Chinese version separately
- [ ] Translate cuisine and category names

## Testing Checklist
- [x] Import US recipe from URL → Both languages saved
- [x] Switch language → Recipe name changes
- [x] View recipe details in Chinese → Ingredients translated
- [x] View recipe details in Chinese → Instructions translated
- [x] Recipe cards show Chinese names
- [x] Firebase stores both versions
- [x] Edit recipe preserves both versions
- [x] No crashes when Chinese version missing

---

**This feature positions the app as a bridge between culinary cultures! 🌉🍜**

