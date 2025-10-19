export interface UserProfile {
  name: string;
  numberOfKids: number;
  kidsAges: number[];
  allergies: string[];
  avoidFoods: string[];
  cookingGoal: 'quick' | 'protein' | 'veggies' | 'balanced';
  hasCompletedOnboarding: boolean;
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
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

export interface WeeklyPlan {
  id: string;
  cuisine: string;
  days: DayPlan[];
  createdAt: Date;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: 'produce' | 'meat' | 'pantry' | 'dairy' | 'other';
  checked: boolean;
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
  | 'Breakfast' 
  | 'Lunch' 
  | 'Dinner' 
  | 'Snack' 
  | 'Kid-Friendly' 
  | 'Batch-Cook Friendly';

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
  cuisine: RecipeCuisine;
  categories: RecipeCategory[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: {
    protein: number; // in grams
    fiber: number; // in grams
    fat: number; // in grams
    carbs: number; // in grams
    iron: string;
    calcium: string;
  };
  plateComposition: {
    protein: number; // percentage
    veggies: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  portions: {
    adult: string;
    child5: string;
    child2: string;
  };
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
