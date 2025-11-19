export interface UserProfile {
  name: string;
  numberOfKids: number;
  kidsAges: number[];
  allergies: string[];
  avoidFoods: string[];
  cookingGoal: 'quick' | 'protein' | 'veggies' | 'balanced';
  hasCompletedOnboarding: boolean;
}

export interface UserPreferences {
  userId: string;
  systemLanguage: 'en' | 'zh';
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id: string;
  name: string;
  image: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  nutrition: {
    protein: number;
    fiber: number;
    fat: number;
    carbs: number;
    iron: string;
    calcium: string;
  };
  plateComposition: {
    protein: number;
    veggies: number;
    carbs: number;
    fats: number;
  };
  portions: {
    adult: string;
    child5: string;
    child2: string;
  };
}

export interface DayPlan {
  day: string;
  breakfast: Recipe[];  // Array of recipes for breakfast
  lunch: Recipe[];      // Array of recipes for lunch
  dinner: Recipe[];     // Array of recipes for dinner
  snacks: Recipe[];     // Array of snack recipes
  breakfastQuickFoods?: QuickFood[];  // Quick add-ons for breakfast
  lunchQuickFoods?: QuickFood[];      // Quick add-ons for lunch
  dinnerQuickFoods?: QuickFood[];     // Quick add-ons for dinner
}

export interface WeeklyPlan {
  id: string;
  cuisine: string;
  weekStartDate: Date;  // Monday of the week (start of week)
  weekEndDate: Date;    // Sunday of the week (end of week)
  weekLabel: string;    // "This Week", "Next Week", or "Dec 23-29, 2024"
  days: DayPlan[];
  createdAt: Date;
  shoppingList?: ShoppingItem[];  // Shopping list associated with this week's plan
  userId?: string;      // For Firestore queries
}

export interface QuickFood {
  id: string;
  name: string;
  category: 'fruit' | 'veggie' | 'dairy' | 'grain' | 'protein' | 'snack' | 'drink';
  emoji?: string; // emoji icon
  image?: string; // optional image URL
  calories: number;
  servingSize: string; // "1 medium banana", "1 cup", etc.
  nutrition: {
    protein: number;  // grams
    carbs: number;    // grams
    fat: number;      // grams
    fiber: number;    // grams
  };
  isCustom?: boolean; // user-created vs pre-populated
  userId?: string;    // for custom items
  originalLanguage?: 'en' | 'zh'; // Detected language from user input
  nameTranslated?: string; // Translated food name
  servingSizeTranslated?: string; // Translated serving size
  translatedTo?: 'en' | 'zh'; // Target language of translation
  lastTranslated?: Date; // Timestamp of last translation
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: 'produce' | 'meat' | 'pantry' | 'dairy' | 'other';
  checked: boolean;
  originalLanguage?: 'en' | 'zh'; // Original language of the item
  translatedName?: string; // Translated version of the item name
}

export interface PrepTask {
  id: string;
  name: string;
  usedFor: string[];
  ingredients: string[];
  instructions: string[];
  storageInstructions: string[];
  completed: boolean;
}

export interface Ingredient {
  id: string;
  amount: string;
  unit: string;
  name: string;
}

export type RecipeCategory = 
  // Meal Timing
  | 'Breakfast' 
  | 'Lunch' 
  | 'Dinner' 
  | 'Snack' 
  
  // Audience
  | 'Kid-Friendly'
  | 'Toddler-Friendly'
  | 'Picky-Eater-Friendly'
  
  // Protein Type
  | 'Beef'
  | 'Chicken'
  | 'Pork'
  | 'Fish'
  | 'Shellfish'
  | 'Turkey'
  | 'Lamb'
  | 'Tofu'
  | 'Eggs'
  
  // Cooking Method
  | 'Batch-Cook Friendly'
  | 'One-Pot'
  | 'No-Cook'
  | 'Slow-Cooker'
  | 'Air-Fryer'
  | 'Instant-Pot'
  
  // Time/Effort
  | 'Quick'
  | '30-Min'
  | 'Make-Ahead'
  | 'Freezer-Friendly'
  
  // Dietary
  | 'Vegetarian'
  | 'Vegan'
  | 'Gluten-Free'
  | 'Dairy-Free'
  | 'Low-Carb'
  | 'Keto'
  
  // Goal-Based
  | 'High-Protein'
  | 'Veggie-Rich'
  | 'Balanced'
  
  // Occasion
  | 'Meal-Prep'
  | 'Comfort-Food'
  | 'Healthy'
  | 'Leftover-Friendly';

export type RecipeCuisine = 
  | 'Korean' 
  | 'Chinese' 
  | 'Italian' 
  | 'American' 
  | 'Mexican' 
  | 'Japanese' 
  | 'Other';

export interface Recipe {
  id: string;
  name: string;
  image: string;
  
  // Simplified tag system (supports multiple selections)
  cuisine: string; // Primary cuisine (for backwards compatibility)
  proteinType: string; // Primary protein type (for backwards compatibility)
  mealType: string; // Primary meal type (for backwards compatibility)
  
  // Multiple tags support
  cuisines?: string[]; // All selected cuisines
  proteinTypes?: string[]; // All selected protein types
  mealTypes?: string[]; // All selected meal types
  
  // Core recipe data
  servings: number; // total number of servings (e.g., 4)
  caloriesPerServing: number; // calories per serving
  ingredients: Ingredient[];
  instructions: string[];
  
  nutrition: {
    protein: number; // in grams PER SERVING
    proteinDV?: number; // % Daily Value
    fiber: number; // in grams PER SERVING
    fiberDV?: number; // % Daily Value
    fat: number; // in grams PER SERVING
    fatDV?: number; // % Daily Value
    carbs: number; // in grams PER SERVING
    carbsDV?: number; // % Daily Value
    iron: string;
    calcium: string;
  };
  plateComposition: {
    protein: number; // percentage
    veggies: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  
  isFavorite: boolean;
  originalText?: string; // Raw extracted text from OCR or pasted text
  sourceUrl?: string; // Original recipe URL for attribution and linking back
  nutritionCalculationReasoning?: string; // AI explanation of how servings/calories/nutrition were calculated
  extractedImages?: string[]; // Array of images extracted from URL
  
  // NEW Language System - replaces bilingual fields
  originalLanguage?: 'en' | 'zh'; // Detected during extraction
  nameTranslated?: string; // Translated version
  ingredientsTranslated?: Ingredient[]; // Translated version
  instructionsTranslated?: string[]; // Translated version
  cuisineTranslated?: string; // Translated cuisine
  proteinTypeTranslated?: string; // Translated protein type
  mealTypeTranslated?: string; // Translated meal type
  translatedTo?: 'en' | 'zh'; // Target language of translation
  lastTranslated?: Date; // Timestamp of last translation
  preferredDisplayLanguage?: 'original' | 'translated'; // User's preferred display version
  
  // Legacy bilingual support (deprecated but kept for backwards compatibility)
  nameZh?: string; // Chinese name
  ingredientsZh?: Ingredient[]; // Chinese ingredients
  instructionsZh?: string[]; // Chinese instructions
  
  // Legacy fields (deprecated but kept for backwards compatibility)
  categories?: RecipeCategory[];
  prepTime?: number; // in minutes (deprecated)
  cookTime?: number; // in minutes (deprecated)
  portions?: {
    adult: string;
    child5: string;
    child2: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
