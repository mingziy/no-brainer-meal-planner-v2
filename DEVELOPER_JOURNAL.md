# Developer Journal - Meal Planner App

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

