# Developer Journal - Meal Planner App

## October 27, 2025

### Edit Today's Meals Feature
- Implemented Quick Edit Modal for daily meal editing:
  - Edit breakfast, lunch, and dinner meals for current day
  - Add/remove recipes with recipe picker (filtered by meal type)
  - Add/remove quick foods with category-based picker
  - Separate "+ Add Recipe" and "+ Add Quick Food" buttons for each meal
  - Proper layout with recipes first, then quick foods section
  - Scrollable modal with fixed header and footer buttons
- Automatic shopping list regeneration after daily edits
- Background AI cleaning of ingredients while showing immediate save confirmation

### Quick Foods Category Picker
- Redesigned quick food picker with two-level navigation:
  - Level 1: Category grid view (Fruits, Veggies, Dairy, Grains, Protein, Snacks, Drinks)
  - Level 2: Item list within selected category
  - Back button to return to categories
  - Visual design with large emoji icons and item counts

### Shopping List Enhancements
- Added quick foods to shopping list generation
- Implemented deduplication:
  - Case-insensitive matching to merge duplicates (e.g., "Ginger" + "ginger" → "Ginger")
  - Cross-checking between recipe ingredients and quick foods
- Proper capitalization of all items (first letter of each word)
- Category improvements:
  - Removed "Other" category - everything maps to Produce, Meat & Poultry, Dairy, or Pantry
  - Fixed category order: Produce → Meat & Poultry → Dairy → Pantry
  - Added emoji icons to category headers (🥬 Produce, 🍖 Meat & Poultry, 🥛 Dairy, 🍞 Pantry)
- Alphabetical sorting within each category maintained

### Meal Plan Overwrite Logic
- Changed meal plan saving to always overwrite existing plan for the same week
- Prevents duplicate plans in database
- Maintains original `createdAt` timestamp, updates `updatedAt`
- Cleaner database with one plan per week

### Home Screen Meal Plan Display
- Fixed issue where home screen showed wrong plan after edits
- Updated `getThisWeekPlan()` and `getNextWeekPlan()` to return most recently created plan when multiple plans exist for same week
- More robust date comparison with normalized timestamps

### Shopping List Week Selector
- Unified format for week labels: "This Week (Oct 27 - Nov 2)"
- Shows relative label with actual date range for clarity
- Deduplication logic to show only one entry per week (most recent)
- Sorted display: This Week, Next Week, then past weeks by date

### Technical Improvements
- Shopping list generation moved to backend during meal plan save
- AI ingredient cleaning happens in background with retry logic
- Improved error handling for AI cleaning failures
- Console logging for debugging shopping list generation
- Fixed double-division bug in nutrition calculations

## October 21, 2025

### Initial Setup & Recipe Tab Implementation
- Explored and documented existing Meal Planner project structure
- Replaced "Plan" tab with new "Recipe" tab featuring Recipe Library
- Implemented core recipe features:
  - Recipe Library with search and category filters
  - Recipe card grid layout (responsive 1-2 columns)
  - Add Recipe modal with AI extraction and manual entry options
  - Recipe Details modal with full recipe information display
  - Recipe Edit Form with comprehensive fields
- Created TypeScript interfaces for Recipe, Ingredient, RecipeCategory, RecipeCuisine
- Added 8 sample recipes to mock data
- Integrated Radix UI components (Dialog, ScrollArea, Button, Input, Card, Badge, Select, Textarea)

### UI/UX Refinements
- Fixed page width consistency issues (max-w-md for mobile-first design)
- Implemented proper scrolling in Recipe Details modal (sticky header, scrollable content)
- Constrained Add Recipe modal width for better mobile experience
- Added accessibility features (aria-describedby, DialogDescription)

### Recipe Parser Development
- Implemented simulated AI text parser (V1) to extract:
  - Recipe name from first non-header line
  - Ingredients with amounts and units
  - Instructions with step-by-step format
  - Prep/cook times
  - Cuisine detection
  - Category detection
- Added validation to skip section headers when parsing recipe names

### Chinese Recipe Support
- Extended recipe parser to handle Chinese characters and keywords
- Added Chinese section keywords (食材, 材料, 做法, 步骤)
- Added Chinese unit support (克, 勺, 杯, 个, 适量, 少许)
- Added Chinese cuisine detection (中式, 炒, 爆炒, 炒饭)
- Updated font stack in global CSS to include Chinese fonts (PingFang SC, Hiragino Sans GB, Microsoft YaHei)
- Created 3 Chinese recipe samples (Kung Pao Chicken, Tomato and Egg Stir-Fry, Mapo Tofu)

### Firebase Integration
- Set up Firebase project for cloud storage and authentication
- Integrated Firebase Authentication with Google Sign-in (redirect-based)
- Implemented Cloud Firestore for recipe storage with real-time sync
- Created custom hooks:
  - `useAuth`: Manages authentication state and Google sign-in/sign-out
  - `useRecipes`: Manages recipe CRUD operations with Firestore
- Updated AppContext to use Firebase hooks
- Implemented user-specific recipe storage (recipes scoped by userId)
- Added Firebase configuration security:
  - Created `.gitignore` rules for `firebase.ts`
  - Created `firebase.example.ts` template
  - Documented setup in `FIREBASE_SETUP_GUIDE.md`, `QUICK_START.md`, `GIT_SAFETY.md`

### Authentication & Login Flow
- Fixed Firebase authentication errors:
  - Switched from popup to redirect-based auth for better mobile compatibility
  - Added browser persistence (`browserLocalPersistence`)
  - Implemented redirect result handling with proper race condition prevention
  - Added popup fallback for mobile Safari (with graceful degradation to redirect)
- Created SignInScreen component with Google authentication
- Added UserButton component for user profile display and sign-out
- Integrated sign-out functionality in Profile screen
- Simplified onboarding flow:
  - Changed initial screen from 'splash' to 'home'
  - Removed onboarding questions (name, kids, preferences)
  - Users go directly to home page after Google login

### Deployment
- Deployed app to Firebase Hosting
- Fixed deployment issues:
  - Corrected build directory from 'dist' to 'build' in `firebase.json`
  - Added cache-busting headers for HTML, JS, CSS, and image files
  - Resolved mobile login issues with authorized domains
- Created deployment documentation (`DEPLOY_TO_FIREBASE.md`)

### Mobile Login Fix
- Resolved mobile Safari redirect loop issues:
  - Implemented popup-first authentication with redirect fallback
  - Added custom parameters to Google Provider (prompt, redirect_uri)
  - Fixed persistence and redirect result processing order
  - Added cache-busting headers to ensure latest code loads
- Verified working on both desktop and mobile devices

### Logout Functionality
- Fixed non-working logout button in Profile screen
- Updated UserButton component to correctly await async signOut function
- Added debug logging for logout flow (later removed)

### OCR & Text Extraction
- Integrated Tesseract.js for client-side OCR (English + Simplified Chinese)
- Implemented image upload with text extraction workflow
- Added OCR progress indicator during text extraction
- Stored original extracted text in `originalText` field for reference
- Added "View Original Recipe" button in Recipe Details modal
- Implemented scrollable textarea display for original recipe text
- Fixed text display issues with proper scrolling and formatting

### Recipe Management Features
- Added delete recipe functionality with confirmation dialog
- Implemented delete button at bottom of recipe cards
- Added favorite/unfavorite toggle in Recipe Details
- Fixed state management for `originalText` field:
  - Stored in local state during form editing
  - Preserved when draft recipe is cleared
  - Conditionally included in Firestore saves (no undefined values)

### Image Cropping Feature
- Installed and integrated `react-easy-crop` library
- Implemented image cropping workflow:
  - Upload screenshot → Extract text → Open form
  - "Crop Image" button in recipe edit form
  - Cropping modal with zoom controls and drag-to-select
  - Cropped image becomes recipe display photo
  - Full original image used for text extraction
- Created crop helper functions:
  - `createCroppedImage`: Canvas-based image cropping
  - `onCropComplete`: Crop area tracking
- Stored original image data for later cropping (`originalImageForCropping`)

### Bug Fixes & Optimizations
- Fixed RecipeEditForm auto-fill after AI extraction
- Resolved Firestore undefined field errors
- Fixed image preview and cropping state management
- Removed debug console logs for cleaner production code
- Fixed recipe parser V1 vs V2 confusion (reverted to V1)
- Ensured "View Original Recipe" button visibility
- Fixed textarea scrolling in original text dialog

### Documentation
- Created comprehensive README with project overview
- Added code explanation guide (`code_explain.md`)
- Created sample recipe files (English and Chinese)
- Documented AI extraction workflow (`AI_EXTRACTION_GUIDE.md`)
- Created multiple Firebase setup guides for different use cases
- Added attribution tracking (`Attributions.md`)

### Technical Stack Used
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI for accessible components
- Firebase (Auth, Firestore, Hosting)
- Tesseract.js for OCR
- react-easy-crop for image cropping
- Context API for state management

### Known Issues & Future Work
- Image cropping UI needs visual feedback testing
- Manual image upload (non-OCR) not yet implemented
- Recipe sharing functionality to be added
- Nutrition calculation automation
- Meal planning integration with recipes
- Shopping list auto-generation from recipes

## October 22, 2025

### AI-Powered Recipe Parsing
- Integrated Google Gemini AI (gemini-2.5-flash) for intelligent recipe extraction
- Replaced local parser with AI-powered parsing (fallback to local parser on failure)
- Configured API key management via `.env.local` file
- Added multilingual support (preserves original language - Chinese/English)
- Enhanced parsing accuracy for ingredients, instructions, and metadata

### URL Import Feature
- Implemented automatic recipe import from URLs
- Added CORS proxy with multiple fallbacks (corsproxy.io, codetabs, allorigins)
- Extracts recipe content and images from any recipe website
- 15-second timeout per proxy attempt with automatic failover
- Filters out icons, logos, and ads from image extraction

### Image Selector
- Created image selection UI with grid layout
- Extracts up to 10 images from recipe webpages (OG image, Twitter cards, content images)
- User can click to select preferred recipe card display image
- "Skip - Use Default" option if no suitable images found
- Image preview with hover effects and broken image handling

### Source URL Attribution
- Added `sourceUrl` field to Recipe type
- Saves original recipe URL for attribution
- "Open Original Website" button opens source in new tab
- "View Extracted Text" and "Open Original Website" buttons side-by-side below recipe title
- Fixed Firebase save issue where sourceUrl wasn't being persisted

### Mobile Optimizations
- Image resizing before OCR (max 1600px) for faster processing
- Increased OCR timeout to 90 seconds for mobile devices
- Better error handling with user-friendly fallback options
- Improved progress indicators during URL fetching and OCR

### Bug Fixes
- Fixed sourceUrl not being saved to Firestore (added to RecipeEditForm state and save logic)
- Removed intrusive alert dialogs, kept silent fallbacks with console logging
- Fixed button labeling confusion ("View Extracted Text" vs "Open Original Website")
- Cleaned up debug console logs after fixing issues

### Bilingual Recipe Feature
- Implemented automatic English-to-Chinese translation for URL-imported recipes
- Added `nameZh`, `ingredientsZh`, `instructionsZh` fields to Recipe type
- Created `parseRecipeWithBilingualSupport()` function with two Gemini API calls
- Added retry logic (3 attempts) for both English parsing and Chinese translation
- 2-second delay between API calls to prevent rate limiting
- Language-aware display: shows Chinese versions when language is set to 中文
- Bilingual support in Recipe Library cards and Recipe Details modal
- Graceful fallback to English-only if translation fails
- Added internationalization (i18n) with `react-i18next` for UI text translation
- Created language switcher component (EN/中文 toggle)
- Translation files for recipe library, details, and categories
- **Unique selling point**: Build Chinese database from US recipe websites automatically

### AI-Powered Nutrition Calculation
- Integrated USDA FoodData Central data for accurate nutrition estimates
- AI calculates nutrition from raw/uncooked ingredient values
- Added `servings`, `caloriesPerServing`, `nutrition` fields to Recipe type
- Nutrition includes: protein, fat, carbs, fiber (grams and % Daily Value)
- Added `nutritionCalculationReasoning` field for AI's step-by-step calculation logic
- **% Daily Value** calculated based on FDA 2000-calorie diet guidelines
- Gemini prompt includes detailed USDA nutrition estimation instructions
- Editable serving size and calories in RecipeEditForm
- Console logging for debugging AI nutrition calculations

### Nutrition Information UI
- Redesigned Recipe Details modal with dedicated "Nutrition Information" card
- Removed "Plate Composition" and "Portion Guidance" sections
- Prominent display: large servings count and calories per serving (text-5xl)
- Macronutrient grid: Protein, Carbs, Fats, Fiber with grams and %DV
- Bold nutrient labels for better readability
- Wider column spacing (gap-x-16) for cleaner layout
- "View AI Calculation Logic" button displays detailed reasoning in modal
- Frameless card design for modern, clean look

## October 26, 2025

### Image Processing Optimization
- **Removed Tesseract.js OCR** (slow, 90s+ processing time)
- **Direct Gemini Vision** for image-to-recipe extraction
- 3.5x faster: 120s OCR+parsing → 45s direct vision
- Simplified prompt (100 words vs 2500 words) for speed
- Removed nutrition calculation from image processing (too slow)
- Bundle size reduced: 984 KB → 969 KB (15 KB smaller)

### Image Upload Improvements
- **Auto-crop modal** after AI extraction
- User selects portion of image for recipe card display
- Automatic image compression for Firestore (max 800px, 70% quality)
- Fixed: "image too large" error (>1MB Firestore limit)
- Converts to JPEG and compresses before saving
- Logs compression ratio for debugging

### AI Recipe Discovery Wizard
- New "AI Recipe Ideas" button in Recipe Library
- Natural language queries in English or Chinese
- AI generates customizable recipe suggestions (default: 5)
- Checkbox selection for multiple recipes
- Attempts auto-fetch from multiple recipe sites:
  - AllRecipes, Simply Recipes, Food Network, Serious Eats, Bon Appetit
- Searches results pages and extracts first recipe link
- Bilingual recipe extraction (EN + CN) for all imported recipes
- Image selector for choosing best photo from website
- Fallback to manual URL paste if auto-fetch fails
- Progress tracking: "Processing X of Y..."

### Wizard Flow States
- **Step 1**: Query input (text + suggestion count)
- **Step 2**: AI suggestions with checkboxes
- **Step 3**: Processing each selected recipe one-by-one
- **Step 4**: Next action (more ideas / new search / done)
- Auto-continues to next recipe after save
- Graceful error handling with retry options

### Known Limitations & Future Improvements
- **CORS restrictions** prevent reliable auto-fetching from browser
- Most recipe sites block cross-origin requests
- CORS proxies unreliable (403, 429, 503 errors)
- **Solution identified**: Firebase Cloud Functions for server-side fetching
  - Would bypass CORS completely
  - Enable fully automated recipe discovery
  - ~20 minutes implementation time
  - Free tier: 2M requests/month

### Bug Fixes
- Fixed JSON parsing for AI-generated recipe ideas (escaped quotes)
- Fixed recipe link extraction from search results
- Fixed flow continuation after image selection
- Added retry logic for Gemini API overload (503 errors)
- Improved error messages and user feedback

### Meal Planning System
- **Multiple recipes per meal**: Each meal (Breakfast, Lunch, Dinner) now supports arrays of recipes
- Users can add chicken AND duck to the same meal slot
- Updated `DayPlan` type: changed from single recipe to recipe arrays
- Redesigned Today Screen with vertical meal sections (replaced 2x2 grid)
- Each recipe displays as clickable card with image, name, time, and calories
- Click any recipe card to view full details (ingredients, instructions, nutrition)

### Recipe Details Modal Enhancement
- Updated modal to accept props (recipe, onClose) for flexible usage
- Maintains backward compatibility with App context for other screens
- Modal now works from both Recipe Library and Today Screen
- Fixed issue where modal wasn't displaying from Today Screen

### Weekly Meal Planner Updates
- Supports multiple recipes per meal slot
- "Add More" button after first recipe in each meal
- Individual remove buttons for each recipe in a meal
- Shopping list generation from all recipes in weekly plan
- Auto-save meal plan changes
- "Save Meal Plan" and "Generate Shopping List" buttons
- Plan edits automatically update shopping list (preserves checked items)

### Shopping List Improvements
- Extracts **base ingredient names** only (no processing details)
- "minced garlic" → "Garlic"
- "boneless skinless chicken breast" → "Chicken breast"
- Removes words: minced, diced, chopped, sliced, fresh, frozen, large, medium, etc.
- Simplified display (no quantities shown for now)
- Categories: produce, meat, dairy, pantry

### Daily Nutrition Goals Card
- **Calorie tracking**: Shows total daily calories with % of 2000 cal goal
- Averages calories when multiple recipes in a meal (e.g., 2 breakfast recipes)
- **FDA Daily Values** for macronutrients:
  - Protein: 50g
  - Carbohydrates: 275g
  - Total Fat: 78g
  - Dietary Fiber: 28g
- Progress bars with %DV for each nutrient
- Smart feedback messages based on calorie and protein goals
- Blue progress bar for calories, color-coded bars for macros

### Home Screen Updates
- Displays saved weekly plan with all recipes per meal
- "Today's Steps" button links to daily cooking view
- "Edit Week" button for meal plan management
- Shows all recipes for each meal type (multiple per meal)

### Dynamic Tagging System
- **Expanded categories** with 30+ tags:
  - Meal Timing: Breakfast, Lunch, Dinner, Snack
  - Protein Type: Beef, Chicken, Pork, Fish, Shellfish, Turkey, Lamb, Tofu, Eggs
  - Cooking Method: Batch-Cook, One-Pot, No-Cook, Slow-Cooker, Air-Fryer, Instant-Pot
  - Time/Effort: Quick, 30-Min, Make-Ahead, Freezer-Friendly
  - Dietary: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Low-Carb, Keto
  - Goal-Based: High-Protein, Veggie-Rich, Balanced, Healthy
  - Audience: Kid-Friendly, Toddler-Friendly, Picky-Eater-Friendly
  - Occasion: Meal-Prep, Comfort-Food, Leftover-Friendly
- Changed from badge UI to dropdown menus (one per category group)
- AI automatically fills tags during recipe extraction
- **Dynamic tag learning**: New tags (e.g., "Duck") automatically added to appropriate dropdown
- Regex-based inference for categorizing new custom tags
- "None" and "+ Custom..." options in each dropdown

### Technical Improvements
- Proper type definitions for multiple recipes per meal
- Array-based meal storage and retrieval
- Improved state management for meal plans
- Better error handling and loading states
- Removed unused child nutrition recommendations

### Bug Fixes (Session)
- Fixed recipe card clicks not opening modal (prop vs context issue)
- Fixed dropdown overlapping in recipe edit form (z-index and portal issues)
- Fixed meal plan save functionality
- Fixed function definition order for calorie calculations
- Resolved TypeScript errors with recipe arrays

### Known Issues
- Calories progress bar display issue (minor visual bug, functionality works)
- Need to investigate calorie bar rendering in production

## November 1, 2025

### Quick Foods Page Redesign
- Redesigned Quick Foods page with **two-column sidebar layout**:
  - Left sidebar: Category buttons (Fruits, Veggies, Grains, Protein, Dairy, Snacks, Drinks)
  - Right content area: Food items under selected category
  - Stacked layout similar to Chinese food ordering apps
- Adjusted page width to `max-w-md` for iPhone consistency
- Enhanced nutrition display:
  - Changed abbreviations (P, C, F) to full names (Protein, Carbs, Fat)
  - Added Fiber to nutrition information
  - Stacked layout for each nutrition item (vertical display)

### Add Quick Food with AI
- Implemented **"Add Quick Food" function** with AI auto-population:
  - Floating Action Button (FAB) in top-right corner
  - Single description input field (e.g., "a cup of brown rice")
  - **AI Auto-Fill button** calls Gemini API (`gemini-2.5-flash`)
  - Auto-populates: portion unit, calories, nutrition (protein, carbs, fat, fiber), emoji, and category
- **Firebase integration** for custom quick foods:
  - Saves to `quickFoods` collection with `userId` and `isCustom: true`
  - Real-time loading of user's custom quick foods
  - Updated Firestore security rules for authenticated user access
- Error handling with `AlertDialog`:
  - "AI parsing failed" warning with retry or manual input options
  - User-friendly fallback for API errors
- Success message: "Quick food saved!"

### Recipe Library Redesign
- Redesigned Recipe Library with **sidebar layout**:
  - Left sidebar: Protein source categories (All Recipes, Chicken, Beef, Pork, Fish, Seafood, Eggs, Vegetarian, Vegan)
  - Right content area: Recipe cards filtered by selected category
  - Added emojis to sidebar: 🍗 Chicken, 🍖 Pork, 🥦 Vegetarian, 🥚 Eggs
- **Recipe card updates**:
  - Removed prep and cook time display
  - Changed delete button to trash can icon (`Trash2`) without text
  - Positioned delete button at top-right corner of card with semi-transparent background
  - Removed category tags/badges from cards
  - Kept single-column layout with image on left, title on right
- Removed "AI Recipe Ideas" button from Recipe Library
- Increased sidebar button height (`py-8`) to ~1/2 recipe card length
- Added "Eggs" as protein category to sidebar

### Recipe Saving Process Redesign
- **Simplified and automated** recipe saving with **3-step sequential flow**:
  1. **Step 1: Confirm Recipe**
     - Select and crop picture
     - Review recipe ingredients and steps
     - Removed prep/cook time and portion guidance
  2. **Step 2: Calorie Confirmation**
     - Confirm total servings and calories per serving
     - Display AI calculation logic below (scrollable, formatted for readability)
  3. **Step 3: Tagging Page**
     - Three tag categories: Cuisine, Protein Type, Meal Type
     - Multiple tag selection per category
     - **Notion-style design**:
       - Selected tags displayed inside input box as colored pills
       - AI-suggested tags as clickable buttons below input
       - Colored backgrounds for both selected and suggested tags
       - Space key as separator for multiple keywords
       - Auto-tag with color when typing
     - Grey hint text in empty input boxes
     - Suggestions show AI-extracted tags (no "+" sign)

### Recipe Data Structure Updates
- Updated `Recipe` interface to support **multiple tags**:
  - Added array fields: `cuisines[]`, `proteinTypes[]`, `mealTypes[]`
  - Kept singular fields for backwards compatibility: `cuisine`, `proteinType`, `mealType`
- Created helper function `getProteinTypes()` to **unify tag handling**:
  - Single source of truth for protein type filtering
  - Handles both old (string) and new (array) formats seamlessly
- **Bidirectional matching** for protein filters:
  - Fixed issue where "egg" wouldn't match "Eggs" category
  - Now checks both `proteinType.includes(category)` and `category.includes(proteinType)`
  - Handles case-insensitive matching

### Shopping List Export
- Fixed exported shopping list to **match displayed list exactly**:
  - Same grouping (by category)
  - Same order (sorted categories and items)
  - Same ingredient names (no quantities)
  - Includes checkbox status (✓ or ☐)
  - Category headers with separator lines

### Meal Editing Flow Improvements
- **"Add Recipe" → "Create New Recipe" flow**:
  - Added "Create New Recipe" button in Add Recipe pop-out window
  - Seamless redirect to Add New Recipe page
  - Returns to Add Meal page after recipe is saved
  - Newly added recipe automatically visible for selection
- Fixed recipe filter logic to use new `mealTypes` array instead of deprecated `categories`
- Implemented `pendingTodayMealSelection` in `AppContext`:
  - Tracks which meal type user was adding when redirected
  - Reopens correct modal and meal picker after recipe save
- **Modal state management**:
  - Added `useEffect` to reset `AddRecipeModal` state when reopened
  - Prevents "asking for link directly" issue
  - Clean initial view with all three options (URL, Paste, Upload)
- **Eliminated flickering**:
  - Added `isTransitioning` flag to immediately hide recipe picker
  - Smooth transition between modals without animation flicker
- **Immediate save feedback**:
  - "Save Changes" button closes modal immediately
  - Performs save and shopping list regeneration in background
  - Better UX with no perceived lag

### Recipe Details Modal Updates
- **AI Nutrition Calculation display**:
  - Updated pop-up window to match recipe save screen styling
  - Changed modal width from `max-w-3xl` to `max-w-md` for phone consistency
  - Fixed text wrapping in `<pre>` tag:
    - Added `overflow-x-hidden` to container
    - Inline styles: `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'`, `overflowWrap: 'break-word'`
    - Forces text to wrap within constrained width
  - Removed gradient background, used `bg-gray-50` for clean look
  - Small font (`text-xs`), monospace for calculation details
- Fixed tag display to show **all multiple tags**:
  - Displays all cuisines, protein types, and meal types
  - Uses array fields (`cuisines[]`, etc.) with fallback to singular fields

### Image Selector Scrolling Fix
- Fixed **"not scrollable, not starting from beginning"** issue in image selector:
  - Root cause: `max-h-[85vh]` Tailwind class wasn't constraining height properly
  - Solution: Used inline `style={{ maxHeight: '85vh', height: 'auto' }}`
  - Proper flexbox structure:
    - `DialogContent`: `flex flex-col` with `overflow-hidden`
    - `DialogHeader`: `flex-shrink-0` to stay fixed at top
    - Scrollable content: `flex-1 overflow-y-auto min-h-0` with `WebkitOverflowScrolling: 'touch'`
  - Added `onOpenAutoFocus={(e) => e.preventDefault()}` to prevent auto-focus issues
- Applied same fix to URL/Paste recipe add page image selector
- Changed modal width from `max-w-2xl` to `max-w-md` for consistency

### Bug Fixes
- Fixed Gemini API model name error (changed `gemini-1.5-flash` to `gemini-2.5-flash`)
- Fixed custom quick foods not showing in database (Firebase integration)
- Fixed delete button visibility on recipe cards (z-index and positioning)
- Fixed "User must be signed in" error in recipe saving (`useRecipes(user?.uid || null)`)
- Fixed saved recipes not loading in Recipe Library (`RecipeDetailsModal` using old `categories` field)
- Fixed only one meal type showing when multiple saved (updated save logic to use arrays)
- Fixed recipe not showing under "Eggs" filter despite having "egg" tag (bidirectional matching)
- Fixed exported grocery list not matching displayed list (updated `handleExportList` logic)
- Fixed "Add Recipe" blanking out on Today's edit page (filter logic using old `categories`)
- Fixed image selector not scrollable and not starting from top (inline `maxHeight` style)

### Technical Improvements
- Created `getProteinTypes()` helper for unified protein type handling
- Debug logging for modal state and recipe filtering (later removed)
- Improved TypeScript typing for multiple tag arrays
- Better state management across nested modals
- Background async operations for better perceived performance
- Text wrapping edge cases handled for `<pre>` tags with long unbreakable strings

### Documentation
- Updated `DEVELOPER_JOURNAL.md` with all session changes

