import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { Plus, Calendar, Sparkles, RefreshCw, ShoppingCart, Save } from 'lucide-react';
import { Recipe, RecipeCategory, ShoppingItem, QuickFood } from '../../types';
import { cleanIngredientNames } from '../../utils/geminiRecipeParser';
import { defaultQuickFoods } from '../../data/quickFoods';

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
  const { recipes, setIsAddRecipeModalOpen, setDraftRecipe, setPendingMealType, shoppingList, setShoppingList, setCurrentScreen, currentWeeklyPlan, setCurrentWeeklyPlan, saveMealPlan } = useApp();
  
  // Initialize 7 days starting from today, or load from saved plan
  const [weekPlan, setWeekPlan] = useState<DayMealPlan[]>(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    
    // If there's a saved plan, load it
    if (currentWeeklyPlan) {
      return currentWeeklyPlan.days.map((day, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + 1 + index);
        return {
          day: days[index],
          date,
          breakfast: Array.isArray(day.breakfast) ? day.breakfast : [],
          lunch: Array.isArray(day.lunch) ? day.lunch : [],
          dinner: Array.isArray(day.dinner) ? day.dinner : [],
          snacks: Array.isArray(day.snacks) ? day.snacks : [],
          breakfastQuickFoods: day.breakfastQuickFoods || getRandomQuickFoods(2),
          lunchQuickFoods: day.lunchQuickFoods || getRandomQuickFoods(2),
          dinnerQuickFoods: day.dinnerQuickFoods || getRandomQuickFoods(2)
        };
      });
    }
    
    // Otherwise create empty plan with auto-populated quick foods
    return days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + index); // Start from Monday
      return {
        day,
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        breakfastQuickFoods: getRandomQuickFoods(2),
        lunchQuickFoods: getRandomQuickFoods(2),
        dinnerQuickFoods: getRandomQuickFoods(2)
      };
    });
  });
  
  const [addingMeal, setAddingMeal] = useState<{ dayIndex: number; mealType: MealType } | null>(null);
  
  // Get recipes by category
  const getRecipesByMealType = (mealType: MealType): Recipe[] => {
    return recipes.filter(recipe => recipe.categories.includes(mealType as RecipeCategory));
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
  const handleGenerateShoppingList = () => {
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
            // Categorize ingredient
            const category = categorizeIngredient(baseIngredient);
            ingredientMap.set(key, category);
          }
        });
      });
    });
    
    // Convert to shopping list format (no quantities)
    const shoppingList: ShoppingItem[] = Array.from(ingredientMap.entries()).map(([name, category], index) => ({
      id: `shopping-${index}`,
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      quantity: '', // No quantity for now
      category: category as 'produce' | 'meat' | 'pantry' | 'dairy' | 'other',
      checked: false
    }));
    
    // Save to context and navigate
    setShoppingList(shoppingList);
    setCurrentScreen('shopping-list');
  };
  
  // Save meal plan (also called after any change)
  const handleSaveMealPlan = async (silent = false) => {
    try {
      // Convert to WeeklyPlan format
      const weeklyPlan = {
        ...(currentWeeklyPlan?.id && { id: currentWeeklyPlan.id }), // Include ID if updating
        cuisine: 'Mixed',
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
        ...(currentWeeklyPlan?.createdAt && { createdAt: currentWeeklyPlan.createdAt }),
      };
      
      // Save to Firebase
      await saveMealPlan(weeklyPlan as any);
      
      // Show success immediately
      if (!silent) {
        alert('Meal plan saved! You can view it on the home page.');
      }
      
      // Update shopping list in background (don't wait for AI)
      if (shoppingList.length > 0) {
        updateShoppingListWithAI(); // No await - runs in background
      }
    } catch (error) {
      console.error('Error saving meal plan:', error);
      if (!silent) {
        alert('Failed to save meal plan. Please try again.');
      }
    }
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
            <Button onClick={handleAutoFillWeek} variant="default" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Fill Week
            </Button>
          </div>
          <p className="text-muted-foreground">
            Plan your meals for the week from your recipe library
          </p>
        </div>
        
        {/* Days */}
        <div className="space-y-4">
          {weekPlan.map((day, dayIndex) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{day.day}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Breakfast */}
                <MealSlot
                  label="Breakfast"
                  recipes={day.breakfast}
                  quickFoods={day.breakfastQuickFoods}
                  onAdd={() => setAddingMeal({ dayIndex, mealType: 'Breakfast' })}
                  onRemove={(index) => handleRemoveRecipe(dayIndex, 'Breakfast', index)}
                  onRandomPick={() => handleRandomPick(dayIndex, 'Breakfast')}
                  onManualPick={() => setAddingMeal({ dayIndex, mealType: 'Breakfast' })}
                />
                
                {/* Lunch */}
                <MealSlot
                  label="Lunch"
                  recipes={day.lunch}
                  quickFoods={day.lunchQuickFoods}
                  onAdd={() => setAddingMeal({ dayIndex, mealType: 'Lunch' })}
                  onRemove={(index) => handleRemoveRecipe(dayIndex, 'Lunch', index)}
                  onRandomPick={() => handleRandomPick(dayIndex, 'Lunch')}
                  onManualPick={() => setAddingMeal({ dayIndex, mealType: 'Lunch' })}
                />
                
                {/* Dinner */}
                <MealSlot
                  label="Dinner"
                  recipes={day.dinner}
                  quickFoods={day.dinnerQuickFoods}
                  onAdd={() => setAddingMeal({ dayIndex, mealType: 'Dinner' })}
                  onRemove={(index) => handleRemoveRecipe(dayIndex, 'Dinner', index)}
                  onRandomPick={() => handleRandomPick(dayIndex, 'Dinner')}
                  onManualPick={() => setAddingMeal({ dayIndex, mealType: 'Dinner' })}
                />
                
                {/* Snacks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Snacks</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingMeal({ dayIndex, mealType: 'Snack' })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {day.snacks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No snacks planned</p>
                  ) : (
                    <div className="space-y-2">
                      {day.snacks.map((snack, snackIndex) => (
                        <div key={snackIndex} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                          <img src={snack.image} alt={snack.name} className="w-12 h-12 object-cover rounded" />
                          <span className="flex-1 text-sm">{snack.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRecipe(dayIndex, 'Snack', snackIndex)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3 sticky bottom-20 pb-4">
          <Button 
            className="w-full" 
            size="lg"
            variant="default"
            onClick={() => handleSaveMealPlan(false)}
            disabled={!weekPlan.some(day => day.breakfast.length > 0 || day.lunch.length > 0 || day.dinner.length > 0 || day.snacks.length > 0)}
          >
            <Save className="w-5 h-5 mr-2" />
            Save Meal Plan
          </Button>
          
          <Button 
            className="w-full" 
            size="lg"
            variant="outline"
            onClick={handleGenerateShoppingList}
            disabled={!weekPlan.some(day => day.breakfast.length > 0 || day.lunch.length > 0 || day.dinner.length > 0 || day.snacks.length > 0)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Generate Shopping List
          </Button>
        </div>
      </div>
      
      <BottomNav />
      
      {/* Recipe Selection Modal */}
      {addingMeal && (
        <RecipeSelectionModal
          mealType={addingMeal.mealType}
          recipes={getRecipesByMealType(addingMeal.mealType)}
          onSelect={(recipe) => handleSelectRecipe(addingMeal.dayIndex, addingMeal.mealType, recipe)}
          onCreate={() => handleCreateRecipe(addingMeal.dayIndex, addingMeal.mealType)}
          onClose={() => setAddingMeal(null)}
        />
      )}
    </div>
  );
}

// Meal Slot Component - now handles multiple recipes + quick foods
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

