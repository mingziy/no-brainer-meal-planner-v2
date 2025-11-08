# Language System Design & Implementation Plan

## Overview
This document outlines the comprehensive language setting system for the Meal Planner app, supporting both English and Chinese across UI elements, recipe content, quick foods, and shopping lists.

---

## User Workflows

### 1. First-Time User Experience
- Upon first login, user is prompted: "What language do you prefer?"
- Options: English | Chinese (中文)
- Selection saves to `UserPreferences` collection
- System UI immediately switches to chosen language

### 2. System Language Scope
**Applies to:**
- All UI elements: headers, buttons, labels, messages
- Navigation: tabs, menu items, greetings
- All component text across the entire app
- Sidebars and modals

**Does NOT apply to:**
- Recipe content (name, ingredients, instructions)
- Quick food content (food names)

### 3. Recipe Language Handling
**Original Storage:**
- AI detects recipe's original language during extraction
- Recipe stored in its original language only (no auto-translation)
- Language code saved: `originalLanguage: 'en' | 'zh'`

**On-Demand Translation:**
- "Translate" button appears on recipe view page
- Clicking triggers AI translation to the other language
- Loading indicator shown during translation
- Translated version saved to database fields:
  - `nameTranslated`
  - `ingredientsTranslated`
  - `instructionsTranslated`
- Page refreshes to show translated version
- "Show Original" button toggles back to original language

### 4. Quick Food Language Handling
- AI detects input language when user types food name
- Content displayed in detected original language
- No automatic translation
- Language code saved for each quick food item

### 5. Shopping List Language Handling
**Default Display:**
- All items shown in their original languages
- Mixed languages allowed (English + Chinese items)

**Unified Translation:**
- "Translate" button at top of shopping list
- User can switch entire list to English or Chinese
- Loading indicator during translation
- All items unified to selected language
- Page refreshes to show translated list

### 6. Cross-Language Search
**Search Scope:**
- All search bars search across both original AND translated content
- Recipe search: searches both original and translated names, ingredients, instructions
- Shopping list search: searches both original and translated item names
- Quick food search: searches across all language inputs

**Search Behavior:**
- User types in English → finds matches in English AND Chinese content
- User types in Chinese → finds matches in Chinese AND English content
- Search is language-agnostic and bidirectional
- Results display in current language preference when available

---

## Database Schema Design

### 1. Recipe Type Extension
```typescript
interface Recipe {
  // Existing fields...
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  sourceUrl?: string;
  
  // NEW Language fields
  originalLanguage: 'en' | 'zh';           // Detected during extraction
  nameTranslated?: string;                  // Translated version
  ingredientsTranslated?: string[];         // Translated version
  instructionsTranslated?: string[];        // Translated version
  translatedTo?: 'en' | 'zh';              // Target language of translation
  lastTranslated?: Date;                    // Timestamp of last translation
}
```

### 2. QuickFood Type Extension
```typescript
interface QuickFood {
  // Existing fields...
  id: string;
  name: string;
  calories: number;
  date: string;
  
  // NEW Language field
  originalLanguage: 'en' | 'zh';           // Detected from user input
}
```

### 3. ShoppingList Type Extension
```typescript
interface ShoppingListItem {
  // Existing fields...
  id: string;
  name: string;
  checked: boolean;
  
  // NEW Language fields
  originalLanguage: 'en' | 'zh';           // Original language
  translatedName?: string;                  // Translated version
}

interface ShoppingList {
  // Existing fields...
  items: ShoppingListItem[];
  
  // NEW Language field
  displayLanguage?: 'en' | 'zh' | 'original';  // Current display preference
}
```

### 4. UserPreferences Collection (NEW)
```typescript
interface UserPreferences {
  userId: string;                           // Firebase Auth UID
  systemLanguage: 'en' | 'zh';             // UI language preference
  createdAt: Date;
  updatedAt: Date;
}
```

---

## AI Prompt Designs

### 1. Recipe Extraction Prompt (Modified)
```
Your task: Extract recipe and detect its original language.

CRITICAL RULES:
1. Detect the recipe language: 'en' (English) or 'zh' (Chinese/中文)
2. Extract ALL content in the ORIGINAL language ONLY
3. DO NOT translate anything
4. DO NOT provide bilingual content

Return JSON in this exact format:
{
  "originalLanguage": "en" or "zh",
  "name": "Recipe name in original language",
  "ingredients": ["ingredient 1 in original", "ingredient 2 in original", ...],
  "instructions": ["step 1 in original", "step 2 in original", ...],
  "servings": number,
  "prepTime": number,
  "cookTime": number,
  "category": "category in original language",
  "mealType": ["type in original language"]
}

IMPORTANT: Keep everything in the detected original language!
```

### 2. Recipe Translation Prompt (NEW)
```
Your task: Translate this recipe from {sourceLanguage} to {targetLanguage}.

Source Recipe:
- Name: {recipeName}
- Ingredients: {ingredients}
- Instructions: {instructions}
- Category: {category}
- Meal Type: {mealType}

Translation Rules:
1. Translate ALL fields accurately to {targetLanguage}
2. Keep cooking terminology precise and culturally appropriate
3. Convert units if culturally appropriate (e.g., cups vs. ml)
4. Maintain ingredient specificity (don't generalize)
5. Keep cooking technique names accurate

Return JSON:
{
  "nameTranslated": "translated recipe name",
  "ingredientsTranslated": ["translated ingredient 1", "translated ingredient 2", ...],
  "instructionsTranslated": ["translated step 1", "translated step 2", ...],
  "categoryTranslated": "translated category",
  "mealTypeTranslated": ["translated meal type"]
}
```

### 3. Quick Food Language Detection Prompt (NEW)
```
Your task: Detect the language of this food name and extract it as-is.

User Input: "{foodName}"

Detection Rules:
1. Detect if the input is English ('en') or Chinese ('zh')
2. Return the food name EXACTLY as entered (no translation)
3. If mixed language, detect the dominant language

Return JSON:
{
  "originalLanguage": "en" or "zh",
  "name": "{foodName}"  // Keep as-is, no translation
}
```

### 4. Shopping List Translation Prompt (NEW)
```
Your task: Translate ALL these grocery items to {targetLanguage}.

Items to translate: {itemsList}

Translation Rules:
1. Detect each item's current language
2. Translate ALL items to {targetLanguage}
3. Use grocery-appropriate terminology
4. Keep items in singular form when appropriate
5. Maintain ingredient specificity

Return JSON array:
[
  {
    "original": "original item name",
    "translated": "translated item name",
    "originalLanguage": "en" or "zh"
  },
  ...
]

Example:
Input: ["鸡蛋", "Milk", "面包", "Tomatoes"]
Target: English
Output: [
  {"original": "鸡蛋", "translated": "Eggs", "originalLanguage": "zh"},
  {"original": "Milk", "translated": "Milk", "originalLanguage": "en"},
  {"original": "面包", "translated": "Bread", "originalLanguage": "zh"},
  {"original": "Tomatoes", "translated": "Tomatoes", "originalLanguage": "en"}
]
```

---

## System Language Files Structure

### File Organization
```
/src/locales/
  /en/
    - common.json          # Buttons, messages, time strings
    - navigation.json      # Tabs, greetings, menu items
    - recipe.json          # Recipe-specific UI strings
    - shopping.json        # Shopping list and prep hub strings
    - onboarding.json      # Welcome and onboarding screens
    - profile.json         # Profile and settings strings
  /zh/
    - common.json
    - navigation.json
    - recipe.json
    - shopping.json
    - onboarding.json
    - profile.json
```

### Key Translation Categories

#### common.json
- Buttons: Add, Save, Cancel, Delete, Edit, Confirm, Back, Next, Done, Close
- Actions: Upload, Download, Share, Copy, Paste, Search
- Messages: Success, Error, Warning, Loading, No data
- Time: Today, Tomorrow, Yesterday, Week, Month, Year
- Units: servings, minutes, hours, calories, protein, carbs, fat

#### navigation.json
- Tabs: Home, Recipes, Shopping, Today, Profile
- Greetings: Good morning, Good afternoon, Good evening
- Menu: Settings, Log out, Help, About

#### recipe.json
- Headers: Recipe Library, Recipe Details, Add Recipe
- Actions: Translate, Show Original, Add to Plan, Remove from Plan
- Labels: Ingredients, Instructions, Prep Time, Cook Time, Servings, Category
- Categories: Breakfast, Lunch, Dinner, Snack, Dessert
- States: Original Language, Translated, Translating...

#### shopping.json
- Headers: Shopping List, Prep Hub
- Actions: Translate List, Add Item, Check Off, Uncheck
- Labels: Ingredient, Quantity, Store Section
- States: Shopping Mode, Prep Mode

#### onboarding.json
- Welcome: App title, tagline, Get Started
- Language Selection: Choose your language, Continue
- Dietary Preferences: Select preferences, Skip
- Cooking Style: Beginner, Intermediate, Advanced

---

## Implementation Todo List

### Phase 1: Database & Backend (Priority: High)
- [ ] **Task 1**: Update database schema
  - Add language fields to Recipe type
  - Add language field to QuickFood type
  - Update ShoppingList type with translation fields
  - Create UserPreferences collection

- [ ] **Task 2**: Modify AI prompts in geminiRecipeParser.ts
  - Update recipe extraction prompt to detect original language
  - Remove auto-translation from extraction

- [ ] **Task 3**: Create AI translation function
  - Implement recipe translation prompt
  - Add function to call Gemini API for translation
  - Handle loading states and errors

- [ ] **Task 4**: Create AI language detection function
  - Implement quick food language detection prompt
  - Add function for input language detection

- [ ] **Task 5**: Create AI shopping list translation function
  - Implement shopping list translation prompt
  - Add batch translation functionality

### Phase 2: System Language Files (Priority: High)
- [ ] **Task 6**: Prepare en/common.json and zh/common.json
  - Audit all buttons, messages, time strings
  - Create comprehensive translation pairs

- [ ] **Task 7**: Prepare en/navigation.json and zh/navigation.json
  - Audit all tabs, greetings, navigation strings
  - Create translation pairs

- [ ] **Task 8**: Prepare en/recipe.json and zh/recipe.json
  - Audit all recipe-specific UI strings
  - Include translation button labels
  - Add category and meal type translations

- [ ] **Task 9**: Prepare en/shopping.json and zh/shopping.json
  - Audit shopping list and prep hub strings
  - Create translation pairs

- [ ] **Task 10**: Prepare en/onboarding.json and zh/onboarding.json
  - Audit welcome and onboarding screens
  - Create translation pairs

### Phase 3: Feature Implementation (Priority: Medium)
- [ ] **Task 11**: Implement first-time user language selection
  - Create language selection screen
  - Show on first login only
  - Save selection to UserPreferences
  - Integrate with AppContext

- [ ] **Task 12**: Update RecipeDetailsModal
  - Add Translate button to header
  - Implement translation loading state
  - Add toggle between original/translated
  - Show "Show Original" button when translated
  - Trigger page refresh after translation

- [ ] **Task 13**: Update quick food functionality
  - Integrate AI language detection on input
  - Store detected language with quick food
  - Display content in original language

- [ ] **Task 14**: Update ShoppingListScreen
  - Add Translate button at top
  - Implement language selection (English/Chinese)
  - Show loading state during translation
  - Update all items with translated names
  - Refresh display after translation

- [ ] **Task 15**: Implement cross-language search functionality
  - Update recipe search to query both original and translated fields
  - Update shopping list search to query both original and translated names
  - Update quick food search to search across all languages
  - Ensure search is bidirectional (EN↔ZH)
  - Display results in user's current language preference

- [ ] **Task 16**: Apply i18n to all components
  - Replace hardcoded strings with translation keys
  - Update all headers, buttons, labels
  - Update sidebars and navigation
  - Ensure all UI text is translatable

### Phase 4: Testing & Refinement (Priority: Low)
- [ ] **Task 17**: End-to-end testing
  - Test language switching flow
  - Test recipe extraction in both languages
  - Test recipe translation (EN→ZH, ZH→EN)
  - Test quick food detection
  - Test shopping list translation
  - Test mixed-language shopping lists
  - Test cross-language search in all search bars
  - Test first-time user experience
  - Mobile responsiveness testing

---

## Technical Considerations

### 1. Context & State Management
- Store `systemLanguage` in AppContext
- Load UserPreferences on app initialization
- Provide language context to all components

### 2. Translation Loading States
- Use loading spinners during AI translation
- Disable interaction during translation
- Show progress feedback to user

### 3. Error Handling
- Handle AI API failures gracefully
- Provide fallback to original content
- Show user-friendly error messages

### 4. Performance Optimization
- Cache translated recipes in database
- Avoid re-translating already translated content
- Check for existing translation before API call

### 5. Data Migration
- Existing recipes need `originalLanguage` detection
- Run one-time migration script for existing data
- Set default language based on content detection

### 6. Cross-Language Search Implementation
**Recipe Search:**
- Query both `name` and `nameTranslated` fields
- Query both `ingredients` and `ingredientsTranslated` arrays
- Query both `instructions` and `instructionsTranslated` arrays
- Use Firebase `where()` with array-contains for ingredient search
- Return results if match found in either language

**Shopping List Search:**
- Query both `name` and `translatedName` fields
- Filter items client-side for mixed-language lists

**Quick Food Search:**
- Query `name` field across all entries
- Language detection happens at input time, so search is already cross-language

**Implementation Example:**
```typescript
// Recipe search query
const searchRecipes = async (searchTerm: string) => {
  const recipesRef = collection(db, 'recipes');
  
  // Search in original fields
  const originalQuery = query(
    recipesRef,
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff')
  );
  
  // Search in translated fields
  const translatedQuery = query(
    recipesRef,
    where('nameTranslated', '>=', searchTerm),
    where('nameTranslated', '<=', searchTerm + '\uf8ff')
  );
  
  // Combine results and deduplicate
  const [originalResults, translatedResults] = await Promise.all([
    getDocs(originalQuery),
    getDocs(translatedQuery)
  ]);
  
  // Merge and deduplicate by ID
  const allResults = [...originalResults.docs, ...translatedResults.docs];
  const uniqueResults = Array.from(
    new Map(allResults.map(doc => [doc.id, doc])).values()
  );
  
  return uniqueResults;
};
```

---

## Future Enhancements (Out of Scope)

1. **Additional Languages**: Support for Spanish, Japanese, Korean, etc.
2. **Custom Translations**: Allow users to edit AI translations
3. **Offline Translation**: Cache translations for offline use
4. **Voice Input**: Support voice input with language detection
5. **Recipe Localization**: Adapt measurements and ingredients by region
6. **Collaborative Translation**: Allow community contributions

---

## Notes & Decisions

- **Language Detection Accuracy**: Rely on Gemini AI for high accuracy; fallback to 'en' if uncertain
- **Translation Cache**: Store translations in database to avoid repeated API calls
- **Mixed-Language UI**: System UI is always in one language; only content can be mixed
- **Default Language**: Default to English if UserPreferences not set (shouldn't happen after onboarding)
- **Translation Button Visibility**: Always show translate button, even if already translated (allows re-translation)

---

## Related Files

- Database Types: `/src/types/index.ts`
- AI Parser: `/src/utils/geminiRecipeParser.ts`
- App Context: `/src/context/AppContext.tsx`
- Recipe Details: `/src/components/recipe/RecipeDetailsModal.tsx`
- Shopping List: `/src/components/shopping/ShoppingListScreen.tsx`
- Locale Files: `/src/locales/en/` and `/src/locales/zh/`

---

**Last Updated**: November 8, 2025
**Status**: Design Phase Complete - Ready for Implementation

