import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { Plus, Calendar, Sparkles, RefreshCw, Save, RotateCcw, X, PlusCircle } from 'lucide-react';
import { Recipe, RecipeCategory, ShoppingItem, QuickFood } from '../../types';
import { cleanIngredientNames } from '../../utils/geminiRecipeParser';
import { defaultQuickFoods } from '../../data/quickFoods';
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

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

interface DayMealPlan {
  day: string;
  date: Date;
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
  snacks: Recipe[];
  breakfastQuickFoods: QuickFood[];
  lunchQuickFoods: QuickFood[];
  dinnerQuickFoods: QuickFood[];
}

// Helper to get random quick foods for a meal
const getRandomQuickFoods = (count: number): QuickFood[] => {
  const shuffled = [...defaultQuickFoods].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export function WeeklyPlanScreen() {
  const { 
    recipes, 
    setIsAddRecipeModalOpen, 
    setDraftRecipe, 
    setPendingMealType, 
    shoppingList, 
    setShoppingList, 
    setCurrentScreen, 
    currentWeeklyPlan, 
    setCurrentWeeklyPlan, 
    saveMealPlan,
    planningWeekOffset,
    getWeekStart,
    getWeekEnd,
    formatWeekLabel,
    getThisWeekPlan,
    getNextWeekPlan
  } = useApp();
  
  // Scroll to top immediately when component mounts or planningWeekOffset changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [planningWeekOffset]);
  
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [addingQuickFood, setAddingQuickFood] = useState<{ dayIndex: number; mealType: MealType } | null>(null);
  const [selectedQuickFoodCategory, setSelectedQuickFoodCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize 7 days starting from today, or load from saved plan
  const [weekPlan, setWeekPlan] = useState<DayMealPlan[]>(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    
    // Get the appropriate plan based on planningWeekOffset
    const targetPlan = planningWeekOffset === 0 ? getThisWeekPlan() : getNextWeekPlan();
    
    // If there's a saved plan for the target week, load it
    if (targetPlan) {
      return targetPlan.days.map((day, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + 1 + index + (planningWeekOffset * 7));
        return {
          day: days[index],
          date,
          breakfast: Array.isArray(day.breakfast) ? day.breakfast : [],
          lunch: Array.isArray(day.lunch) ? day.lunch : [],
          dinner: Array.isArray(day.dinner) ? day.dinner : [],
          snacks: Array.isArray(day.snacks) ? day.snacks : [],
          breakfastQuickFoods: day.breakfastQuickFoods || [],
          lunchQuickFoods: day.lunchQuickFoods || [],
          dinnerQuickFoods: day.dinnerQuickFoods || []
        };
      });
    }
    
    // Otherwise create empty plan
    return days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + index + (planningWeekOffset * 7)); // Start from Monday + offset
      return {
        day,
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        breakfastQuickFoods: [],
        lunchQuickFoods: [],
        dinnerQuickFoods: []
      };
    });
  });
  
  const [addingMeal, setAddingMeal] = useState<{ dayIndex: number; mealType: MealType } | null>(null);
  
  // Get recipes by category
  const getRecipesByMealType = (mealType: MealType): Recipe[] => {
    const mealTypeFilter = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    
    return recipes.filter(recipe => {
      // Check new mealTypes array first, fall back to mealType, then legacy categories
      return recipe.mealTypes?.some(mt => mt.toLowerCase() === mealTypeFilter.toLowerCase()) ||
        (recipe.mealType && recipe.mealType.toLowerCase() === mealTypeFilter.toLowerCase()) ||
        (recipe.categories && recipe.categories.includes(mealType as RecipeCategory));
    });
  };
  
  // Reset the entire weekly plan
  const handleResetWeeklyPlan = async () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    
    const emptyPlan = days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + index + (planningWeekOffset * 7));
      return {
        day,
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        breakfastQuickFoods: [],
        lunchQuickFoods: [],
        dinnerQuickFoods: []
      };
    });
    
    setWeekPlan(emptyPlan);
    setIsResetDialogOpen(false);
    
    // Auto-save the empty plan
    // We'll trigger save after a brief delay to let state update
    setTimeout(() => {
      handleSaveMealPlan(true); // silent save
    }, 100);
  };

  // Auto-fill entire week with random recipes (one recipe per meal)
  const handleAutoFillWeek = () => {
    const breakfastRecipes = getRecipesByMealType('Breakfast');
    const lunchRecipes = getRecipesByMealType('Lunch');
    const dinnerRecipes = getRecipesByMealType('Dinner');
    
    setWeekPlan(prev => prev.map(day => ({
      ...day,
      breakfast: breakfastRecipes.length > 0 
        ? [breakfastRecipes[Math.floor(Math.random() * breakfastRecipes.length)]] 
        : [],
      lunch: lunchRecipes.length > 0 
        ? [lunchRecipes[Math.floor(Math.random() * lunchRecipes.length)]] 
        : [],
      dinner: dinnerRecipes.length > 0 
        ? [dinnerRecipes[Math.floor(Math.random() * dinnerRecipes.length)]] 
        : [],
      breakfastQuickFoods: getRandomQuickFoods(2),
      lunchQuickFoods: getRandomQuickFoods(2),
      dinnerQuickFoods: getRandomQuickFoods(2)
    })));
  };
  
  // Randomly pick another recipe for a specific meal slot
  const handleRandomPick = (dayIndex: number, mealType: MealType) => {
    const availableRecipes = getRecipesByMealType(mealType);
    
    if (availableRecipes.length === 0) return;
    
    // Get current recipe to avoid picking the same one
    const currentRecipe = weekPlan[dayIndex][mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner'];
    
    // Filter out current recipe if it exists
    const filteredRecipes = currentRecipe 
      ? availableRecipes.filter(r => r.id !== currentRecipe.id)
      : availableRecipes;
    
    if (filteredRecipes.length === 0) {
      // If no other options, just re-pick from all
      const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
      handleSelectRecipe(dayIndex, mealType, randomRecipe);
    } else {
      const randomRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)];
      handleSelectRecipe(dayIndex, mealType, randomRecipe);
    }
  };
  
  // Extract base ingredient name (remove processing details)
  const extractBaseIngredient = (ingredientName: string): string => {
    let cleaned = ingredientName.toLowerCase().trim();
    
    // Remove common processing words/phrases
    const processingWords = [
      'minced', 'diced', 'chopped', 'sliced', 'crushed', 'grated', 'shredded',
      'peeled', 'cubed', 'julienned', 'fresh', 'dried', 'frozen', 'canned',
      'cooked', 'raw', 'whole', 'halved', 'quartered', 'ground', 'smashed',
      'thinly sliced', 'finely chopped', 'roughly chopped', 'finely diced',
      'large', 'medium', 'small', 'baby', 'young', 'mature',
      'boneless', 'skinless', 'bone-in', 'skin-on'
    ];
    
    // Remove processing words
    processingWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '').trim();
    });
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };
  
  // Generate shopping list from weekly meal plan
  // Save meal plan (also called after any change)
  const handleSaveMealPlan = async (silent = false) => {
    try {
      // Calculate week start and end dates based on the planningWeekOffset
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (planningWeekOffset * 7)); // Add 7 days for next week
      
      const weekStartDate = getWeekStart(targetDate);
      const weekEndDate = getWeekEnd(targetDate);
      const weekLabel = formatWeekLabel(weekStartDate, weekEndDate);
      
      // Get the existing plan for this week (if any) to preserve its ID
      const existingPlan = planningWeekOffset === 0 ? getThisWeekPlan() : getNextWeekPlan();
      
      // Convert to WeeklyPlan format (without shopping list first for immediate save)
      const weeklyPlan = {
        ...(existingPlan?.id && { id: existingPlan.id }), // Include ID if updating existing plan
        cuisine: 'Mixed',
        weekStartDate,
        weekEndDate,
        weekLabel,
        days: weekPlan.map(day => ({
          day: day.day,
          breakfast: day.breakfast as any,
          lunch: day.lunch as any,
          dinner: day.dinner as any,
          snacks: day.snacks as any[],
          breakfastQuickFoods: day.breakfastQuickFoods,
          lunchQuickFoods: day.lunchQuickFoods,
          dinnerQuickFoods: day.dinnerQuickFoods
        })),
        shoppingList: existingPlan?.shoppingList || [], // Keep existing shopping list or empty
        ...(existingPlan?.createdAt && { createdAt: existingPlan.createdAt }),
        ...(existingPlan?.userId && { userId: existingPlan.userId }),
      };
      
      // Save to Firebase IMMEDIATELY
      const savedPlanId = await saveMealPlan(weeklyPlan as any);
      console.log('✅ Meal plan saved immediately:', savedPlanId);
      
      // Show success immediately
      if (!silent) {
        alert('Successfully saved!');
        // Navigate to home page to see the saved plan
        setCurrentScreen('home');
      }
      
      // Generate and clean shopping list with AI in the BACKGROUND
      console.log('🛒 Generating shopping list with AI in background...');
      generateAndCleanShoppingList()
        .then(async (cleanedShoppingList) => {
          console.log('✅ Shopping list generated:', cleanedShoppingList.length, 'items', cleanedShoppingList);
          
          // Update the saved plan with the shopping list
          const updatedPlan = {
            ...weeklyPlan,
            id: savedPlanId || existingPlan?.id,
            shoppingList: cleanedShoppingList,
          };
          
          await saveMealPlan(updatedPlan as any);
          setShoppingList(cleanedShoppingList);
          console.log('✅ Shopping list saved to plan');
        })
        .catch((error) => {
          console.error('❌ Failed to generate shopping list:', error);
        });
        
    } catch (error) {
      console.error('Error saving meal plan:', error);
      if (!silent) {
        alert('Failed to save meal plan. Please try again.');
      }
    }
  };
  
  // Generate shopping list and clean with AI
  const generateAndCleanShoppingList = async (): Promise<ShoppingItem[]> => {
    const ingredientMap = new Map<string, { original: string; category: string }>();
    const quickFoodMap = new Map<string, QuickFood>();
    
    // Collect all unique ingredients from planned meals
    console.log('🔍 Collecting ingredients from weekPlan:', weekPlan);
    
    weekPlan.forEach((day, dayIndex) => {
      const allRecipes = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks];
      console.log(`  ${day.day}: ${allRecipes.length} recipes`);
      
      allRecipes.forEach((recipe, recipeIndex) => {
        if (!recipe) {
          console.log(`    Recipe ${recipeIndex} is null/undefined`);
          return;
        }
        
        console.log(`    Recipe: ${recipe.name}, ingredients: ${recipe.ingredients?.length || 0}`);
        
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
          console.log(`    ⚠️ Recipe "${recipe.name}" has no ingredients!`);
          return;
        }
        
        recipe.ingredients.forEach(ingredient => {
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
      
      console.log(`  Quick foods for ${day.day}:`, {
        breakfast: day.breakfastQuickFoods?.length || 0,
        lunch: day.lunchQuickFoods?.length || 0,
        dinner: day.dinnerQuickFoods?.length || 0,
        total: allQuickFoods.length,
        items: allQuickFoods.map(f => f.name)
      });
      
      allQuickFoods.forEach(food => {
        const key = food.name.toLowerCase().trim();
        if (!quickFoodMap.has(key)) {
          quickFoodMap.set(key, food);
        }
      });
    });
    
    // Get all unique ingredient names
    const ingredientNames = Array.from(ingredientMap.values()).map(v => v.original);
    const quickFoods = Array.from(quickFoodMap.values());
    
    console.log('📊 Total unique ingredients collected:', ingredientNames.length, ingredientNames);
    console.log('🍎 Total unique quick foods collected:', quickFoods.length, quickFoods.map(f => f.name));
    
    if (ingredientNames.length === 0 && quickFoods.length === 0) {
      console.log('⚠️ No ingredients or quick foods found in meal plan!');
      return [];
    }
    
    // Clean ingredient names using AI
    console.log('🤖 Sending', ingredientNames.length, 'ingredients to AI for cleaning...');
    const cleanedNames = ingredientNames.length > 0 ? await cleanIngredientNames(ingredientNames) : [];
    console.log('✨ AI cleaned names:', cleanedNames);
    
    // Create shopping list with cleaned ingredient names (deduplicated and capitalized)
    const itemMap = new Map<string, { category: string }>();
    
    cleanedNames.forEach((cleanedName, index) => {
      const originalData = Array.from(ingredientMap.values())[index];
      // Normalize to lowercase for deduplication
      const normalizedName = cleanedName.toLowerCase().trim();
      
      // Only add if not already in map
      if (!itemMap.has(normalizedName)) {
        itemMap.set(normalizedName, { category: originalData.category });
      }
    });
    
    // Create shopping list from deduplicated items
    const newShoppingList: ShoppingItem[] = Array.from(itemMap.entries()).map(([name, data], index) => {
      // Capitalize first letter of each word
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
      
      // Check if this quick food is already in the shopping list
      const existingItem = newShoppingList.find(item => 
        item.name.toLowerCase().trim() === normalizedFoodName
      );
      
      // Only add if not already present
      if (!existingItem) {
        let category: 'produce' | 'meat' | 'dairy' | 'pantry' = 'pantry';
        if (food.category === 'fruit' || food.category === 'veggie') {
          category = 'produce';
        } else if (food.category === 'dairy') {
          category = 'dairy';
        } else if (food.category === 'protein') {
          category = 'meat';
        } else {
          // Grains, snacks, drinks, and anything else → pantry
          category = 'pantry';
        }
        
        // Capitalize first letter of each word
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
    
    console.log('📝 Final shopping list (ingredients + quick foods):', newShoppingList);
    return newShoppingList;
  };
  
  // Update shopping list while preserving checked items
  const updateShoppingListFromPlan = () => {
    const ingredientMap = new Map<string, string>();
    
    // Collect all unique ingredients from planned meals
    weekPlan.forEach(day => {
      // Flatten all recipe arrays into a single array
      [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].forEach(recipe => {
        if (!recipe) return;
        
        recipe.ingredients.forEach(ingredient => {
          // Extract base ingredient name
          const baseIngredient = extractBaseIngredient(ingredient.name);
          const key = baseIngredient.toLowerCase().trim();
          
          if (!ingredientMap.has(key)) {
            const category = categorizeIngredient(baseIngredient);
            ingredientMap.set(key, category);
          }
        });
      });
    });
    
    // Get currently checked items
    const checkedItems = new Set(
      shoppingList.filter(item => item.checked).map(item => item.name.toLowerCase().trim())
    );
    
    // Create new shopping list preserving checked status
    const newShoppingList: ShoppingItem[] = Array.from(ingredientMap.entries()).map(([name, category], index) => {
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
      return {
        id: `shopping-${index}`,
        name: capitalizedName,
        quantity: '',
        category: category as 'produce' | 'meat' | 'pantry' | 'dairy' | 'other',
        checked: checkedItems.has(name) // Preserve checked status
      };
    });
    
    setShoppingList(newShoppingList);
  };
  
  // Update shopping list with AI cleaning (called when meal plan is saved)
  const updateShoppingListWithAI = async () => {
    try {
      const ingredientMap = new Map<string, { original: string; category: string }>();
      
      // Collect all unique ingredients
      weekPlan.forEach(day => {
        [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].forEach(recipe => {
          if (!recipe) return;
          recipe.ingredients.forEach(ingredient => {
            const key = ingredient.name.toLowerCase().trim();
            if (!ingredientMap.has(key)) {
              ingredientMap.set(key, { 
                original: ingredient.name, 
                category: categorizeIngredient(ingredient.name) 
              });
            }
          });
        });
      });
      
      const ingredientNames = Array.from(ingredientMap.values()).map(v => v.original);
      console.log('🤖 AI cleaning', ingredientNames.length, 'ingredients after save...');
      const cleanedNames = await cleanIngredientNames(ingredientNames);
      
      // Preserve checked items
      const checkedItems = new Set(
        shoppingList.filter(item => item.checked).map(item => item.name.toLowerCase().trim())
      );
      
      const newShoppingList: ShoppingItem[] = cleanedNames.map((cleanedName, index) => {
        const originalData = Array.from(ingredientMap.values())[index];
        return {
          id: `shopping-${index}`,
          name: cleanedName,
          quantity: '',
          category: originalData.category as 'produce' | 'meat' | 'pantry' | 'dairy' | 'other',
          checked: checkedItems.has(cleanedName.toLowerCase().trim())
        };
      });
      
      setShoppingList(newShoppingList);
      console.log('✅ AI-cleaned shopping list with', newShoppingList.length, 'items');
    } catch (error) {
      console.error('❌ Error AI-cleaning shopping list:', error);
    }
  };
  
  // Simple ingredient categorization
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
  
  // Handle adding existing recipe to meal plan (adds to array)
  const handleSelectRecipe = (dayIndex: number, mealType: MealType, recipe: Recipe) => {
    setWeekPlan(prev => {
      const newPlan = [...prev];
      const mealTypeKey = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snacks';
      
      if (mealType === 'Snack') {
        newPlan[dayIndex].snacks = [...newPlan[dayIndex].snacks, recipe];
      } else {
        // Add recipe to the meal's array
        newPlan[dayIndex][mealTypeKey] = [...newPlan[dayIndex][mealTypeKey], recipe];
      }
      
      return newPlan;
    });
    setAddingMeal(null);
    
    // Auto-save after change
    setTimeout(() => handleSaveMealPlan(true), 100);
  };
  
  // Handle creating new recipe for this meal slot
  const handleCreateRecipe = (dayIndex: number, mealType: MealType) => {
    // Set the pending meal type so AddRecipeModal knows to auto-label
    setPendingMealType(mealType as RecipeCategory);
    
    // Close the selection modal
    setAddingMeal(null);
    
    // Open the Add Recipe modal (with image/URL/text options)
    setIsAddRecipeModalOpen(true);
  };
  
  // Handle removing recipe from slot (by recipe index in array)
  const handleRemoveRecipe = (dayIndex: number, mealType: MealType, recipeIndex: number) => {
    setWeekPlan(prev => {
      const newPlan = [...prev];
      const mealTypeKey = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snacks';
      
      // Remove the recipe at the specified index
      newPlan[dayIndex][mealTypeKey] = newPlan[dayIndex][mealTypeKey].filter((_, i) => i !== recipeIndex);
      
      return newPlan;
    });
    
    // Auto-save after change
    setTimeout(() => handleSaveMealPlan(true), 100);
  };
  
  const handleRemoveQuickFood = (dayIndex: number, mealType: MealType, quickFoodIndex: number) => {
    setWeekPlan(prev => {
      const newPlan = [...prev];
      const quickFoodKey = `${mealType.toLowerCase()}QuickFoods` as 'breakfastQuickFoods' | 'lunchQuickFoods' | 'dinnerQuickFoods';
      
      // Remove the quick food at the specified index
      newPlan[dayIndex][quickFoodKey] = newPlan[dayIndex][quickFoodKey]?.filter((_, i) => i !== quickFoodIndex) || [];
      
      return newPlan;
    });
    
    // Auto-save after change
    setTimeout(() => handleSaveMealPlan(true), 100);
  };
  
  // Add quick food to a meal
  const handleAddQuickFood = (food: QuickFood) => {
    if (!addingQuickFood) return;
    
    setWeekPlan(prev => {
      const newPlan = [...prev];
      const quickFoodKey = `${addingQuickFood.mealType.toLowerCase()}QuickFoods` as 'breakfastQuickFoods' | 'lunchQuickFoods' | 'dinnerQuickFoods';
      
      // Add the quick food
      newPlan[addingQuickFood.dayIndex][quickFoodKey] = [
        ...(newPlan[addingQuickFood.dayIndex][quickFoodKey] || []),
        food
      ];
      
      return newPlan;
    });
    
    // Close the picker
    setAddingQuickFood(null);
    setSelectedQuickFoodCategory(null);
    
    // Auto-save after change
    setTimeout(() => handleSaveMealPlan(true), 100);
  };
  
  // Quick food categories for picker
  const quickFoodCategories = [
    { name: 'Fruits', categoryKey: 'fruit', emoji: '🍎', count: defaultQuickFoods.filter(f => f.category === 'fruit').length },
    { name: 'Veggies', categoryKey: 'veggie', emoji: '🥕', count: defaultQuickFoods.filter(f => f.category === 'veggie').length },
    { name: 'Dairy', categoryKey: 'dairy', emoji: '🥛', count: defaultQuickFoods.filter(f => f.category === 'dairy').length },
    { name: 'Grains', categoryKey: 'grain', emoji: '🍞', count: defaultQuickFoods.filter(f => f.category === 'grain').length },
    { name: 'Protein', categoryKey: 'protein', emoji: '🥩', count: defaultQuickFoods.filter(f => f.category === 'protein').length },
    { name: 'Snacks', categoryKey: 'snack', emoji: '🍿', count: defaultQuickFoods.filter(f => f.category === 'snack').length },
    { name: 'Drinks', categoryKey: 'drink', emoji: '🥤', count: defaultQuickFoods.filter(f => f.category === 'drink').length },
  ];
  
  // Get quick foods by category
  const getQuickFoodsByCategory = (category: string) => {
    return defaultQuickFoods.filter(food => food.category === category);
  };
  
  // Filter recipes based on search and meal type
  const getFilteredRecipes = (mealType: MealType) => {
    const mealTypeFilter = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    
    return recipes.filter(recipe => {
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check new mealTypes array first, fall back to mealType, then legacy categories
      const matchesMealType = 
        recipe.mealTypes?.some(mt => mt.toLowerCase() === mealTypeFilter.toLowerCase()) ||
        (recipe.mealType && recipe.mealType.toLowerCase() === mealTypeFilter.toLowerCase()) ||
        (recipe.categories && recipe.categories.some(cat => cat.toLowerCase() === mealTypeFilter.toLowerCase()));
      
      return matchesSearch && matchesMealType;
    });
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Weekly Meal Plan</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAutoFillWeek} 
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Auto-Fill
              </button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Plan your meals for the week from your recipe library
          </p>
        </div>

        {/* Days - Horizontal Scrolling Day Cards */}
        <div 
          style={{ 
            overflow: 'hidden',
            width: '100%',
            position: 'relative'
          }}
        >
          <div
            className="overflow-x-scroll overflow-y-visible pb-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              scrollPadding: '0',
              width: '100%',
              overflowX: 'scroll',
              overflowY: 'visible'
            }}
          >
          <div 
            className="flex gap-3 p-3" 
            style={{ 
              display: 'inline-flex'
            }}
          >
            {weekPlan.map((day, dayIndex) => (
              <Card 
                key={day.day} 
                className="flex-shrink-0 overflow-hidden"
                style={{ 
                  width: '280px',
                  scrollSnapAlign: 'start'
                }}
              >
                {/* Day Header */}
                <CardHeader className="pb-3">
                  <CardTitle className="text-center">
                    <div className="text-lg font-bold">{day.day}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </CardTitle>
                </CardHeader>

                {/* Meals - Vertical Stack */}
                <CardContent className="pt-0 space-y-3">
                  {/* Breakfast */}
                  <MealRow
                    icon="🍳"
                    label="Breakfast"
                    recipes={day.breakfast}
                    quickFoods={day.breakfastQuickFoods}
                    onAdd={() => setAddingMeal({ dayIndex, mealType: 'Breakfast' })}
                    onAddQuickFood={() => setAddingQuickFood({ dayIndex, mealType: 'Breakfast' })}
                    onRemove={(index) => handleRemoveRecipe(dayIndex, 'Breakfast', index)}
                    onRemoveQuickFood={(index) => handleRemoveQuickFood(dayIndex, 'Breakfast', index)}
                  />

                  {/* Lunch */}
                  <MealRow
                    icon="☀️"
                    label="Lunch"
                    recipes={day.lunch}
                    quickFoods={day.lunchQuickFoods}
                    onAdd={() => setAddingMeal({ dayIndex, mealType: 'Lunch' })}
                    onAddQuickFood={() => setAddingQuickFood({ dayIndex, mealType: 'Lunch' })}
                    onRemove={(index) => handleRemoveRecipe(dayIndex, 'Lunch', index)}
                    onRemoveQuickFood={(index) => handleRemoveQuickFood(dayIndex, 'Lunch', index)}
                  />

                  {/* Dinner */}
                  <MealRow
                    icon="🌙"
                    label="Dinner"
                    recipes={day.dinner}
                    quickFoods={day.dinnerQuickFoods}
                    onAdd={() => setAddingMeal({ dayIndex, mealType: 'Dinner' })}
                    onAddQuickFood={() => setAddingQuickFood({ dayIndex, mealType: 'Dinner' })}
                    onRemove={(index) => handleRemoveRecipe(dayIndex, 'Dinner', index)}
                    onRemoveQuickFood={(index) => handleRemoveQuickFood(dayIndex, 'Dinner', index)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Custom Scrollbar Indicator */}
          <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden" style={{ border: '2px solid red' }}>
            <div 
              className="h-full bg-blue-500 transition-all duration-150"
              style={{ 
                width: '30%',
                marginLeft: '0%'
              }}
            />
          </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3 sticky bottom-20 pb-4">
          <button 
            className="w-full py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
            onClick={() => handleSaveMealPlan(false)}
          >
            <Save className="w-5 h-5" />
            Save Meal Plan
          </button>

          <button 
            className="w-full py-3 border border-gray-200 rounded-md text-base font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            onClick={() => setIsResetDialogOpen(true)}
          >
            <RotateCcw className="w-5 h-5" />
            Reset Weekly Plan
          </button>
        </div>
      </div>
      
      <BottomNav />
      
      {/* Recipe Selection Modal */}
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

            {/* Add New Recipe Button */}
            <Button
              variant="default"
              className="w-full"
              onClick={() => handleCreateRecipe(addingMeal.dayIndex, addingMeal.mealType)}
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
                      onClick={() => handleSelectRecipe(addingMeal.dayIndex, addingMeal.mealType, recipe)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {recipe.caloriesPerServing} cal
                          </p>
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

      {/* Quick Food Picker - Redirect to Quick Foods Screen */}
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

            {/* Back button when in category view */}
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
              {/* Category selection view */}
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

              {/* Items within selected category */}
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
            <AlertDialogTitle>Reset Entire Weekly Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all meals for all 7 days in your weekly plan. 
              You will need to create a new plan from scratch. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetWeeklyPlan}>
              Reset Weekly Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Meal Row Component for vertical meal stacking within day cards
interface MealRowProps {
  icon: string;
  label: string;
  recipes: Recipe[];
  quickFoods?: QuickFood[];
  onAdd: () => void;
  onAddQuickFood: () => void;
  onRemove: (index: number) => void;
  onRemoveQuickFood: (index: number) => void;
}

function MealRow({ icon, label, recipes, quickFoods = [], onAdd, onAddQuickFood, onRemove, onRemoveQuickFood }: MealRowProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0 px-2">
      {/* Meal Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      
      {/* Meal Content - matches EditTodayMealsModal exactly */}
      <div className="space-y-2">
        {/* Recipes Section */}
        <div className="space-y-2">
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipes</p>
          ) : (
            recipes.map((recipe, index) => (
              <div key={recipe.id} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded">
                <div className="flex items-center gap-2 flex-1">
                  {/* Recipe Thumbnail */}
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
          
          {/* Add Recipe Button - right after recipes */}
          <button
            className="w-full py-1 px-2 border border-gray-200 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
            onClick={onAdd}
          >
            <Plus className="w-3 h-3" />
            Add Recipe
          </button>
        </div>
        
        {/* Quick Foods Section */}
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
        
        {/* Add Quick Food Button - at the bottom */}
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

// Old Meal Slot Component (kept for backwards compatibility)
interface MealSlotProps {
  label: string;
  recipes: Recipe[];
  quickFoods?: QuickFood[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onRandomPick: () => void;
  onManualPick: () => void;
}

function MealSlot({ label, recipes, quickFoods = [], onAdd, onRemove, onRandomPick, onManualPick }: MealSlotProps) {
  if (recipes.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {label}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="space-y-2">
        {/* Recipes */}
        {recipes.map((recipe, index) => (
          <div key={recipe.id} className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <img src={recipe.image} alt={recipe.name} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <p className="font-medium">{recipe.name}</p>
                <p className="text-sm text-muted-foreground">
                  {recipe.prepTime + recipe.cookTime} min
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        
        {/* Quick Foods */}
        {quickFoods.length > 0 && (
          <div className="pl-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">+ Add-ons:</p>
            <div className="flex flex-wrap gap-2">
              {quickFoods.map((food, index) => (
                <div key={`${food.id}-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
                  <span className="text-lg">{food.emoji}</span>
                  <span>{food.name}</span>
                  <span className="text-xs text-muted-foreground">({food.calories} cal)</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add More
          </Button>
        </div>
      </div>
    </div>
  );
}

// Recipe Selection Modal
interface RecipeSelectionModalProps {
  mealType: MealType;
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  onCreate: () => void;
  onClose: () => void;
}

function RecipeSelectionModal({ mealType, recipes, onSelect, onCreate, onClose }: RecipeSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Add {mealType}</h2>
          <p className="text-sm text-muted-foreground">
            Choose from your library or create new
          </p>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Create New Button */}
          <Button
            variant="outline"
            className="w-full justify-start border-2 border-dashed"
            onClick={onCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New {mealType} Recipe
          </Button>
          
          {/* Existing Recipes */}
          {recipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No {mealType.toLowerCase()} recipes yet</p>
              <p className="text-sm">Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                From Your Library ({recipes.length})
              </p>
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(recipe)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg transition-colors text-left"
                >
                  <img src={recipe.image} alt={recipe.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-medium">{recipe.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {recipe.cuisine} • {recipe.prepTime + recipe.cookTime} min
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

