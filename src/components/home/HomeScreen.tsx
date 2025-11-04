import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Edit, Save, X, Plus, Sparkles, RotateCcw, PlusCircle } from 'lucide-react';
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
import { Recipe, RecipeCategory, QuickFood } from '../../types';
import { defaultQuickFoods } from '../../data/quickFoods';

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

export function HomeScreen() {
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
  } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('3-day');
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
  
  // Get the days to display based on view mode and edit state
  const getDisplayDays = (): DayMealPlan[] => {
    if (isEditing) {
      // Edit mode: show from today to next Sunday (up to 14 days)
      const days: DayMealPlan[] = [];
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Start from today and go until next Sunday
      let currentDate = new Date(today);
      let daysUntilNextSunday = (7 - todayDayOfWeek) % 7;
      if (daysUntilNextSunday === 0) daysUntilNextSunday = 7; // If today is Sunday, go to next Sunday
      
      for (let i = 0; i <= daysUntilNextSunday + 7; i++) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dayIndex = dayNames.indexOf(dayName);
        
        // Determine if this date is in this week or next week
        const isNextWeek = date > new Date(thisWeekPlan?.weekEndDate || 0);
        const weekPlan = isNextWeek ? (editedPlans?.nextWeek || []) : (editedPlans?.thisWeek || []);
        const dayPlan = weekPlan[dayIndex];
        
        if (dayPlan) {
          days.push({ ...dayPlan, date });
        }
      }
      
      return days;
    } else if (viewMode === 'full-week') {
      // Full week view: show Monday-Sunday of current week
      const days: DayMealPlan[] = [];
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      dayNames.forEach((dayName, index) => {
        const dayPlan = getDayPlanFromWeek(thisWeekPlan, dayName);
        if (dayPlan) {
          // Calculate actual date for this day
          const date = new Date(today);
          const currentDayIndex = (todayDayOfWeek + 6) % 7; // Convert Sunday=0 to Monday=0
          const dayOffset = index - currentDayIndex;
          date.setDate(today.getDate() + dayOffset);
          days.push({ ...dayPlan, date });
        }
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
  
  // Scroll to today on mount and update centered card on scroll
  useEffect(() => {
    if (scrollContainerRef.current && todayIndex !== -1) {
      // Scroll to today's card (centered)
      const container = scrollContainerRef.current;
      const cardWidth = 280;
      const gap = 12;
      const scrollTo = (cardWidth + gap) * todayIndex;
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        container.scrollLeft = scrollTo;
        setCenteredCardIndex(todayIndex);
      }, 100);
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
      const centeredIndex = Math.round(scrollLeft / (cardWidth + gap));
      setCenteredCardIndex(centeredIndex);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [displayDays]);
  
  // Initialize edited plans when entering edit mode
  const handleEnterEditMode = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Initialize this week's plan
    const thisWeek: DayMealPlan[] = dayNames.map((dayName, index) => {
      const dayPlan = getDayPlanFromWeek(thisWeekPlan, dayName);
      if (dayPlan) return dayPlan;
      
      const date = new Date(today);
      const currentDayIndex = (todayDayOfWeek + 6) % 7;
      const dayOffset = index - currentDayIndex;
      date.setDate(today.getDate() + dayOffset);
      
      return {
        day: dayName,
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
    const nextWeek: DayMealPlan[] = dayNames.map((dayName, index) => {
      const dayPlan = getDayPlanFromWeek(nextWeekPlan, dayName);
      if (dayPlan) return dayPlan;
      
      const date = new Date(today);
      const currentDayIndex = (todayDayOfWeek + 6) % 7;
      const dayOffset = index - currentDayIndex + 7;
      date.setDate(today.getDate() + dayOffset);
      
      return {
        day: dayName,
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
  
  // Save edited plans
  const handleSave = async () => {
    if (!editedPlans) return;
    
    try {
      // Save this week's plan
      if (thisWeekPlan) {
        const updatedThisWeek = {
          ...thisWeekPlan,
          days: editedPlans.thisWeek.map(day => ({
            day: day.day,
            breakfast: day.breakfast.map(r => ({ id: r.id, name: r.name, image: r.image, caloriesPerServing: r.caloriesPerServing })) as any,
            lunch: day.lunch.map(r => ({ id: r.id, name: r.name, image: r.image, caloriesPerServing: r.caloriesPerServing })) as any,
            dinner: day.dinner.map(r => ({ id: r.id, name: r.name, image: r.image, caloriesPerServing: r.caloriesPerServing })) as any,
            snacks: [] as any[],
            breakfastQuickFoods: day.breakfastQuickFoods,
            lunchQuickFoods: day.lunchQuickFoods,
            dinnerQuickFoods: day.dinnerQuickFoods
          })),
        };
        await saveMealPlan(updatedThisWeek);
      }
      
      // Save next week's plan (if it has content)
      const hasNextWeekContent = editedPlans.nextWeek.some(day => 
        day.breakfast.length > 0 || day.lunch.length > 0 || day.dinner.length > 0
      );
      
      if (hasNextWeekContent) {
        // Calculate next week dates
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() - todayDayOfWeek + 8); // Next Monday
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        
        const updatedNextWeek = {
          ...(nextWeekPlan || {}),
          id: nextWeekPlan?.id,
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
            breakfastQuickFoods: day.breakfastQuickFoods,
            lunchQuickFoods: day.lunchQuickFoods,
            dinnerQuickFoods: day.dinnerQuickFoods
          })),
          shoppingList: nextWeekPlan?.shoppingList || [],
        };
        await saveMealPlan(updatedNextWeek as any);
      }
      
      setIsEditing(false);
      setEditedPlans(null);
      alert('Saved successfully!');
    } catch (error) {
      console.error('Error saving plans:', error);
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
  
  // Get filtered recipes
  const getFilteredRecipes = (mealType: MealType) => {
    return recipes.filter(recipe => {
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
      
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1>Hi {userProfile?.name || 'there'}!</h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Editing your meal plan' : 'Your meal plan at a glance'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <UserButton />
                <button
                  onClick={handleEnterEditMode}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Date display */}
        <div className="text-center">
          <p className="text-lg font-medium">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* View mode toggle + edit controls */}
        {!isEditing && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode(viewMode === '3-day' ? 'full-week' : '3-day')}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
            >
              {viewMode === '3-day' ? 'Show Full Week' : 'Show 3 Days'}
            </button>
            
            {/* Special case: Sunday with no next week plan */}
            {todayDayOfWeek === 0 && !hasNextWeekPlan && (
              <button
                onClick={handleEnterEditMode}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Plan Next Week
              </button>
            )}
          </div>
        )}

        {/* Edit mode controls */}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Auto-Fill
            </button>
            <button
              onClick={() => setIsResetDialogOpen(true)}
              className="flex-1 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        )}

        {/* Horizontal Scrollable Day Cards */}
        <div 
          style={{ 
            overflow: 'hidden',
            width: '100%',
            position: 'relative'
          }}
        >
          <div
            ref={scrollContainerRef}
            className="overflow-x-scroll overflow-y-visible pb-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              scrollPadding: 'calc(50% - 140px)', // Center the snapped card
              width: '100%',
              overflowX: 'scroll',
              overflowY: 'visible'
            }}
          >
            <div 
              className="flex gap-3 p-3" 
              style={{ 
                display: 'inline-flex',
                paddingLeft: 'calc(50% - 140px)', // Offset first card to center
                paddingRight: 'calc(50% - 140px)' // Offset last card to center
              }}
            >
              {displayDays.map((day, dayIndex) => {
                const isToday = day.day === todayName && 
                  day.date.toDateString() === today.toDateString();
                const isCentered = dayIndex === centeredCardIndex;
                
                // Determine week offset for this day
                const weekOffset = day.date > new Date(thisWeekPlan?.weekEndDate || 0) ? 1 : 0;
                
                return (
                  <Card 
                    key={`${day.day}-${day.date.toDateString()}`}
                    className="flex-shrink-0 overflow-hidden transition-all duration-300"
                    style={{ 
                      width: '280px',
                      scrollSnapAlign: 'center',
                      border: isToday && isCentered ? '2px solid var(--primary)' : undefined,
                      opacity: isCentered ? 1 : 0.4,
                      transform: isCentered ? 'scale(1)' : 'scale(0.95)'
                    }}
                  >
                    {/* Day Header */}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-center">
                        <div className="text-lg font-bold">
                          {day.day}
                          {isToday && ' 🌟'}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </CardTitle>
                    </CardHeader>

                    {/* Meals */}
                    <CardContent className="pt-0 space-y-3">
                      {isEditing ? (
                        <>
                          {/* Edit Mode: Show full controls */}
                          <MealRowEditable
                            icon="🍳"
                            label="Breakfast"
                            recipes={day.breakfast}
                            quickFoods={day.breakfastQuickFoods}
                            onAdd={() => setAddingMeal({ weekOffset, dayIndex: dayNames.indexOf(day.day), mealType: 'Breakfast' })}
                            onAddQuickFood={() => setAddingQuickFood({ weekOffset, dayIndex: dayNames.indexOf(day.day), mealType: 'Breakfast' })}
                            onRemove={(index) => handleRemoveRecipe(weekOffset, dayNames.indexOf(day.day), 'Breakfast', index)}
                            onRemoveQuickFood={(index) => handleRemoveQuickFood(weekOffset, dayNames.indexOf(day.day), 'Breakfast', index)}
                          />
                          <MealRowEditable
                            icon="☀️"
                            label="Lunch"
                            recipes={day.lunch}
                            quickFoods={day.lunchQuickFoods}
                            onAdd={() => setAddingMeal({ weekOffset, dayIndex: dayNames.indexOf(day.day), mealType: 'Lunch' })}
                            onAddQuickFood={() => setAddingQuickFood({ weekOffset, dayIndex: dayNames.indexOf(day.day), mealType: 'Lunch' })}
                            onRemove={(index) => handleRemoveRecipe(weekOffset, dayNames.indexOf(day.day), 'Lunch', index)}
                            onRemoveQuickFood={(index) => handleRemoveQuickFood(weekOffset, dayNames.indexOf(day.day), 'Lunch', index)}
                          />
                          <MealRowEditable
                            icon="🌙"
                            label="Dinner"
                            recipes={day.dinner}
                            quickFoods={day.dinnerQuickFoods}
                            onAdd={() => setAddingMeal({ weekOffset, dayIndex: dayNames.indexOf(day.day), mealType: 'Dinner' })}
                            onAddQuickFood={() => setAddingQuickFood({ weekOffset, dayIndex: dayNames.indexOf(day.day), mealType: 'Dinner' })}
                            onRemove={(index) => handleRemoveRecipe(weekOffset, dayNames.indexOf(day.day), 'Dinner', index)}
                            onRemoveQuickFood={(index) => handleRemoveQuickFood(weekOffset, dayNames.indexOf(day.day), 'Dinner', index)}
                          />
                        </>
                      ) : (
                        <>
                          {/* View Mode: Clean read-only display */}
                          <MealRowReadOnly icon="🍳" label="Breakfast" recipes={day.breakfast} quickFoods={day.breakfastQuickFoods} />
                          <MealRowReadOnly icon="☀️" label="Lunch" recipes={day.lunch} quickFoods={day.lunchQuickFoods} />
                          <MealRowReadOnly icon="🌙" label="Dinner" recipes={day.dinner} quickFoods={day.dinnerQuickFoods} />
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
                              alt={recipe.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                              <span className="text-lg">🍽️</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{recipe.name}</p>
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
                            <p className="font-medium text-sm">{food.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {food.servingSize} • {food.calories} cal
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
            <AlertDialogTitle>Reset All Meal Plans?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all meals from this week and next week's plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Reset All
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
}

function MealRowReadOnly({ icon, label, recipes, quickFoods = [] }: MealRowReadOnlyProps) {
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
            <div key={recipe.id} className="flex items-center gap-2 p-2 rounded">
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
          ))
        )}
        
        {quickFoods.length > 0 && (
          <div className="pl-4 space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Quick Add-ons:</p>
            {quickFoods.map((food, index) => (
              <div key={`${food.id}-${index}`} className="text-xs text-muted-foreground">
                {food.emoji} {food.name}
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
  onAdd: () => void;
  onAddQuickFood: () => void;
  onRemove: (index: number) => void;
  onRemoveQuickFood: (index: number) => void;
}

function MealRowEditable({ icon, label, recipes, quickFoods = [], onAdd, onAddQuickFood, onRemove, onRemoveQuickFood }: MealRowEditableProps) {
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
            Add Recipe
          </button>
        </div>
        
        {quickFoods.length > 0 && (
          <div className="pl-4 space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Quick Add-ons:</p>
            {quickFoods.map((food, index) => (
              <div key={`${food.id}-${index}`} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{food.emoji} {food.name}</span>
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
          Add Quick Food
        </button>
      </div>
    </div>
  );
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
