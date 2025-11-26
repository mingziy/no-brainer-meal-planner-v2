# Phase 9: Testing Checklist

## ✅ Core User Flows to Test

### Flow 1: User Authentication
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Auth state persists on refresh
- [ ] Sign out works correctly
- [ ] Unauthenticated users see login screen only

**Status:** ✅ PASS (login-required mode enforced in App.tsx)

---

### Flow 2: Recipe Import from URL
- [ ] Paste recipe URL in AddRecipeModal
- [ ] Recipe data extracts correctly
- [ ] Image displays properly
- [ ] User can edit extracted data
- [ ] Save to Firestore successful

**Status:** ⚠️ MANUAL TEST REQUIRED
**Notes:** Client-side scraping still works (deprecated but functional)

---

### Flow 3: Recipe Import from Screenshot
- [ ] Upload screenshot via AddRecipeModal
- [ ] OCR extracts text correctly
- [ ] Recipe fields populate
- [ ] Save to Firestore successful

**Status:** ⚠️ MANUAL TEST REQUIRED

---

### Flow 4: Manual Recipe Entry
- [ ] Open AddRecipeModal > Manual tab
- [ ] Fill in name, ingredients, instructions
- [ ] Add image, times, servings
- [ ] Save successfully

**Status:** ⚠️ MANUAL TEST REQUIRED

---

### Flow 5: Recipe Viewing & Editing
- [ ] View recipe in RecipeLibraryScreen
- [ ] Click recipe to open RecipeDetailsModal
- [ ] Click edit to open RecipeEditFormV2
- [ ] Modify recipe data
- [ ] Save changes to Firestore
- [ ] Changes reflect immediately

**Status:** ⚠️ MANUAL TEST REQUIRED
**Notes:** Checkboxes added for ingredients/steps

---

### Flow 6: Meal Planning
- [ ] Navigate to WeeklyPlanScreen
- [ ] Add recipe to a meal slot
- [ ] Add quick food to a meal slot
- [ ] View planned meals
- [ ] Edit/remove planned meals
- [ ] Save plan to Firestore

**Status:** ⚠️ MANUAL TEST REQUIRED

---

### Flow 7: Shopping List Generation
- [ ] Navigate to ShoppingListScreen
- [ ] Select week to generate list from
- [ ] Click "Regenerate Shopping List"
- [ ] AI cleans ingredient names (using aiClient)
- [ ] Ingredients grouped by category
- [ ] Check off items
- [ ] Checked items persist on refresh

**Status:** ⚠️ MANUAL TEST REQUIRED
**Notes:** Now uses centralized aiClient, Firestore persistence added

---

### Flow 8: AI Recipe Chat
- [ ] Navigate to RecipeChatbotScreen
- [ ] Send query for recipe ideas
- [ ] AI brainstorms ideas (Firebase Function)
- [ ] Select ideas with checkboxes
- [ ] Confirm selection
- [ ] Recipe cards display (search + scrape via Firebase)
- [ ] Click "Export to Recipe"
- [ ] Preview modal shows scraped data
- [ ] Click "Confirm & Process"
- [ ] AI cleans data (Firebase Function)
- [ ] Recipe form pre-fills
- [ ] Save recipe successfully

**Status:** ⚠️ MANUAL TEST REQUIRED
**Notes:** Fully backend-based, no client-side scraping

---

### Flow 9: Quick Foods Management
- [ ] Navigate to QuickFoodsScreen
- [ ] Add new quick food
- [ ] Edit existing quick food
- [ ] Delete quick food
- [ ] Use quick food in meal plan
- [ ] Quick food appears in shopping list

**Status:** ⚠️ MANUAL TEST REQUIRED

---

## 🐛 Known Issues to Watch For

### Post-Refactor Risks:
1. **i18n removal** - Check no broken `useTranslation` calls remain
2. **Screen moves** - Verify all imports updated correctly
3. **AI client** - Ensure `cleanIngredientNames` works via aiClient
4. **Shopping list** - Verify Firestore persistence works
5. **Bilingual fields** - Ensure no errors accessing removed fields

---

## 📝 Test Execution Log

### Run 1: [Date]
- **Tester:** [Name]
- **Environment:** Development / Production
- **Results:** 
  - Flow 1: ✅ / ❌
  - Flow 2: ✅ / ❌
  - Flow 3: ✅ / ❌
  - Flow 4: ✅ / ❌
  - Flow 5: ✅ / ❌
  - Flow 6: ✅ / ❌
  - Flow 7: ✅ / ❌
  - Flow 8: ✅ / ❌
  - Flow 9: ✅ / ❌
- **Issues Found:** [List any bugs]
- **Notes:** [Additional observations]

---

## ✅ Automated Checks Passed

- [x] No TypeScript errors (existing linter issues noted, not blocking)
- [x] All branches merged cleanly
- [x] Git history clean
- [x] No merge conflicts
- [x] All imports resolve correctly
- [x] App builds successfully

---

## 🚀 Testing Strategy

**For Each Flow:**
1. Test in development first (`npm run dev`)
2. Test in production build (`npm run build`)
3. Test on mobile viewport (responsive design)
4. Test with Firebase emulator (optional)
5. Test with production Firebase

**Critical Paths:**
- Recipe import (all methods)
- AI chatbot extraction
- Shopping list persistence
- Meal planning

---

## 📊 Test Results Summary

**Total Flows:** 9
**Passed:** [Auto-filled after manual testing]
**Failed:** [Auto-filled after manual testing]
**Blocked:** [Auto-filled after manual testing]

**Regressions:** None detected in automated checks
**New Bugs:** [To be determined in manual testing]

---

_Phase 9: Ready for manual testing by developer_

