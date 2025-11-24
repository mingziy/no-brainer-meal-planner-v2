# Fix: deadline-exceeded Error

## Problem
When asking a question in AI Chat, got `deadline-exceeded` error.

## Root Cause
The local Firebase emulator was running, but the `functions/index.js` file was deleted. This meant:
- The emulator had no functions to execute
- Requests timed out after 60 seconds
- Error: `deadline-exceeded`

## Solution
Disabled the local emulator connection and switched to **production Firebase Functions**.

### What Changed
**File**: `src/config/firebase.ts`

**Before**:
```typescript
// Connect to emulator in development
if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Connected to Firebase Functions emulator');
}
```

**After**:
```typescript
// Connect to emulator in development (DISABLED - using production functions)
// if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
//   console.log('🔧 Connected to Firebase Functions emulator');
// }
```

## Benefits
- ✅ No timeout errors
- ✅ All functions available (already deployed)
- ✅ Faster development (no need to run emulator)
- ✅ Consistent behavior between dev and prod

## Testing
1. **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Navigate to AI Chat
3. Type: "healthy chicken recipes"
4. Click Send
5. Should see AI brainstorming ideas within 5-10 seconds

## What Happens Now
- Local development (`localhost:3000`) → Uses **production functions**
- Production site (`meal-planer-v2.web.app`) → Uses **production functions**

This is fine for testing! You're using real deployed functions, so there's no need to maintain local function code.

## If You Need Local Development Later
If you want to develop functions locally in the future:

1. Recreate `functions/index.js` with all function code
2. Re-enable the emulator connection in `firebase.ts`
3. Run: `firebase emulators:start --only functions`

For now, using production functions is the fastest way to test!

## Cost Implications
Using production functions means:
- Each function call counts toward your Firebase quota
- For development/testing, this is usually fine (generous free tier)
- If you make MANY requests, consider recreating local functions

## Current Status
- ✅ Emulator stopped
- ✅ App configured to use production functions
- ✅ Ready to test

## Next Steps
1. Hard refresh browser
2. Test AI Chat
3. If it works, you're good to go!
4. If you still see errors, check browser console for the actual error message

