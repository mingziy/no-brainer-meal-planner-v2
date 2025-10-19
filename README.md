# Meal Planner

A comprehensive meal planning app for families that helps parents plan weekly meals, generate shopping lists, and organize meal prep tasks.

This is a code bundle converted from a Figma design. The original project is available at https://www.figma.com/design/85m5Kj2p7F3O9TnInG2NYX/Untitled.

## 🎯 Purpose

A family-focused meal planning application that helps you:
- Plan weekly meals with cuisine-based options
- Generate organized shopping lists by category
- Organize and track meal prep tasks
- View daily meals with assembly instructions
- Manage dietary preferences and restrictions
- Track nutrition with age-appropriate portions

---

## 🏗️ Technical Stack

### Core Technologies
- **React 18.3** with TypeScript
- **Vite 6.3** (build tool)
- **Tailwind CSS** (styling)
- **Radix UI** (accessible component library)
- **Lucide React** (icons)

### Key Libraries
- `recharts` - Charts for nutrition data visualization
- `react-hook-form` - Form management
- `sonner` - Toast notifications
- `embla-carousel-react` - Carousels
- `vaul` - Drawers
- `class-variance-authority` & `clsx` - Component styling utilities

---

## 📱 App Structure & User Flow

The app uses a screen-based navigation system managed through `AppContext`.

### 1. Onboarding Flow
- **Splash Screen** → Initial landing
- **Welcome Screen** → Introduction
- **Dietary Preferences** → Collect allergies, food avoidances
- **Cooking Style** → Set cooking goals (quick, protein-focused, veggie-focused, balanced)

### 2. Main App Sections
- **Home** - Dashboard/overview
- **Planning**:
  - `PlanSetupScreen` - Create weekly meal plans
  - `WeeklyReviewScreen` - Review and adjust plans
  - `MealDetailsModal` - View meal nutrition info
  - `SwapMealModal` - Swap out individual meals
- **Shopping**:
  - `ShoppingListScreen` - Generated shopping lists by category
  - `PrepHubScreen` - Meal prep task management
  - `PrepTaskModal` - Detailed prep instructions
- **Daily**:
  - `TodayScreen` - Today's meals
  - `AssemblyModal` - How to assemble meals
- **Profile** - User settings and preferences

### 3. Navigation
- `BottomNav` component for main navigation
- Screen switching via Context API (no routing library)

---

## 📊 Data Models

Key TypeScript interfaces defined in `src/types/index.ts`:

### UserProfile
- Name, number of kids, kids' ages
- Allergies and dietary restrictions
- Cooking goals (quick, protein, veggies, balanced)
- Onboarding completion status

### Meal
- Individual meals with nutrition data (protein, fiber, fat, carbs, iron, calcium)
- Plate composition percentages
- Age-appropriate portions (adult, 5-year-old, 2-year-old)
- Meal type (breakfast, lunch, dinner, snack)

### WeeklyPlan
- 7-day meal plans organized by cuisine type
- Breakfast, lunch, dinner, and snacks for each day

### ShoppingItem
- Categorized shopping list items (produce, meat, dairy, pantry)
- Quantities and check-off status

### PrepTask
- Batch cooking instructions
- Ingredients and step-by-step instructions
- Storage instructions for meal prep
- Tracking which meals use each prep task

---

## 🎨 UI Components

Located in `src/components/ui/` - a comprehensive Radix UI-based design system including:
- Forms, dialogs, modals, sheets, drawers
- Cards, buttons, badges, avatars
- Accordions, tabs, carousels
- Progress indicators, charts
- Dropdowns, selects, popovers
- And 35+ other accessible components

---

## 💾 State Management

`AppContext` (React Context API) manages:
- User profile and preferences
- Current weekly plan
- Shopping list with items
- Prep tasks and completion status
- Current screen navigation
- Selected meal for swapping

---

## 🎭 Key Features

1. **Family-Focused**: Age-appropriate portions for adults and children (5yo, 2yo)
2. **Cuisine-Based Planning**: Korean, Italian, and other cuisine options
3. **Nutrition Tracking**: Detailed nutrition info and plate composition visualization
4. **Batch Cooking**: Smart prep tasks that work across multiple meals
5. **Shopping Organization**: Items categorized (produce, meat, dairy, pantry)
6. **Mock Data**: Currently uses mock data (`src/data/mockData.ts`) for demo purposes

---

## 🚀 Getting Started

### Installation

```bash
npm i
```

### Development

```bash
npm run dev
```

The app will start on a local development server (typically http://localhost:5173).

### Build

```bash
npm run build
```

Builds the app for production to the `dist` folder.

---

## 📁 Project Structure

```
src/
├── components/      # Feature-based UI components
│   ├── onboarding/  # User onboarding flow
│   ├── home/        # Home dashboard
│   ├── planning/    # Meal planning features
│   ├── shopping/    # Shopping & prep
│   ├── daily/       # Daily meal view
│   ├── profile/     # User profile
│   ├── shared/      # Reusable components
│   ├── figma/       # Figma-specific utilities
│   └── ui/          # Design system components
├── context/         # Global state management (AppContext)
├── data/            # Mock data for development
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── styles/          # Global styles (Tailwind CSS)
└── guidelines/      # Development guidelines
```

---

## 🔄 Current Status

This is a **prototype/demo application** that:
- ✅ Has a complete UI implementation
- ✅ Uses mock data for all features
- ✅ Demonstrates the full user flow
- ⏳ Ready for backend integration
- ⏳ Needs API connections to replace mock data

---

## 🚧 Next Steps

To make this production-ready:
1. **Backend Integration**: Replace mock data with real API calls
2. **Authentication**: Add user login/signup
3. **Data Persistence**: Store user profiles, plans, and preferences
4. **Real Meal Database**: Connect to actual recipe/meal database
5. **Routing**: Consider adding React Router for URL-based navigation
6. **Testing**: Add unit and integration tests
7. **Deployment**: Set up CI/CD pipeline

---

## 📝 License

This project is private.
