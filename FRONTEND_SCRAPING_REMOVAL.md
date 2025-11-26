# Frontend Scraping Removal - Migration Guide

## ⚠️ Client-Side Scraping Detected

The following components still perform client-side HTML scraping and need to be migrated to backend Firebase Functions:

### 1. `AddRecipeModal.tsx` (Lines 320-450)

**Current Implementation:**
- Uses CORS proxies (`allorigins.win`, `corsproxy.io`, `api.codetabs.com`)
- Fetches HTML directly in browser
- Parses HTML with `DOMParser`
- Extracts images, text, and recipe data

**Security/Compliance Issues:**
- ❌ Exposes recipe URLs to third-party CORS proxies
- ❌ Client-side scraping may violate website Terms of Service
- ❌ No control over proxy uptime or reliability
- ❌ Large HTML payloads waste user bandwidth
- ❌ Apple may reject app for scraping in WebView

**Migration Path:**
Create new Firebase Function: `extractRecipeFromUrl`

```javascript
exports.extractRecipeFromUrl = functions.https.onCall(async (data, context) => {
  const { url } = data;
  
  // 1. Server-side fetch (no CORS issues)
  const html = await axios.get(url);
  
  // 2. Parse with cheerio
  const $ = cheerio.load(html.data);
  
  // 3. Extract JSON-LD, microdata, OG tags
  const preview = extractPreviewData($);
  
  // 4. Return to client
  return preview;
});
```

**Client Update:**
```typescript
// OLD (client-side scraping)
const html = await fetch(corsProxy + url);
const doc = new DOMParser().parseFromString(html, 'text/html');

// NEW (backend call)
const extractRecipeFromUrl = httpsCallable(functions, 'extractRecipeFromUrl');
const result = await extractRecipeFromUrl({ url });
```

---

### 2. `RecipeIdeaWizard.tsx` (Check if still used)

**Status:** Need to verify if this component is still in use or is deprecated.

---

## ✅ Already Backend-Based

These extraction flows correctly use Firebase Functions:

### `RecipeChatbotScreen.tsx`
- ✅ Calls `chatbotScrapeOnly` Firebase Function
- ✅ Calls `chatbotCleanAndSave` Firebase Function
- ✅ No client-side scraping

---

## 🔧 Implementation Priority

### High Priority (Phase 5)
1. **Add warnings** to `AddRecipeModal.tsx` that client-side scraping is deprecated
2. **Document** migration path in code comments
3. **Add feature flag** to disable URL extraction until backend is ready

### Medium Priority (Post-Phase 5)
1. Create `extractRecipeFromUrl` Firebase Function
2. Update `AddRecipeModal` to call backend
3. Remove CORS proxy logic

### Low Priority (Future)
1. Audit `RecipeIdeaWizard` usage
2. Remove if unused

---

## 🚀 Quick Fix for Phase 5

Add this to `AddRecipeModal.tsx`:

```typescript
// TODO: MIGRATE TO BACKEND
// This client-side scraping should be moved to Firebase Functions
// for better security, reliability, and App Store compliance.
// See: FRONTEND_SCRAPING_REMOVAL.md

console.warn('[AddRecipeModal] Client-side scraping is deprecated. Migrate to backend.');

// Feature flag to disable URL extraction
const ENABLE_CLIENT_SIDE_EXTRACTION = true; // Set to false when backend is ready

if (!ENABLE_CLIENT_SIDE_EXTRACTION) {
  throw new Error('URL extraction temporarily disabled. Please use manual entry or screenshot.');
}
```

---

## 📝 Tracking

- [ ] Add deprecation warnings
- [ ] Document migration path
- [ ] Create backend function
- [ ] Update client code
- [ ] Test migration
- [ ] Remove CORS proxies
- [ ] Remove DOMParser usage
- [ ] Deploy to production

---

_Phase 5 Goal: Document and warn, not break existing functionality_

