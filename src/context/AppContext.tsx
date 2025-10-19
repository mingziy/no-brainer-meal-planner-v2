import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, WeeklyPlan, ShoppingItem, PrepTask, Recipe } from '../types';
import { mockRecipes } from '../data/mockData';

interface AppContextType {
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
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentWeeklyPlan, setCurrentWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>([]);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedMealForSwap, setSelectedMealForSwap] = useState<{ dayIndex: number; mealType: string } | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [draftRecipe, setDraftRecipe] = useState<Partial<Recipe> | null>(null);
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [isRecipeDetailsModalOpen, setIsRecipeDetailsModalOpen] = useState(false);
  const [isRecipeEditFormOpen, setIsRecipeEditFormOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
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
        recipes,
        setRecipes,
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
