import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, Edit, Save, X, Plus, Sparkles, RotateCcw, PlusCircle, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';
import { Recipe, RecipeCategory, QuickFood, ShoppingItem } from '../../types';
import { defaultQuickFoods } from '../../data/quickFoods';
import { cleanIngredientNames } from '../../utils/geminiRecipeParser';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
type ViewMode = '3-day' | 'full-week';

interface DayMealPlan {
  day: string;
  date: Date;
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
  breakfastQuickFoods: QuickFood[];
  lunchQuickFoods: QuickFood[];
  dinnerQuickFoods: QuickFood[];
}

// Helper function to get display name based on user's preference
const getRecipeDisplayName = (recipe: Recipe): string => {
  if (recipe.preferredDisplayLanguage === 'translated' && recipe.nameTranslated) {
    return recipe.nameTranslated;
  }
  return recipe.name;
};

// English day names for internal storage/lookup (never changes)
const englishDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper function to get translated day names for display
const getTranslatedDayNames = (t: any): string[] => {
  return [
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
    t('days.sunday')
  ];
};

export function HomeScreen() {
  const { t, i18n } = useTranslation('navigation');
  const { 
    userProfile, 
    recipes,
    getThisWeekPlan,
    getNextWeekPlan,
    saveMealPlan,
    setCurrentScreen,
    setPlanningWeekOffset,
    setIsAddRecipeModalOpen,
    setPendingMealType,
    setSelectedRecipe,
    setIsRecipeDetailsModalOpen,
  } = useApp();
  
  // Check if current language is Chinese
  const isChineseMode = i18n.language === 'zh';
  
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full-week'); // Default to show all cards
  const [editedPlans, setEditedPlans] = useState<{ thisWeek: DayMealPlan[], nextWeek: DayMealPlan[] } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [addingMeal, setAddingMeal] = useState<{ weekOffset: number; dayIndex: number; mealType: MealType } | null>(null);
  const [addingQuickFood, setAddingQuickFood] = useState<{ weekOffset: number; dayIndex: number; mealType: MealType } | null>(null);
  const [selectedQuickFoodCategory, setSelectedQuickFoodCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [centeredCardIndex, setCenteredCardIndex] = useState<number>(0);
  
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Get yesterday, today, tomorrow dates
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const yesterdayName = yesterday.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrowName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Check if tomorrow is Monday (crosses into next week)
  const isTomorrowNextWeek = todayDayOfWeek === 0; // Sunday
  
  // Get week plans
  const thisWeekPlan = getThisWeekPlan();
  const nextWeekPlan = getNextWeekPlan();
  
  // Check if next week plan exists
  const hasNextWeekPlan = nextWeekPlan && !nextWeekPlan.days.every(day => 
    day.breakfast.length === 0 && 
    day.lunch.length === 0 && 
    day.dinner.length === 0
  );
  
  // Helper to get day plan from week plan
  const getDayPlanFromWeek = (weekPlan: any, dayName: string): DayMealPlan | null => {
    if (!weekPlan) return null;
    const dayPlan = weekPlan.days.find((d: any) => d.day === dayName);
    if (!dayPlan) return null;
    
    const date = new Date(dayName); // This is placeholder, we'll set proper date
    return {
      day: dayName,
      date,
      breakfast: Array.isArray(dayPlan.breakfast) ? dayPlan.breakfast : [],
      lunch: Array.isArray(dayPlan.lunch) ? dayPlan.lunch : [],
      dinner: Array.isArray(dayPlan.dinner) ? dayPlan.dinner : [],
      breakfastQuickFoods: dayPlan.breakfastQuickFoods || [],
      lunchQuickFoods: dayPlan.lunchQuickFoods || [],
      dinnerQuickFoods: dayPlan.dinnerQuickFoods || []
    };
  };
  
  // Helper to enrich recipe data with full details from recipes collection
  const enrichRecipeData = (minimalRecipes: any[]): Recipe[] => {
    if (!minimalRecipes) return [];
    return minimalRecipes.map(minimalRecipe => {
      const fullRecipe = recipes.find(r => r.id === minimalRecipe.id);
      if (fullRecipe) {
        return fullRecipe;
      }
      // If recipe not found in collection, return minimal data
      return minimalRecipe as Recipe;
    }).filter(Boolean);
  };

  // Get the days to display based on view mode and edit state
  const getDisplayDays = (): DayMealPlan[] => {
    if (isEditing) {
      // Edit mode: show both weeks starting from Monday of this week
      const days: DayMealPlan[] = [];
      const translatedDayNames = getTranslatedDayNames(t);
      
      // Calculate Monday of this week
      const mondayOfThisWeek = new Date(today);
      const currentDayIndex = (todayDayOfWeek + 6) % 7; // Convert Sunday=0 to Monday=0
      mondayOfThisWeek.setDate(today.getDate() - currentDayIndex);
      
      // Show all 14 days (this week + next week)
      for (let i = 0; i < 14; i++) {
        const date = new Date(mondayOfThisWeek);
        date.setDate(mondayOfThisWeek.getDate() + i);
        const englishDayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dayIndex = englishDayNames.indexOf(englishDayName);
        const translatedDayName = translatedDayNames[dayIndex];
        
        // Determine if this date is in this week or next week
        const weekPlan = i < 7 ? (editedPlans?.thisWeek || []) : (editedPlans?.nextWeek || []);
        const dayPlan = weekPlan[dayIndex];
        
        // Always push the day, even if no plan exists (use translated name for display)
        days.push(dayPlan ? { ...dayPlan, day: translatedDayName, date } : {
          day: translatedDayName,
          date,
          breakfast: [],
          lunch: [],
          dinner: [],
          breakfastQuickFoods: [],
          lunchQuickFoods: [],
          dinnerQuickFoods: []
        });
      }
      
      return days;
    } else if (viewMode === 'full-week') {
      // Full week view: show Monday-Sunday of current week
      const days: DayMealPlan[] = [];
      const translatedDayNames = getTranslatedDayNames(t);
      
      englishDayNames.forEach((englishDayName, index) => {
        const translatedDayName = translatedDayNames[index];
        const dayPlan = getDayPlanFromWeek(thisWeekPlan, englishDayName);
        // Calculate actual date for this day
        const date = new Date(today);
        const currentDayIndex = (todayDayOfWeek + 6) % 7; // Convert Sunday=0 to Monday=0
        const dayOffset = index - currentDayIndex;
        date.setDate(today.getDate() + dayOffset);
        
        // Always push the day, even if no plan exists (use translated name for display)
        days.push(dayPlan ? { ...dayPlan, day: translatedDayName, date } : {
          day: translatedDayName,
          date,
          breakfast: [],
          lunch: [],
          dinner: [],
          breakfastQuickFoods: [],
          lunchQuickFoods: [],
          dinnerQuickFoods: []
        });
      });
      
      return days;
    } else {
      // 3-day view: yesterday, today, tomorrow
      const days: DayMealPlan[] = [];
      
      // Yesterday
      const yesterdayPlan = getDayPlanFromWeek(thisWeekPlan, yesterdayName);
      if (yesterdayPlan) days.push({ ...yesterdayPlan, date: yesterday });
      
      // Today
      const todayPlan = getDayPlanFromWeek(thisWeekPlan, todayName);
      if (todayPlan) days.push({ ...todayPlan, date: today });
      
      // Tomorrow
      const tomorrowPlan = getDayPlanFromWeek(
        isTomorrowNextWeek ? nextWeekPlan : thisWeekPlan,
        tomorrowName
      );
      if (tomorrowPlan) days.push({ ...tomorrowPlan, date: tomorrow });
      
      return days;
    }
  };
  
  const displayDays = getDisplayDays();
  
  // Find today's index in displayDays
  const todayIndex = displayDays.findIndex(day => 
    day.day === todayName && day.date.toDateString() === today.toDateString()
  );
  
  // Scroll to today on mount and when entering edit mode
  useEffect(() => {
    if (scrollContainerRef.current && todayIndex !== -1) {
      const container = scrollContainerRef.current;
      
      const scrollToToday = () => {
        const cardWidth = 280;
        const gap = 12;
        
        // Wait for container to have actual scrollable content
        if (container.scrollWidth <= container.offsetWidth) {
          return false;
        }
        
        // Calculate scroll position
        // The inner div has paddingLeft: calc(50% - 140px)
        // So card at index i starts at: paddingLeft + (cardWidth + gap) * i
        const containerWidth = container.offsetWidth;
        const centeringPadding = containerWidth / 2 - 140; // calc(50% - 140px)
        
        // Position of today's card start
        const cardStartPosition = centeringPadding + (cardWidth + gap) * todayIndex;
        
        // To center this card, we need to scroll so the card's center is at viewport center
        const cardCenterPosition = cardStartPosition + cardWidth / 2;
        const scrollTo = cardCenterPosition - containerWidth / 2;
        
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          container.scrollLeft = scrollTo;
          container.scrollTo({
            left: scrollTo,
            behavior: isEditing ? 'smooth' : 'auto'
          });
        });
        
        setCenteredCardIndex(todayIndex);
        return true;
      };
      
      // Try immediately, then retry with delays if not ready
      if (!scrollToToday()) {
        const attempts = isEditing ? [100, 300, 500, 800, 1200] : [50, 150, 300, 500, 800];
        attempts.forEach(delay => {
          setTimeout(() => {
            if (container.scrollWidth > container.offsetWidth) {
              scrollToToday();
            }
          }, delay);
        });
      }
    }
  }, [viewMode, isEditing, todayIndex]);
  
  // Track which card is centered on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const cardWidth = 280;
      const gap = 12;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      
      // Calculate which card is at the center of the viewport
      // We need to find which card's center is closest to the viewport center
      const viewportCenter = scrollLeft + containerWidth / 2;
      const centeringPadding = containerWidth / 2 - 140;
      
      // Each card center is at: centeringPadding + (cardWidth + gap) * i + cardWidth / 2
      // Find the card whose center is closest to viewportCenter
      let closestIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < displayDays.length; i++) {
        const cardCenterPosition = centeringPadding + (cardWidth + gap) * i + cardWidth / 2;
        const distance = Math.abs(cardCenterPosition - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      
      setCenteredCardIndex(closestIndex);
    };
    
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once immediately to set initial state
    return () => container.removeEventListener('scroll', handleScroll);
  }, [displayDays, viewMode, isEditing]);
  
  // Initialize edited plans when entering edit mode
  const handleEnterEditMode = () => {
    // Use English names for data lookup
    const translatedDayNames = getTranslatedDayNames(t);
    
    // Initialize this week's plan
    const thisWeek: DayMealPlan[] = englishDayNames.map((englishDayName, index) => {
      const translatedDayName = translatedDayNames[index];
      const dayPlan = getDayPlanFromWeek(thisWeekPlan, englishDayName);
      if (dayPlan) return dayPlan;
      
      const date = new Date(today);
      const currentDayIndex = (todayDayOfWeek + 6) % 7;
      const dayOffset = index - currentDayIndex;
      date.setDate(today.getDate() + dayOffset);
      
      return {
        day: translatedDayName,
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        breakfastQuickFoods: [],
        lunchQuickFoods: [],
        dinnerQuickFoods: []
      };
    });
    
    // Initialize next week's plan
    const nextWeek: DayMealPlan[] = englishDayNames.map((englishDayName, index) => {
      const translatedDayName = translatedDayNames[index];
      const dayPlan = getDayPlanFromWeek(nextWeekPlan, englishDayName);
      if (dayPlan) return dayPlan;
      
      const date = new Date(today);
      const currentDayIndex = (todayDayOfWeek + 6) % 7;
      const dayOffset = index - currentDayIndex + 7;
      date.setDate(today.getDate() + dayOffset);
      
      return {
        day: translatedDayName,
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        breakfastQuickFoods: [],
        lunchQuickFoods: [],
        dinnerQuickFoods: []
      };
    });
    
    setEditedPlans({ thisWeek, nextWeek });
    setIsEditing(true);
  };
  
  // Check if text contains Chinese characters
  const containsChinese = (text: string): boolean => {
    return /[\u4e00-\u9fa5]/.test(text);
  };

  // Categorize ingredient for shopping list
  const categorizeIngredient = (name: string): string => {
    const nameLower = name.toLowerCase();
    
    // Produce
    if (/vegetable|fruit|lettuce|tomato|onion|garlic|pepper|carrot|broccoli|spinach|kale|cabbage|potato|avocado|apple|banana|berry|lemon|lime|orange|herb|cilantro|parsley|basil/.test(nameLower)) {
      return 'produce';
    }
    
    // Meat
    if (/chicken|beef|pork|fish|salmon|turkey|lamb|meat|bacon|sausage|shrimp|crab|lobster/.test(nameLower)) {
      return 'meat';
    }
    
    // Dairy
    if (/milk|cheese|yogurt|butter|cream|egg|dairy/.test(nameLower)) {
      return 'dairy';
    }
    
    // Pantry (default for everything else like rice, pasta, oil, etc.)
    return 'pantry';
  };

  // Generate shopping list from meal plan
  const generateShoppingListFromPlan = async (planDays: DayMealPlan[]): Promise<ShoppingItem[]> => {
    const ingredientMap = new Map<string, { original: string; category: string }>();
    const quickFoodMap = new Map<string, QuickFood>();
    
    // Collect all unique ingredients from planned meals
    planDays.forEach(day => {
      const allRecipes = [...day.breakfast, ...day.lunch, ...day.dinner];
      
      allRecipes.forEach(recipe => {
        // Look up the full recipe to get ingredients
        const fullRecipe = recipes.find(r => r.id === recipe.id);
        if (!fullRecipe) return;
        
        // Use language-appropriate ingredients
        const ingredientsToUse = isChineseMode && fullRecipe.ingredientsZh 
          ? fullRecipe.ingredientsZh 
          : fullRecipe.ingredients;
        
        if (!ingredientsToUse || ingredientsToUse.length === 0) return;
        
        ingredientsToUse.forEach(ingredient => {
          const key = ingredient.name.toLowerCase().trim();
          
          if (!ingredientMap.has(key)) {
            const category = categorizeIngredient(ingredient.name);
            ingredientMap.set(key, { original: ingredient.name, category });
          }
        });
      });
      
      // Collect quick foods from each meal
      const allQuickFoods = [
        ...(day.breakfastQuickFoods || []),
        ...(day.lunchQuickFoods || []),
        ...(day.dinnerQuickFoods || [])
      ];
      
      allQuickFoods.forEach(food => {
        const key = food.name.toLowerCase().trim();
        if (!quickFoodMap.has(key)) {
          quickFoodMap.set(key, food);
        }
      });
    });
    
    const ingredientNames = Array.from(ingredientMap.values()).map(v => v.original);
    const quickFoods = Array.from(quickFoodMap.values());
    
    // Clean ingredient names using AI
    let cleanedNames: string[] = [];
    if (ingredientNames.length > 0) {
      try {
        cleanedNames = await cleanIngredientNames(ingredientNames);
      } catch (error) {
        console.error('❌ AI cleaning failed, using original names:', error);
        cleanedNames = ingredientNames;
      }
    }
    
    // Create shopping list with cleaned ingredient names (deduplicated and capitalized)
    const itemMap = new Map<string, { category: string }>();
    
    cleanedNames.forEach((cleanedName, index) => {
      const originalData = Array.from(ingredientMap.values())[index];
      const normalizedName = cleanedName.toLowerCase().trim();
      
      if (!itemMap.has(normalizedName)) {
        itemMap.set(normalizedName, { category: originalData.category });
      }
    });
    
    // Create shopping list from deduplicated items
    const newShoppingList: ShoppingItem[] = Array.from(itemMap.entries()).map(([name, data], index) => {
      const capitalizedName = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        id: `shopping-ingredient-${index}`,
        name: capitalizedName,
        quantity: '',
        category: data.category as any,
        checked: false,
      };
    });
    
    // Add quick foods to shopping list (deduplicate with existing items)
    quickFoods.forEach((food, index) => {
      const normalizedFoodName = food.name.toLowerCase().trim();
      
      const existingItem = newShoppingList.find(item => 
        item.name.toLowerCase().trim() === normalizedFoodName
      );
      
      if (!existingItem) {
        let category: 'produce' | 'meat' | 'dairy' | 'pantry' = 'pantry';
        if (food.category === 'fruit' || food.category === 'veggie') {
          category = 'produce';
        } else if (food.category === 'dairy') {
          category = 'dairy';
        } else if (food.category === 'protein') {
          category = 'meat';
        }
        
        const capitalizedName = food.name.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        newShoppingList.push({
          id: `shopping-quickfood-${index}`,
          name: capitalizedName,
          quantity: food.servingSize,
          category,
          checked: false,
        });
      }
    });
    
    return newShoppingList;
  };

  // Save edited plans
  const handleSave = async () => {
    if (!editedPlans) return;
    
    try {
      const savePromises: Promise<any>[] = [];
      
      // Calculate this week's date range
      const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      
      const getWeekEnd = (startDate: Date) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 6); // Sunday
        d.setHours(23, 59, 59, 999);
        return d;
      };
      
      const thisWeekStart = getWeekStart(today);
      const thisWeekEnd = getWeekEnd(thisWeekStart);
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(thisWeekStart.getDate() + 7);
      const nextWeekEnd = getWeekEnd(nextWeekStart);
      
      // Save this week's plan (create new if doesn't exist)
      console.log('💾 Saving this week\'s plan...');
      const saveThisWeek = (async () => {
        try {
          const shoppingList = await generateShoppingListFromPlan(editedPlans.thisWeek);
          // Simplify shopping list to reduce document size
          const simplifiedShoppingList = shoppingList.map(item => ({ 
            id: item.id, 
            name: item.name, 
            quantity: item.quantity, 
            category: item.category, 
            checked: item.checked 
          }));
          
          const updatedThisWeek = thisWeekPlan ? {
            id: thisWeekPlan.id,
            userId: thisWeekPlan.userId || userProfile?.id,
            cuisine: thisWeekPlan.cuisine,
            weekStartDate: thisWeekPlan.weekStartDate,
            weekEndDate: thisWeekPlan.weekEndDate,
            weekLabel: thisWeekPlan.weekLabel,
            days: editedPlans.thisWeek.map(day => ({
              day: day.day,
              breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              lunch: day.lunch.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              dinner: day.dinner.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              snacks: [] as any[],
              breakfastQuickFoods: (day.breakfastQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              lunchQuickFoods: (day.lunchQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              dinnerQuickFoods: (day.dinnerQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories }))
            })),
            shoppingList: simplifiedShoppingList,
          } : {
            // Create new plan
            userId: userProfile?.id,
            cuisine: 'American',
            weekStartDate: thisWeekStart,
            weekEndDate: thisWeekEnd,
            weekLabel: `${thisWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${thisWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            days: editedPlans.thisWeek.map(day => ({
              day: day.day,
              breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              lunch: day.lunch.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              dinner: day.dinner.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              snacks: [] as any[],
              breakfastQuickFoods: (day.breakfastQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              lunchQuickFoods: (day.lunchQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              dinnerQuickFoods: (day.dinnerQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories }))
            })),
            shoppingList: simplifiedShoppingList,
          };
          await saveMealPlan(updatedThisWeek);
          console.log('✅ This week plan saved with', simplifiedShoppingList.length, 'items in shopping list');
        } catch (error) {
          console.error('❌ Error saving this week:', error);
          // Save without shopping list if generation fails
          const updatedThisWeek = thisWeekPlan ? {
            id: thisWeekPlan.id,
            userId: thisWeekPlan.userId,
            cuisine: thisWeekPlan.cuisine,
            weekStartDate: thisWeekPlan.weekStartDate,
            weekEndDate: thisWeekPlan.weekEndDate,
            weekLabel: thisWeekPlan.weekLabel,
            days: editedPlans.thisWeek.map(day => ({
              day: day.day,
              breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              lunch: day.lunch.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              dinner: day.dinner.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              snacks: [] as any[],
              breakfastQuickFoods: (day.breakfastQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              lunchQuickFoods: (day.lunchQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              dinnerQuickFoods: (day.dinnerQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories }))
            })),
            shoppingList: thisWeekPlan.shoppingList || [],
          } : {
            userId: userProfile?.id,
            cuisine: 'American',
            weekStartDate: thisWeekStart,
            weekEndDate: thisWeekEnd,
            weekLabel: `${thisWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${thisWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            days: editedPlans.thisWeek.map(day => ({
              day: day.day,
              breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              lunch: day.lunch.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              dinner: day.dinner.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
              snacks: [] as any[],
              breakfastQuickFoods: (day.breakfastQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              lunchQuickFoods: (day.lunchQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
              dinnerQuickFoods: (day.dinnerQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories }))
            })),
            shoppingList: [],
          };
          await saveMealPlan(updatedThisWeek);
        }
      })();
      savePromises.push(saveThisWeek);
      
      // Save next week's plan (if it has content)
      const hasNextWeekContent = editedPlans.nextWeek.some(day => 
        day.breakfast.length > 0 || day.lunch.length > 0 || day.dinner.length > 0
      );
      
      if (hasNextWeekContent) {
        console.log('💾 Saving next week\'s plan...');
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() - todayDayOfWeek + 8);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        
        const saveNextWeek = (async () => {
          try {
            const shoppingList = await generateShoppingListFromPlan(editedPlans.nextWeek);
            // Simplify shopping list to reduce document size
            const simplifiedShoppingList = shoppingList.map(item => ({ 
              id: item.id, 
              name: item.name, 
              quantity: item.quantity, 
              category: item.category, 
              checked: item.checked 
            }));
            
            const updatedNextWeek: any = {
              cuisine: 'Mixed',
              weekStartDate: nextWeekStart,
              weekEndDate: nextWeekEnd,
              weekLabel: `${nextWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
              days: editedPlans.nextWeek.map(day => ({
                day: day.day,
                breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
                lunch: day.lunch.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
                dinner: day.dinner.map(r => ({ id: r.id, name: r.name, caloriesPerServing: r.caloriesPerServing })) as any,
                snacks: [] as any[],
                breakfastQuickFoods: (day.breakfastQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
                lunchQuickFoods: (day.lunchQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories })),
                dinnerQuickFoods: (day.dinnerQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories }))
              })),
              shoppingList: simplifiedShoppingList,
            };
            if (nextWeekPlan?.id) {
              updatedNextWeek.id = nextWeekPlan.id;
            }
            await saveMealPlan(updatedNextWeek);
            console.log('✅ Next week plan saved with', simplifiedShoppingList.length, 'items in shopping list');
          } catch (error) {
            console.error('❌ Error saving next week:', error);
            const updatedNextWeek: any = {
              cuisine: 'Mixed',
              weekStartDate: nextWeekStart,
              weekEndDate: nextWeekEnd,
              weekLabel: `${nextWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
              days: editedPlans.nextWeek.map(day => ({
                day: day.day,
                breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, image: r.image, caloriesPerServing: r.caloriesPerServing })) as any,
                lunch: day.lunch.map(r => ({ id: r.id, name: r.name, image: r.image, caloriesPerServing: r.caloriesPerServing })) as any,
                dinner: day.dinner.map(r => ({ id: r.id, name: r.name, image: r.image, caloriesPerServing: r.caloriesPerServing })) as any,
                snacks: [] as any[],
                breakfastQuickFoods: (day.breakfastQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories, servingSize: f.servingSize, category: f.category, nameTranslated: f.nameTranslated, servingSizeTranslated: f.servingSizeTranslated })),
                lunchQuickFoods: (day.lunchQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories, servingSize: f.servingSize, category: f.category, nameTranslated: f.nameTranslated, servingSizeTranslated: f.servingSizeTranslated })),
                dinnerQuickFoods: (day.dinnerQuickFoods || []).map(f => ({ id: f.id, name: f.name, emoji: f.emoji, calories: f.calories, servingSize: f.servingSize, category: f.category, nameTranslated: f.nameTranslated, servingSizeTranslated: f.servingSizeTranslated }))
              })),
              shoppingList: nextWeekPlan?.shoppingList || [],
            };
            if (nextWeekPlan?.id) {
              updatedNextWeek.id = nextWeekPlan.id;
            }
            await saveMealPlan(updatedNextWeek);
          }
        })();
        savePromises.push(saveNextWeek);
      }
      
      // Wait for all saves to complete
      await Promise.all(savePromises);
      console.log('✅ All meal plans saved successfully');
      
      // Close edit window only after successful save
      setIsEditing(false);
      setEditedPlans(null);
      
      // Force a small delay to ensure context updates propagate
      setTimeout(() => {
        console.log('📊 Refreshing UI with updated plans');
      }, 100);
    } catch (error) {
      console.error('❌ Error saving plans:', error);
      alert('Failed to save. Please try again.');
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setEditedPlans(null);
  };
  
  // Auto-fill
  const handleAutoFill = () => {
    if (!editedPlans) return;
    
    const getRecipesByMealType = (mealType: MealType): Recipe[] => {
      return recipes.filter(recipe => 
        recipe.mealTypes?.some(mt => mt.toLowerCase() === mealType.toLowerCase()) ||
        (recipe.mealType && recipe.mealType.toLowerCase() === mealType.toLowerCase()) ||
        (recipe.categories && recipe.categories.includes(mealType as RecipeCategory))
      );
    };
    
    const getRandomQuickFoods = (count: number): QuickFood[] => {
      const shuffled = [...defaultQuickFoods].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    
    const breakfastRecipes = getRecipesByMealType('Breakfast');
    const lunchRecipes = getRecipesByMealType('Lunch');
    const dinnerRecipes = getRecipesByMealType('Dinner');
    
    setEditedPlans({
      thisWeek: editedPlans.thisWeek.map(day => ({
        ...day,
        breakfast: breakfastRecipes.length > 0 ? [breakfastRecipes[Math.floor(Math.random() * breakfastRecipes.length)]] : [],
        lunch: lunchRecipes.length > 0 ? [lunchRecipes[Math.floor(Math.random() * lunchRecipes.length)]] : [],
        dinner: dinnerRecipes.length > 0 ? [dinnerRecipes[Math.floor(Math.random() * dinnerRecipes.length)]] : [],
        breakfastQuickFoods: getRandomQuickFoods(2),
        lunchQuickFoods: getRandomQuickFoods(2),
        dinnerQuickFoods: getRandomQuickFoods(2)
      })),
      nextWeek: editedPlans.nextWeek.map(day => ({
        ...day,
        breakfast: breakfastRecipes.length > 0 ? [breakfastRecipes[Math.floor(Math.random() * breakfastRecipes.length)]] : [],
        lunch: lunchRecipes.length > 0 ? [lunchRecipes[Math.floor(Math.random() * lunchRecipes.length)]] : [],
        dinner: dinnerRecipes.length > 0 ? [dinnerRecipes[Math.floor(Math.random() * dinnerRecipes.length)]] : [],
        breakfastQuickFoods: getRandomQuickFoods(2),
        lunchQuickFoods: getRandomQuickFoods(2),
        dinnerQuickFoods: getRandomQuickFoods(2)
      }))
    });
  };
  
  // Reset
  const handleReset = () => {
    if (!editedPlans) return;
    
    setEditedPlans({
      thisWeek: editedPlans.thisWeek.map(day => ({
        ...day,
        breakfast: [],
        lunch: [],
        dinner: [],
        breakfastQuickFoods: [],
        lunchQuickFoods: [],
        dinnerQuickFoods: []
      })),
      nextWeek: editedPlans.nextWeek.map(day => ({
        ...day,
        breakfast: [],
        lunch: [],
        dinner: [],
        breakfastQuickFoods: [],
        lunchQuickFoods: [],
        dinnerQuickFoods: []
      }))
    });
    setIsResetDialogOpen(false);
  };
  
  // Add recipe to meal
  const handleSelectRecipe = (weekOffset: number, dayIndex: number, mealType: MealType, recipe: Recipe) => {
    if (!editedPlans) return;
    
    const week = weekOffset === 0 ? 'thisWeek' : 'nextWeek';
    const mealTypeKey = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
    
    setEditedPlans({
      ...editedPlans,
      [week]: editedPlans[week].map((day, i) => 
        i === dayIndex
          ? { ...day, [mealTypeKey]: [...day[mealTypeKey], recipe] }
          : day
      )
    });
    
    setAddingMeal(null);
  };
  
  // Remove recipe from meal
  const handleRemoveRecipe = (weekOffset: number, dayIndex: number, mealType: MealType, recipeIndex: number) => {
    if (!editedPlans) return;
    
    const week = weekOffset === 0 ? 'thisWeek' : 'nextWeek';
    const mealTypeKey = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
    
    setEditedPlans({
      ...editedPlans,
      [week]: editedPlans[week].map((day, i) => 
        i === dayIndex
          ? { ...day, [mealTypeKey]: day[mealTypeKey].filter((_, ri) => ri !== recipeIndex) }
          : day
      )
    });
  };
  
  // Add quick food
  const handleAddQuickFood = (food: QuickFood) => {
    if (!addingQuickFood || !editedPlans) return;
    
    const week = addingQuickFood.weekOffset === 0 ? 'thisWeek' : 'nextWeek';
    const quickFoodKey = `${addingQuickFood.mealType.toLowerCase()}QuickFoods` as 'breakfastQuickFoods' | 'lunchQuickFoods' | 'dinnerQuickFoods';
    
    setEditedPlans({
      ...editedPlans,
      [week]: editedPlans[week].map((day, i) => 
        i === addingQuickFood.dayIndex
          ? { ...day, [quickFoodKey]: [...day[quickFoodKey], food] }
          : day
      )
    });
    
    setAddingQuickFood(null);
    setSelectedQuickFoodCategory(null);
  };
  
  // Remove quick food
  const handleRemoveQuickFood = (weekOffset: number, dayIndex: number, mealType: MealType, quickFoodIndex: number) => {
    if (!editedPlans) return;
    
    const week = weekOffset === 0 ? 'thisWeek' : 'nextWeek';
    const quickFoodKey = `${mealType.toLowerCase()}QuickFoods` as 'breakfastQuickFoods' | 'lunchQuickFoods' | 'dinnerQuickFoods';
    
    setEditedPlans({
      ...editedPlans,
      [week]: editedPlans[week].map((day, i) => 
        i === dayIndex
          ? { ...day, [quickFoodKey]: day[quickFoodKey].filter((_, qi) => qi !== quickFoodIndex) }
          : day
      )
    });
  };

  // Handle recipe click to open details modal
  const handleRecipeClick = (recipe: Recipe) => {
    // Look up the full recipe from the recipes array to get all details
    const fullRecipe = recipes.find(r => r.id === recipe.id) || recipe;
    setSelectedRecipe(fullRecipe);
    setIsRecipeDetailsModalOpen(true);
  };
  
  // Get filtered recipes
  const getFilteredRecipes = (mealType: MealType) => {
    return recipes.filter(recipe => {
      // Cross-language search: search both original and translated names
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchLower) ||
        (recipe.nameTranslated && recipe.nameTranslated.toLowerCase().includes(searchLower));
      
      const matchesMealType = 
        recipe.mealTypes?.some(mt => mt.toLowerCase() === mealType.toLowerCase()) ||
        (recipe.mealType && recipe.mealType.toLowerCase() === mealType.toLowerCase()) ||
        (recipe.categories && recipe.categories.some(cat => cat.toLowerCase() === mealType.toLowerCase()));
      
      return matchesSearch && matchesMealType;
    });
  };
  
  // Quick food categories
  const quickFoodCategories = [
    { name: 'Fruits', categoryKey: 'fruit', emoji: '🍎', count: defaultQuickFoods.filter(f => f.category === 'fruit').length },
    { name: 'Veggies', categoryKey: 'veggie', emoji: '🥕', count: defaultQuickFoods.filter(f => f.category === 'veggie').length },
    { name: 'Dairy', categoryKey: 'dairy', emoji: '🥛', count: defaultQuickFoods.filter(f => f.category === 'dairy').length },
    { name: 'Grains', categoryKey: 'grain', emoji: '🍞', count: defaultQuickFoods.filter(f => f.category === 'grain').length },
    { name: 'Protein', categoryKey: 'protein', emoji: '🥩', count: defaultQuickFoods.filter(f => f.category === 'protein').length },
    { name: 'Snacks', categoryKey: 'snack', emoji: '🍿', count: defaultQuickFoods.filter(f => f.category === 'snack').length },
    { name: 'Drinks', categoryKey: 'drink', emoji: '🥤', count: defaultQuickFoods.filter(f => f.category === 'drink').length },
  ];
  
  const getQuickFoodsByCategory = (category: string) => {
    return defaultQuickFoods.filter(food => food.category === category);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Upper content area - fixed (non-scrollable) */}
      <div className="fixed top-0 left-0 right-0 bg-background z-50 max-w-md mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl">
              {userProfile?.name ? `${t('greetings.hi')} ${userProfile.name}!` : t('greetings.hiThere')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditing ? t('sections.editingMealPlan') : t('sections.mealPlanGlance')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
          <UserButton />
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  {t('actions.save')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit mode controls */}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('actions.autoFill')}
            </button>
            <button
              onClick={() => setIsResetDialogOpen(true)}
              className="flex-1 py-1.5 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('actions.reset')}
            </button>
          </div>
        )}
      </div>

      {/* Sticky Card Section - Fixed container with flex layout */}
      <div 
        className="fixed left-0 right-0 bg-background flex flex-col"
        style={{ 
          maxWidth: '448px',
          margin: '0 auto',
          zIndex: 40,
          top: isEditing ? '150px' : '100px',
          bottom: '3rem'
        }}
      >
        {/* Day Header - Fixed outside scroll */}
        <div className="px-4 py-0 bg-background flex-shrink-0 relative">
          <div className="text-center">
            <div className="text-sm font-bold">
              {displayDays[centeredCardIndex]?.day}
              {displayDays[centeredCardIndex]?.day === todayName && 
               displayDays[centeredCardIndex]?.date.toDateString() === today.toDateString() && ' 🌟'}
            </div>
            <div className="text-xs font-normal text-muted-foreground">
              {displayDays[centeredCardIndex]?.date.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          
          {/* Edit button in top right of header */}
          {!isEditing && (
            <button
              onClick={handleEnterEditMode}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-md"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Vertical scroll for entire card suite */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingTop: '0px'
          }}
        >
          {/* Horizontal scroll container */}
          <div
            ref={scrollContainerRef}
            style={{ 
              overflowX: 'auto',
              overflowY: 'visible',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              scrollPadding: 'calc(50% - 140px)',
              width: '100%',
              padding: '16px 0'
            }}
          >
            <div 
              className="flex gap-3" 
              style={{ 
                display: 'flex',
                paddingLeft: 'calc(50% - 140px)',
                paddingRight: 'calc(50% - 140px)',
                width: 'fit-content',
                minWidth: '100%'
              }}
            >
              {displayDays.map((day, dayIndex) => {
                const isToday = day.day === todayName && 
                  day.date.toDateString() === today.toDateString();
                const isCentered = dayIndex === centeredCardIndex;
                
                // Determine week offset for this day
                const weekOffset = day.date > new Date(thisWeekPlan?.weekEndDate || 0) ? 1 : 0;
                
                // Get translated day names array to find the index
                const translatedDayNames = getTranslatedDayNames(t);
                // Find the index by matching the translated day name, then use English name for operations
                const dayOfWeekIndex = translatedDayNames.indexOf(day.day);
                const englishDayName = englishDayNames[dayOfWeekIndex];
                
                return (
                  <Card 
                    key={`${day.day}-${day.date.toDateString()}`}
                    className="flex-shrink-0 transition-all duration-300"
                    style={{ 
                      width: '280px',
                      scrollSnapAlign: 'center',
                      border: isToday && isCentered ? '2px solid var(--primary)' : undefined,
                      opacity: isCentered ? 1 : 0.4,
                      transform: isCentered ? 'scale(1)' : 'scale(0.95)'
                    }}
                  >
                    {/* Meals */}
                    <CardContent className="pt-6 space-y-3 pb-6">
                      {isEditing ? (
                        <>
                          {/* Edit Mode: Show full controls */}
                          <MealRowEditable
                            icon="🍳"
                            label={t('sections.breakfast')}
                            recipes={day.breakfast}
                            quickFoods={day.breakfastQuickFoods}
                            quickAddOnsLabel={t('sections.quickAddOns')}
                            addRecipeLabel={t('actions.addRecipe')}
                            addQuickFoodLabel={t('actions.addQuickFood')}
                            onAdd={() => setAddingMeal({ weekOffset, dayIndex: dayOfWeekIndex, mealType: 'Breakfast' })}
                            onAddQuickFood={() => setAddingQuickFood({ weekOffset, dayIndex: dayOfWeekIndex, mealType: 'Breakfast' })}
                            onRemove={(index) => handleRemoveRecipe(weekOffset, dayOfWeekIndex, 'Breakfast', index)}
                            onRemoveQuickFood={(index) => handleRemoveQuickFood(weekOffset, dayOfWeekIndex, 'Breakfast', index)}
                          />
                          <MealRowEditable
                            icon="☀️"
                            label={t('sections.lunch')}
                            recipes={day.lunch}
                            quickFoods={day.lunchQuickFoods}
                            quickAddOnsLabel={t('sections.quickAddOns')}
                            addRecipeLabel={t('actions.addRecipe')}
                            addQuickFoodLabel={t('actions.addQuickFood')}
                            onAdd={() => setAddingMeal({ weekOffset, dayIndex: dayOfWeekIndex, mealType: 'Lunch' })}
                            onAddQuickFood={() => setAddingQuickFood({ weekOffset, dayIndex: dayOfWeekIndex, mealType: 'Lunch' })}
                            onRemove={(index) => handleRemoveRecipe(weekOffset, dayOfWeekIndex, 'Lunch', index)}
                            onRemoveQuickFood={(index) => handleRemoveQuickFood(weekOffset, dayOfWeekIndex, 'Lunch', index)}
                          />
                          <MealRowEditable
                            icon="🌙"
                            label={t('sections.dinner')}
                            recipes={day.dinner}
                            quickFoods={day.dinnerQuickFoods}
                            quickAddOnsLabel={t('sections.quickAddOns')}
                            addRecipeLabel={t('actions.addRecipe')}
                            addQuickFoodLabel={t('actions.addQuickFood')}
                            onAdd={() => setAddingMeal({ weekOffset, dayIndex: dayOfWeekIndex, mealType: 'Dinner' })}
                            onAddQuickFood={() => setAddingQuickFood({ weekOffset, dayIndex: dayOfWeekIndex, mealType: 'Dinner' })}
                            onRemove={(index) => handleRemoveRecipe(weekOffset, dayOfWeekIndex, 'Dinner', index)}
                            onRemoveQuickFood={(index) => handleRemoveQuickFood(weekOffset, dayOfWeekIndex, 'Dinner', index)}
                          />
                        </>
                      ) : (
                        <>
                          {/* View Mode: Clean read-only display */}
                          <MealRowReadOnly icon="🍳" label={t('sections.breakfast')} recipes={enrichRecipeData(day.breakfast)} quickFoods={day.breakfastQuickFoods} quickAddOnsLabel={t('sections.quickAddOns')} onRecipeClick={handleRecipeClick} />
                          <MealRowReadOnly icon="☀️" label={t('sections.lunch')} recipes={enrichRecipeData(day.lunch)} quickFoods={day.lunchQuickFoods} quickAddOnsLabel={t('sections.quickAddOns')} onRecipeClick={handleRecipeClick} />
                          <MealRowReadOnly icon="🌙" label={t('sections.dinner')} recipes={enrichRecipeData(day.dinner)} quickFoods={day.dinnerQuickFoods} quickAddOnsLabel={t('sections.quickAddOns')} onRecipeClick={handleRecipeClick} />
                        </>
                      )}
          </CardContent>
        </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Recipe Picker Modal */}
      {addingMeal && (
        <Dialog open={!!addingMeal} onOpenChange={() => {
          setAddingMeal(null);
          setSearchQuery('');
        }}>
          <DialogContent className="max-w-md p-6 gap-4" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <DialogHeader>
              <DialogTitle>Add Recipe to {addingMeal.mealType}</DialogTitle>
            </DialogHeader>

            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />

            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                setPendingMealType(addingMeal.mealType as RecipeCategory);
                setAddingMeal(null);
                setIsAddRecipeModalOpen(true);
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Recipe
            </Button>

            <div style={{ 
              overflowY: 'scroll', 
              WebkitOverflowScrolling: 'touch',
              flex: 1,
              minHeight: 0
            }}>
              <div className="space-y-2">
                {getFilteredRecipes(addingMeal.mealType).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recipes found
                  </p>
                ) : (
                  getFilteredRecipes(addingMeal.mealType).map(recipe => (
                    <Card
                      key={recipe.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleSelectRecipe(addingMeal.weekOffset, addingMeal.dayIndex, addingMeal.mealType, recipe)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {recipe.image ? (
                            <img 
                              src={recipe.image} 
                              alt={getRecipeDisplayName(recipe)}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                              <span className="text-lg">🍽️</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{getRecipeDisplayName(recipe)}</p>
                            <p className="text-xs text-muted-foreground">
                              {recipe.caloriesPerServing} cal
                            </p>
                          </div>
              </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Food Picker Modal */}
      {addingQuickFood && (
        <Dialog open={!!addingQuickFood} onOpenChange={() => {
          setAddingQuickFood(null);
          setSelectedQuickFoodCategory(null);
        }}>
          <DialogContent className="max-w-md p-6 gap-4" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <DialogHeader>
              <DialogTitle>
                {!selectedQuickFoodCategory 
                  ? `Add Quick Food to ${addingQuickFood.mealType}`
                  : quickFoodCategories.find(c => c.categoryKey === selectedQuickFoodCategory)?.name || selectedQuickFoodCategory
                }
              </DialogTitle>
            </DialogHeader>

            {selectedQuickFoodCategory && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedQuickFoodCategory(null)}
                className="w-full"
              >
                ← Back to Categories
              </Button>
            )}

            <div style={{ 
              overflowY: 'scroll', 
              WebkitOverflowScrolling: 'touch',
              flex: 1,
              minHeight: 0
            }}>
              {!selectedQuickFoodCategory && (
                <div className="grid grid-cols-2 gap-3">
                  {quickFoodCategories.map(category => (
                    <Card
                      key={category.name}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedQuickFoodCategory(category.categoryKey)}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <span className="text-4xl">{category.emoji}</span>
                        <p className="font-medium text-sm">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.count} items</p>
            </CardContent>
          </Card>
                  ))}
                </div>
              )}

              {selectedQuickFoodCategory && (
                <div className="space-y-2">
                  {getQuickFoodsByCategory(selectedQuickFoodCategory).map(food => (
                    <Card
                      key={food.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleAddQuickFood(food)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{food.emoji}</span>
                          <div>
                            <p className="font-medium text-sm">{food.nameTranslated || food.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {food.servingSizeTranslated || food.servingSize} • {food.calories} cal
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
            </CardContent>
          </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.resetDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              {t('actions.resetAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Read-only meal row component
interface MealRowReadOnlyProps {
  icon: string;
  label: string;
  recipes: Recipe[];
  quickFoods?: QuickFood[];
  quickAddOnsLabel: string;
  onRecipeClick?: (recipe: Recipe) => void;
}

function MealRowReadOnly({ icon, label, recipes, quickFoods = [], quickAddOnsLabel, onRecipeClick }: MealRowReadOnlyProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0 px-2">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      
      <div className="space-y-2">
        {recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recipes</p>
        ) : (
          recipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onRecipeClick?.(recipe)}
            >
              {recipe.image ? (
                <img 
                  src={recipe.image} 
                  alt={getRecipeDisplayName(recipe)}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🍽️</span>
                </div>
              )}
              <span className="text-sm">• {getRecipeDisplayName(recipe)}</span>
            </div>
          ))
        )}
        
        {quickFoods.length > 0 && (
          <div className="pl-4 space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">{quickAddOnsLabel}</p>
            {quickFoods.map((food, index) => (
              <div key={`${food.id}-${index}`} className="text-xs text-muted-foreground">
                {food.emoji} {food.nameTranslated || food.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Editable meal row component
interface MealRowEditableProps {
  icon: string;
  label: string;
  recipes: Recipe[];
  quickFoods?: QuickFood[];
  quickAddOnsLabel: string;
  addRecipeLabel: string;
  addQuickFoodLabel: string;
  onAdd: () => void;
  onAddQuickFood: () => void;
  onRemove: (index: number) => void;
  onRemoveQuickFood: (index: number) => void;
}

function MealRowEditable({ icon, label, recipes, quickFoods = [], quickAddOnsLabel, addRecipeLabel, addQuickFoodLabel, onAdd, onAddQuickFood, onRemove, onRemoveQuickFood }: MealRowEditableProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0 px-2">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      
      <div className="space-y-2">
        <div className="space-y-2">
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipes</p>
          ) : (
            recipes.map((recipe, index) => (
              <div key={recipe.id} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded">
                <div className="flex items-center gap-2 flex-1">
                  {recipe.image ? (
                    <img 
                      src={recipe.image} 
                      alt={recipe.name}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🍽️</span>
                    </div>
                  )}
                  <span className="text-sm">• {recipe.name}</span>
                </div>
                <button
                  className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                  onClick={() => onRemove(index)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
          
          <button
            className="w-full py-1 px-2 border border-gray-200 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
            onClick={onAdd}
          >
            <Plus className="w-3 h-3" />
            {addRecipeLabel}
          </button>
        </div>
        
        {quickFoods.length > 0 && (
          <div className="pl-4 space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">{quickAddOnsLabel}</p>
            {quickFoods.map((food, index) => (
              <div key={`${food.id}-${index}`} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{food.emoji} {food.nameTranslated || food.name}</span>
                <button
                  className="h-6 w-6 p-0 hover:bg-gray-200 rounded"
                  onClick={() => onRemoveQuickFood(index)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button
          className="w-full py-1 px-2 border border-gray-200 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
          onClick={onAddQuickFood}
        >
          <Plus className="w-3 h-3" />
          {addQuickFoodLabel}
        </button>
      </div>
    </div>
  );
}
