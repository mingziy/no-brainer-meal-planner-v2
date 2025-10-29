import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, WeeklyPlan, ShoppingItem, PrepTask, Recipe, RecipeCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
import { useMealPlans } from '../hooks/useMealPlans';
import { User } from 'firebase/auth';

interface AppContextType {
  // Auth
  user: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Recipes (Firebase)
  recipes: Recipe[];
  recipesLoading: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  toggleFavorite: (recipeId: string, currentValue: boolean) => Promise<void>;
  // Meal Plans (Firebase)
  mealPlans: WeeklyPlan[];
  currentWeeklyPlan: WeeklyPlan | null;
  mealPlansLoading: boolean;
  saveMealPlan: (plan: Omit<WeeklyPlan, 'id' | 'createdAt'> | WeeklyPlan) => Promise<string | undefined>;
  deleteMealPlan: (planId: string) => Promise<void>;
  setCurrentWeeklyPlan: (plan: WeeklyPlan | null) => void;
  // Meal Plan helpers
  getWeekStart: (date: Date) => Date;
  getWeekEnd: (date: Date) => Date;
  formatWeekLabel: (weekStart: Date, weekEnd: Date) => string;
  getThisWeekPlan: () => WeeklyPlan | null;
  getNextWeekPlan: () => WeeklyPlan | null;
  getPlanByWeekStart: (weekStart: Date) => WeeklyPlan | null;
  // Legacy/Local state
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  shoppingList: ShoppingItem[];
  setShoppingList: (items: ShoppingItem[]) => void;
  prepTasks: PrepTask[];
  setPrepTasks: (tasks: PrepTask[]) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  planningWeekOffset: number; // 0 = this week, 1 = next week
  setPlanningWeekOffset: (offset: number) => void;
  viewingDayOffset: number; // 0 = today, 1 = tomorrow, etc.
  setViewingDayOffset: (offset: number) => void;
  selectedMealForSwap: { dayIndex: number; mealType: string } | null;
  setSelectedMealForSwap: (data: { dayIndex: number; mealType: string } | null) => void;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  draftRecipe: Partial<Recipe> | null;
  setDraftRecipe: (recipe: Partial<Recipe> | null) => void;
  pendingMealType: RecipeCategory | null;
  setPendingMealType: (type: RecipeCategory | null) => void;
  isAddRecipeModalOpen: boolean;
  setIsAddRecipeModalOpen: (isOpen: boolean) => void;
  isRecipeDetailsModalOpen: boolean;
  setIsRecipeDetailsModalOpen: (isOpen: boolean) => void;
  isRecipeEditFormOpen: boolean;
  setIsRecipeEditFormOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Firebase Auth
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  
  // Firebase Recipes
  const { 
    recipes, 
    loading: recipesLoading, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe,
    toggleFavorite
  } = useRecipes(user?.uid || null);

  // Firebase Meal Plans
  const {
    mealPlans,
    currentPlan,
    loading: mealPlansLoading,
    saveMealPlan,
    deleteMealPlan,
    setCurrentPlan,
    getWeekStart,
    getWeekEnd,
    formatWeekLabel,
    getThisWeekPlan,
    getNextWeekPlan,
    getPlanByWeekStart,
  } = useMealPlans(user?.uid || null);

  // Local state (not synced to Firebase yet)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>([]);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [planningWeekOffset, setPlanningWeekOffset] = useState(0); // 0 = this week, 1 = next week
  const [viewingDayOffset, setViewingDayOffset] = useState(0); // 0 = today, 1 = tomorrow
  const [selectedMealForSwap, setSelectedMealForSwap] = useState<{ dayIndex: number; mealType: string } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [draftRecipe, setDraftRecipe] = useState<Partial<Recipe> | null>(null);
  const [pendingMealType, setPendingMealType] = useState<RecipeCategory | null>(null);
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [isRecipeDetailsModalOpen, setIsRecipeDetailsModalOpen] = useState(false);
  const [isRecipeEditFormOpen, setIsRecipeEditFormOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        // Auth
        user,
        authLoading,
        signInWithGoogle,
        signOut,
        // Recipes (Firebase)
        recipes,
        recipesLoading,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        // Meal Plans (Firebase)
        mealPlans,
        currentWeeklyPlan: currentPlan,
        mealPlansLoading,
        saveMealPlan,
        deleteMealPlan,
        setCurrentWeeklyPlan: setCurrentPlan,
        // Meal Plan helpers
        getWeekStart,
        getWeekEnd,
        formatWeekLabel,
        getThisWeekPlan,
        getNextWeekPlan,
        getPlanByWeekStart,
        // Local state
        userProfile,
        setUserProfile,
        shoppingList,
        setShoppingList,
        prepTasks,
        setPrepTasks,
        currentScreen,
        setCurrentScreen,
        planningWeekOffset,
        setPlanningWeekOffset,
        viewingDayOffset,
        setViewingDayOffset,
        selectedMealForSwap,
        setSelectedMealForSwap,
        selectedRecipe,
        setSelectedRecipe,
        draftRecipe,
        setDraftRecipe,
        pendingMealType,
        setPendingMealType,
        isAddRecipeModalOpen,
        setIsAddRecipeModalOpen,
        isRecipeDetailsModalOpen,
        setIsRecipeDetailsModalOpen,
        isRecipeEditFormOpen,
        setIsRecipeEditFormOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
