# Recipe Card Language Display Fix

## Problem
Recipe cards were always showing the original language, even after translating the recipe in the modal.

## Solution
Implemented a **preferred display language** system that remembers which version (original or translated) the user last viewed.

---

## Changes Made

### 1. Database Schema Update (`src/types/index.ts`)

Added new field to Recipe interface:

```typescript
preferredDisplayLanguage?: 'original' | 'translated'; // User's preferred display version
```

This field tracks which version the user last viewed in the modal.

---

### 2. RecipeDetailsModal Updates (`src/components/recipe/RecipeDetailsModal.tsx`)

#### A. Save Preference on Modal Close

```typescript
const handleClose = async () => {
  if (displayRecipe && displayRecipe.id) {
    try {
      // Save which version user was viewing
      await updateDoc(recipeRef, {
        preferredDisplayLanguage: showingTranslated ? 'translated' : 'original'
      });
    } catch (error) {
      console.error('❌ Failed to save preferred display language:', error);
    }
  }
  // Close modal
};
```

#### B. Initialize View Based on Preference

```typescript
useEffect(() => {
  if (selectedRecipe) {
    setLocalRecipe(selectedRecipe);
    // Show translated if user's last preference was translated
    const hasTranslation = !!(selectedRecipe.nameTranslated && selectedRecipe.ingredientsTranslated);
    const shouldShowTranslated = hasTranslation && selectedRecipe.preferredDisplayLanguage === 'translated';
    setShowingTranslated(shouldShowTranslated);
  }
}, [selectedRecipe?.id]);
```

#### C. Save Preference When Translating

```typescript
// When user clicks "Translate", set preference to 'translated'
await updateDoc(recipeRef, {
  nameTranslated: translated.nameTranslated,
  // ... other fields
  preferredDisplayLanguage: 'translated', // User wants translated version
});
```

---

### 3. Recipe Card Display Updates

#### A. RecipeLibraryScreen (`src/components/recipe/RecipeLibraryScreen.tsx`)

```typescript
function RecipeCard({ recipe, onClick, onDelete, t, currentLanguage }: RecipeCardProps) {
  const getDisplayName = () => {
    // Show translated if user prefers it AND translation exists
    if (recipe.preferredDisplayLanguage === 'translated' && recipe.nameTranslated) {
      return recipe.nameTranslated;
    }
    // Otherwise show original
    return recipe.name;
  };
  
  const displayName = getDisplayName();
  // ... render card with displayName
}
```

#### B. HomeScreen (`src/components/home/HomeScreen.tsx`)

Created helper function:

```typescript
const getRecipeDisplayName = (recipe: Recipe): string => {
  if (recipe.preferredDisplayLanguage === 'translated' && recipe.nameTranslated) {
    return recipe.nameTranslated;
  }
  return recipe.name;
};
```

Updated all recipe card displays to use `getRecipeDisplayName(recipe)` instead of `recipe.name`.

---

## How It Works

### User Flow:

```
1. User has English recipe "Chicken Stir Fry"
   → Card shows: "Chicken Stir Fry"
   → preferredDisplayLanguage: undefined (or 'original')

2. User clicks card → Opens modal
   → Shows: "Chicken Stir Fry" (English)
   
3. User clicks "Translate"
   → Modal translates to: "鸡肉炒菜"
   → Saves to Firestore: preferredDisplayLanguage = 'translated'
   
4. User closes modal
   → Card now shows: "鸡肉炒菜" ✅
   → preferredDisplayLanguage: 'translated'

5. Next time user opens app
   → Card shows: "鸡肉炒菜" (remembered preference)
   → Modal opens with: "鸡肉炒菜" + "Show Original" button

6. User clicks "Show Original"
   → Modal switches to: "Chicken Stir Fry"
   
7. User closes modal
   → Saves: preferredDisplayLanguage = 'original'
   → Card now shows: "Chicken Stir Fry" ✅
```

---

## Technical Details

### State Management

1. **Modal Level**: `showingTranslated` state tracks current view in modal
2. **Database Level**: `preferredDisplayLanguage` persists preference
3. **Display Level**: Recipe cards read `preferredDisplayLanguage` to decide which name to show

### Data Flow

```
User Action          Modal State              Firestore                Recipe Card Display
-----------          -----------              ---------                -------------------
Open modal      →    Set showingTranslated    Read preferredDisplay    Shows saved preference
                     based on saved pref      from database            
                     
Click Translate →    showingTranslated=true   preferredDisplay=        Shows translated name
                                              'translated'              
                     
Close modal     →    Save current state       Update preferredDisplay  Card refreshes
                     to Firestore             field                    
                     
Click Show Orig →    showingTranslated=false  (not saved yet)          (no change yet)

Close modal     →    Save current state       preferredDisplay=        Card shows original
                     to Firestore             'original'               
```

---

## Benefits

✅ **Persistent Preference**: User's language choice is remembered across sessions
✅ **Per-Recipe Basis**: Each recipe can have its own preferred display language
✅ **Seamless UX**: Card display always matches what user last viewed
✅ **Independent of UI Language**: Works regardless of system language setting
✅ **Backwards Compatible**: Old recipes without this field default to original

---

## Database Impact

- **New Field**: `preferredDisplayLanguage?: 'original' | 'translated'`
- **Storage**: Minimal (2 possible string values)
- **Updates**: Only when user closes modal (not on every translate)
- **Default**: `undefined` treated as `'original'`

---

## Testing Scenarios

### Scenario 1: First Translation
- Open English recipe → Shows English
- Translate to Chinese → Shows Chinese in modal
- Close modal → **Card now shows Chinese** ✅

### Scenario 2: Toggle Back
- Open same recipe → Shows Chinese (remembered)
- Click "Show Original" → Shows English in modal
- Close modal → **Card now shows English** ✅

### Scenario 3: Mixed Recipes
- Recipe A: Last viewed in Chinese → Card shows Chinese
- Recipe B: Last viewed in English → Card shows English
- Recipe C: Never translated → Card shows original language

### Scenario 4: New Recipe
- Save new English recipe
- Card shows English (no preference set)
- Translate it
- Card shows Chinese (preference = 'translated')

---

## Related Files

- `/src/types/index.ts` - Recipe type definition
- `/src/components/recipe/RecipeDetailsModal.tsx` - Modal logic
- `/src/components/recipe/RecipeLibraryScreen.tsx` - Recipe card display
- `/src/components/home/HomeScreen.tsx` - Home screen recipe display

---

**Status**: ✅ Implemented and Working
**Last Updated**: November 9, 2025





