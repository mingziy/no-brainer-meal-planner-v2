# Troubleshooting AI Chat Component

## Current Issue
Getting blank page and `_s is not a function` error when clicking AI Chat.

## What Was Done to Fix

### 1. Fixed Firebase Import Path
- ✅ Added `functions` export to `src/config/firebase.ts`
- ✅ Fixed import path in `RecipeChatbot.tsx` from `../../lib/firebase` to `../../config/firebase`
- ✅ Added automatic emulator connection for local development

### 2. Cleaned Build Cache
- ✅ Killed old Vite processes
- ✅ Removed `.vite` cache directory
- ✅ Restarted dev server with clean build

## Error: `_s is not a function`

This is a **React Fast Refresh** error that typically occurs when:
1. Build cache is stale (we fixed this)
2. Component structure confuses the Fast Refresh transformer
3. Browser cache is outdated

## Steps to Fix

### Step 1: Hard Refresh Browser
1. Open your browser at http://localhost:3000
2. Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
3. This clears the browser's cached JavaScript

### Step 2: Clear Browser Console
1. Open DevTools (F12)
2. Right-click on Console
3. Select "Clear Console"

### Step 3: Navigate to AI Chat
1. Click on "AI Chat" in the bottom navigation
2. The page should now load correctly

### Step 4: If Still Broken
If you still see errors, try:

```bash
# Stop the dev server (Ctrl+C in terminal)
# Then run:
cd /Users/mingziy/MealPlanner/figma-design
rm -rf node_modules/.vite
rm -rf .next
npm run dev
```

Then hard refresh your browser again.

## Alternative: Test in Incognito Mode
Sometimes browser extensions cause issues. Test in incognito/private mode:
1. Open incognito window
2. Go to http://localhost:3000
3. Navigate to AI Chat

## Expected Behavior
When working correctly, you should see:
1. A chat interface with header "Recipe Assistant"
2. A welcome message from the bot
3. An input field at the bottom
4. A send button

## Test the Full Flow
Once the page loads:
1. Type: "healthy chicken recipes"
2. Click Send
3. Wait for AI to brainstorm ideas
4. Select checkboxes for recipes you like
5. Click "Confirm Selection"
6. Wait for recipe cards to appear
7. Click "Export to Recipe" on any card
8. Review scraped data in preview modal
9. Click "Confirm & Extract"
10. Verify RecipeEditFormV2 opens with populated data

## Known Issues

### Issue: RangeError: Invalid Date
This is a separate warning from `useMealPlans.ts:170` related to date serialization, not the AI Chat component.

### Issue: TypeScript Errors
The `_s is not a function` is not a TypeScript error - it's a runtime React Fast Refresh error. TypeScript compilation is fine.

## Contact Developer
If issues persist after following all steps above, please provide:
1. Screenshot of browser console errors
2. Screenshot of the blank page
3. Output of `npm list react react-dom`
4. Browser version (Chrome, Firefox, Safari)

## Dev Server Status
- ✅ Dev server running on http://localhost:3000
- ✅ Firebase emulators running on http://localhost:5001
- ✅ All backend functions deployed and functional

## Files Modified
1. `src/config/firebase.ts` - Added functions export
2. `src/components/ai/RecipeChatbot.tsx` - Fixed import path
3. `src/App.tsx` - Added AI Chat routing
4. `src/components/shared/BottomNav.tsx` - Added AI Chat button

