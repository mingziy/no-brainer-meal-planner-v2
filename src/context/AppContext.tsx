import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, WeeklyPlan, ShoppingItem, PrepTask, Recipe } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
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
  // Legacy/Local state
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  currentWeeklyPlan: WeeklyPlan | null;
  setCurrentWeeklyPlan: (plan: WeeklyPlan) => void;
  shoppingList: ShoppingItem[];
  setShoppingList: (items: ShoppingItem[]) => void;
  prepTasks: PrepTask[];
  setPrepTasks: (tasks: PrepTask[]) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  selectedMealForSwap: { dayIndex: number; mealType: string } | null;
  setSelectedMealForSwap: (data: { dayIndex: number; mealType: string } | null) => void;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  draftRecipe: Partial<Recipe> | null;
  setDraftRecipe: (recipe: Partial<Recipe> | null) => void;
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

  // Local state (not synced to Firebase yet)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentWeeklyPlan, setCurrentWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>([]);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedMealForSwap, setSelectedMealForSwap] = useState<{ dayIndex: number; mealType: string } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [draftRecipe, setDraftRecipe] = useState<Partial<Recipe> | null>(null);
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
        // Local state
        userProfile,
        setUserProfile,
        currentWeeklyPlan,
        setCurrentWeeklyPlan,
        shoppingList,
        setShoppingList,
        prepTasks,
        setPrepTasks,
        currentScreen,
        setCurrentScreen,
        selectedMealForSwap,
        setSelectedMealForSwap,
        selectedRecipe,
        setSelectedRecipe,
        draftRecipe,
        setDraftRecipe,
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
