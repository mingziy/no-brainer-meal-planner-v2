# Home Screen Redesign - Implementation Complete

## Overview
The Home Screen has been completely redesigned to match the Weekly Meal Plan layout with horizontal scrollable day cards and a toggle between view and edit modes.

## Key Features

### 1. View Mode (Default - Read-Only)

#### **3-Day View (Default)**
- Shows: Yesterday, Today, Tomorrow
- Horizontally scrollable cards
- **Centered on Today** by default
- Clean display: meal thumbnails, dish names, quick foods (no edit controls)
- Today's card is highlighted with a primary border and 🌟 emoji

#### **Full Week View**
- Button: "Show Full Week" / "Show 3 Days" (toggles)
- Shows all 7 days of current week (Monday-Sunday)
- Horizontally scrollable cards

#### **Special Case - Sunday with No Next Week Plan**
- When today is Sunday AND no next week plan exists
- Shows: "Plan Next Week" button (with + icon)
- Clicking it automatically switches to Edit Mode

### 2. Edit Mode

#### **Time Range**
- Always shows **up to next Sunday** (covers 2 weeks max)
- Example: If today is Wednesday:
  - Shows: Wed, Thu, Fri, Sat, Sun (this week) + Mon-Sun (next week)
  - Total: up to 14 day cards

#### **Controls at Top**
- **Cancel** button: discards changes
- **Save** button: saves changes to Firestore
- **Auto-fill** button: fills all empty slots with random recipes from library
- **Reset** button: clears all meals (with confirmation dialog)

#### **Card Display**
- All cards shown (empty or filled)
- Each meal (Breakfast, Lunch, Dinner) has:
  - Recipe list with thumbnails
  - "X" button to remove recipes
  - "+ Add Recipe" button
  - Quick food list with "X" buttons
  - "+ Add Quick Food" button

### 3. Visual Design

#### **Card Layout**
- Fixed width: 280px
- Horizontal scroll with snap points
- Border styling: Today's card has primary border
- Each card shows:
  - Day name and date
  - 3 meal sections (Breakfast 🍳, Lunch ☀️, Dinner 🌙)
  - Recipe thumbnails (40x40px) or placeholder emoji

#### **Meal Display**
- **Read-only mode**: Clean list with thumbnails and names
- **Edit mode**: Same + X buttons, + Add buttons

### 4. Functionality

#### **Recipe Management**
- Add recipes: Opens recipe picker dialog
- Filter by meal type automatically
- Search recipes by name
- Create new recipe (opens AddRecipeModal)
- Remove recipes with X button

#### **Quick Food Management**
- Add quick foods: Opens category picker → item picker
- Categories: Fruits, Veggies, Dairy, Grains, Protein, Snacks, Drinks
- Remove quick foods with X button

#### **Data Persistence**
- Saves to both `thisWeekPlan` and `nextWeekPlan` in Firestore
- Stores only essential recipe data (id, name, image, caloriesPerServing)
- Handles week boundaries intelligently

## User Flow

### Typical View-Only Flow
1. User opens Home Screen
2. Sees 3 cards: Yesterday, Today (centered), Tomorrow
3. Today's card is highlighted
4. Can click "Show Full Week" to see Monday-Sunday
5. Can click "Show 3 Days" to return to 3-day view

### Edit Flow
1. User clicks "Edit" button (top-right)
2. Page shows all days from today to next Sunday
3. User can:
   - Add/remove recipes for any meal
   - Add/remove quick foods
   - Auto-fill all meals
   - Reset all meals
4. User clicks "Save" to persist changes
5. Or clicks "Cancel" to discard changes
6. Returns to view mode

### Sunday Special Case
1. Today is Sunday
2. No next week plan exists
3. "Plan Next Week" button appears
4. Clicking it switches to Edit Mode
5. User can plan Monday-Sunday for next week

## Technical Implementation

### State Management
- `isEditing`: boolean - toggles between view/edit modes
- `viewMode`: '3-day' | 'full-week' - toggles between 3-day and full week view
- `editedPlans`: { thisWeek: DayMealPlan[], nextWeek: DayMealPlan[] } - temporary state for editing
- `addingMeal`: tracks which meal slot is being edited
- `addingQuickFood`: tracks which meal is receiving a quick food

### Data Flow
1. **Load**: Fetches `thisWeekPlan` and `nextWeekPlan` from AppContext
2. **Edit**: Creates deep copy of plans in `editedPlans`
3. **Modify**: Updates `editedPlans` in memory
4. **Save**: Writes `editedPlans` to Firestore via `saveMealPlan()`
5. **Cancel**: Discards `editedPlans` and reloads from Firestore

### Components
- `HomeScreen`: Main container
- `MealRowReadOnly`: Read-only meal display (no controls)
- `MealRowEditable`: Editable meal display (with X and + buttons)

## Differences from Old Home Screen

| Old | New |
|-----|-----|
| Vertical layout | Horizontal scroll |
| Two separate day sections | 3-day or full week cards |
| Always shows edit controls | Toggle between view/edit modes |
| No quick food support | Full quick food integration |
| Static view | Dynamic view (3-day/full-week toggle) |
| No multi-week editing | Edit up to 2 weeks at once |

## Benefits

1. **Consistent UX**: Matches Weekly Plan page design
2. **Cleaner View**: Read-only mode reduces visual clutter
3. **Efficient Editing**: Batch edit multiple days at once
4. **Better Mobile UX**: Horizontal scroll is natural on mobile
5. **Quick Glance**: See multiple days at once
6. **Flexible Planning**: Switch between focused (3-day) and overview (full-week) views

## Files Modified
- `src/components/home/HomeScreen.tsx`: Complete rewrite (~1200 lines)

## Next Steps
- Test on mobile devices for horizontal scroll behavior
- Consider adding swipe gestures for navigation
- Add loading states for data fetching
- Add empty state illustrations for days with no meals

