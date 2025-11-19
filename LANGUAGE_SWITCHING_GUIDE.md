# Language Switching - Quick Fix Guide

## Current Status ✅

**Good News**: The language system is fully functional! The infrastructure works perfectly.

**The Issue**: Most UI screens still have hardcoded English text instead of using translation keys.

---

## What's Already Working 🎉

When you switch to Chinese, these components **will change**:

1. ✅ **Bottom Navigation** (just updated)
   - Home → 首页
   - Recipes → 食谱
   - Quick Foods → 快速添加
   - Shopping → 购物

2. ✅ **Recipe Library Screen**
   - Search placeholder
   - Category names
   - "No recipes found" message
   - Delete confirmations

3. ✅ **Recipe Details Modal**
   - Edit button
   - Nutrition labels (Protein, Carbs, Fat, etc.)
   - Ingredient/instruction headers
   - Translate button text

4. ✅ **Language Switcher Button**
   - Shows "中文" when in English mode
   - Shows "EN" when in Chinese mode

---

## What Still Needs Translation 📝

These screens have hardcoded English that needs to be replaced:

### Priority 1 (Most Visible)
- ❌ **HomeScreen** - Main dashboard, greetings
- ❌ **ShoppingListScreen** - Headers, buttons (partially done)
- ❌ **TodayScreen** - Today's meals view
- ❌ **ProfileScreen** - User profile, settings

### Priority 2 (Secondary)
- ❌ **AddRecipeModal** - "From URL", "Recipe Screenshot", "Manual Type"
- ❌ **PlanSetupScreen** - Meal planning wizard
- ❌ **WeeklyReviewScreen** - Weekly plan review
- ❌ **PrepHubScreen** - Prep tasks

### Priority 3 (Onboarding)
- ❌ **WelcomeScreen** - Welcome message
- ❌ **SplashScreen** - Loading screen
- ❌ **DietaryPreferencesScreen** - Dietary setup
- ❌ **CookingStyleScreen** - Cooking preferences

---

## How to Test Language Switching NOW

1. **Open the app**
2. **Click the "中文" button** in the top-right (usually near user profile)
3. **Check these areas** - they SHOULD change to Chinese:
   - Bottom navigation tabs
   - Recipe library screen (if you navigate there)
   - Recipe details modal (if you open a recipe)

4. **These will NOT change yet** (still English):
   - Home screen main content
   - Shopping list headers
   - Profile screen
   - Most buttons and labels

---

## Quick Fix: Update One Screen as Example

Let me show you how to update **QuickFoodsScreen** header as an example:

### Before (Hardcoded):
```typescript
<h1>Quick Foods</h1>
<p>Add grab-and-go items to supplement your meals</p>
```

### After (Translated):
```typescript
import { useTranslation } from 'react-i18next';

function QuickFoodsScreen() {
  const { t } = useTranslation('navigation');
  
  return (
    <>
      <h1>{t('tabs.quickFoods')}</h1>
      <p className="text-muted-foreground">
        {t('sections.quickAdd')}
      </p>
    </>
  );
}
```

---

## Full Translation Pattern

### Step 1: Add translation hook
```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('common'); // or 'navigation', 'recipe', etc.
  // ... rest of component
}
```

### Step 2: Replace hardcoded strings
```typescript
// OLD
<Button>Add</Button>
<h1>My Title</h1>

// NEW
<Button>{t('buttons.add')}</Button>
<h1>{t('mySection.title')}</h1>
```

### Step 3: Choose correct namespace
- `'common'` - buttons, messages, time, units
- `'navigation'` - tabs, menus, greetings
- `'recipe'` - recipe-specific UI
- `'shopping'` - shopping list UI
- `'onboarding'` - welcome screens

---

## Available Translation Keys

### Common Buttons (`'common'` namespace)
```typescript
t('buttons.add')        // "Add" / "添加"
t('buttons.save')       // "Save" / "保存"
t('buttons.cancel')     // "Cancel" / "取消"
t('buttons.delete')     // "Delete" / "删除"
t('buttons.edit')       // "Edit" / "编辑"
t('buttons.search')     // "Search" / "搜索"
```

### Navigation (`'navigation'` namespace)
```typescript
t('tabs.home')          // "Home" / "首页"
t('tabs.recipes')       // "Recipes" / "食谱"
t('tabs.shopping')      // "Shopping" / "购物"
t('greetings.goodMorning')  // "Good Morning" / "早上好"
```

### Recipe UI (`'recipe'` namespace)
```typescript
t('library.title')              // "My Recipe Box" / "我的食谱库"
t('details.ingredients')        // "Ingredients" / "食材"
t('details.instructions')       // "Instructions" / "步骤"
t('details.translateButton')    // "Translate" / "翻译"
```

---

## Why This Approach?

**Gradual Migration**: You can update screens one at a time without breaking anything.

**Already Working**: The infrastructure is 100% ready. Just need to replace strings.

**Proof of Concept**: BottomNav now switches to Chinese when you toggle language.

---

## Next Steps

### Option A: Update All Screens (Complete Solution)
Go through each screen file and replace hardcoded strings with `t()` calls.
- Time: 2-3 hours
- Result: Full bilingual app

### Option B: Update Key Screens Only (Quick Win)
Focus on the most visible screens:
1. HomeScreen - main dashboard
2. ShoppingListScreen - shopping list header
3. AddRecipeModal - recipe entry options

- Time: 30 minutes
- Result: Most important UI translated

### Option C: Test What Works Now (Immediate)
1. Switch to Chinese using the switcher button
2. Navigate to Recipe Library
3. Open a recipe
4. See the translation in action

---

## Verification

After updating a screen, you can verify it works:

1. **Switch to Chinese** (click "中文" button)
2. **Navigate to the updated screen**
3. **Text should change to Chinese**
4. **Switch back to English** (click "EN" button)
5. **Text should revert to English**

---

## Summary

✅ **Language System**: 100% functional
✅ **Translation Files**: Complete with 150+ keys
✅ **AI Functions**: All working (translation, detection)
✅ **BottomNav**: Now switches to Chinese
✅ **RecipeLibrary**: Already switches to Chinese
✅ **RecipeDetails**: Already switches to Chinese

❌ **Remaining Work**: Replace hardcoded strings in other screens

**The system works!** You just need to apply the `t()` pattern to the remaining screens.

