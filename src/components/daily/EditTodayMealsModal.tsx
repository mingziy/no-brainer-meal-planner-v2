import { useState, useEffect } from 'react';
import { X, Plus, RotateCcw, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
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
import { Card, CardContent } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { Recipe, DayPlan, QuickFood, ShoppingItem } from '../../types';
import { ScrollArea } from '../ui/scroll-area';
import { defaultQuickFoods } from '../../data/quickFoods';
import { cleanIngredientNames } from '../../utils/geminiRecipeParser';

interface EditTodayMealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayPlan: DayPlan;
  dayName: string;
}

export function EditTodayMealsModal({ isOpen, onClose, dayPlan, dayName }: EditTodayMealsModalProps) {
  const { recipes, currentWeeklyPlan, saveMealPlan, setCurrentScreen, setIsAddRecipeModalOpen, pendingTodayMealSelection, setPendingTodayMealSelection } = useApp();
  
  // Local state for editing
  const [breakfast, setBreakfast] = useState<Recipe[]>(dayPlan.breakfast);
  const [lunch, setLunch] = useState<Recipe[]>(dayPlan.lunch);
  const [dinner, setDinner] = useState<Recipe[]>(dayPlan.dinner);
  const [breakfastQuickFoods, setBreakfastQuickFoods] = useState<QuickFood[]>(dayPlan.breakfastQuickFoods || []);
  const [lunchQuickFoods, setLunchQuickFoods] = useState<QuickFood[]>(dayPlan.lunchQuickFoods || []);
  const [dinnerQuickFoods, setDinnerQuickFoods] = useState<QuickFood[]>(dayPlan.dinnerQuickFoods || []);
  
  const [showRecipePicker, setShowRecipePicker] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [showQuickFoodPicker, setShowQuickFoodPicker] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [selectedQuickFoodCategory, setSelectedQuickFoodCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Prevent flicker during transition

  // Watch for when a new recipe is saved and reopen the recipe picker
  useEffect(() => {
    if (pendingTodayMealSelection && isOpen) {
      console.log('🟢 Detected pendingTodayMealSelection, reopening recipe picker for:', pendingTodayMealSelection.mealType);
      // Recipe was just saved, reopen the recipe picker for the pending meal
      setShowRecipePicker(pendingTodayMealSelection.mealType);
      setPendingTodayMealSelection(null); // Clear the pending state
      console.log('🟢 Cleared pendingTodayMealSelection');
    }
  }, [pendingTodayMealSelection, isOpen]);

  // Debug: Track recipe picker state
  useEffect(() => {
    console.log('🟡 showRecipePicker changed to:', showRecipePicker);
  }, [showRecipePicker]);

  // Debug: Track modal open state
  useEffect(() => {
    console.log('🟡 EditTodayMealsModal isOpen:', isOpen);
  }, [isOpen]);

  // Remove recipe from meal
  const removeRecipe = (mealType: 'breakfast' | 'lunch' | 'dinner', recipeId: string) => {
    switch (mealType) {
      case 'breakfast':
        setBreakfast(prev => prev.filter(r => r.id !== recipeId));
        break;
      case 'lunch':
        setLunch(prev => prev.filter(r => r.id !== recipeId));
        break;
      case 'dinner':
        setDinner(prev => prev.filter(r => r.id !== recipeId));
        break;
    }
  };

  // Add recipe to meal
  const addRecipe = (mealType: 'breakfast' | 'lunch' | 'dinner', recipe: Recipe) => {
    console.log('🟠 addRecipe called:', { mealType, recipeName: recipe.name });
    switch (mealType) {
      case 'breakfast':
        setBreakfast(prev => [...prev, recipe]);
        break;
      case 'lunch':
        setLunch(prev => [...prev, recipe]);
        break;
      case 'dinner':
        setDinner(prev => [...prev, recipe]);
        break;
    }
    setShowRecipePicker(null);
    setSearchQuery('');
    console.log('🟠 Recipe added, picker closed');
  };

  // Add quick food to meal
  const addQuickFood = (mealType: 'breakfast' | 'lunch' | 'dinner', food: QuickFood) => {
    switch (mealType) {
      case 'breakfast':
        setBreakfastQuickFoods(prev => [...prev, food]);
        break;
      case 'lunch':
        setLunchQuickFoods(prev => [...prev, food]);
        break;
      case 'dinner':
        setDinnerQuickFoods(prev => [...prev, food]);
        break;
    }
    setShowQuickFoodPicker(null);
    setSelectedQuickFoodCategory(null);
    setSearchQuery('');
  };

  // Get quick foods by category
  const getQuickFoodsByCategory = (category: string) => {
    return defaultQuickFoods.filter(food => food.category === category);
  };

  // Get all unique categories with emoji and count
  const quickFoodCategories = [
    { name: 'Fruits', categoryKey: 'fruit', emoji: '🍎', count: defaultQuickFoods.filter(f => f.category === 'fruit').length },
    { name: 'Veggies', categoryKey: 'veggie', emoji: '🥕', count: defaultQuickFoods.filter(f => f.category === 'veggie').length },
    { name: 'Dairy', categoryKey: 'dairy', emoji: '🥛', count: defaultQuickFoods.filter(f => f.category === 'dairy').length },
    { name: 'Grains', categoryKey: 'grain', emoji: '🍞', count: defaultQuickFoods.filter(f => f.category === 'grain').length },
    { name: 'Protein', categoryKey: 'protein', emoji: '🥩', count: defaultQuickFoods.filter(f => f.category === 'protein').length },
    { name: 'Snacks', categoryKey: 'snack', emoji: '🍿', count: defaultQuickFoods.filter(f => f.category === 'snack').length },
    { name: 'Drinks', categoryKey: 'drink', emoji: '🥤', count: defaultQuickFoods.filter(f => f.category === 'drink').length },
  ];

  // Filter recipes based on search and meal type
  const getFilteredRecipes = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const mealTypeFilter = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    
    return recipes.filter(recipe => {
      const matchesSearch = searchQuery === '' || 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check new mealTypes array first, fall back to mealType, then legacy categories
      const matchesMealType = 
        recipe.mealTypes?.some(mt => mt.toLowerCase() === mealTypeFilter.toLowerCase()) ||
        recipe.mealType?.toLowerCase() === mealTypeFilter.toLowerCase() ||
        recipe.categories?.includes(mealTypeFilter as any);
      
      return matchesSearch && matchesMealType;
    });
  };

  // Filter quick foods based on search
  const getFilteredQuickFoods = () => {
    return defaultQuickFoods.filter(food => {
      return searchQuery === '' || 
        food.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  // Helper to categorize ingredients (produce, meat, dairy, or pantry - no "other")
  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (/lettuce|tomato|onion|garlic|carrot|potato|spinach|pepper|cucumber|avocado|broccoli|zucchini|mushroom|celery|cabbage|kale|arugula|basil|cilantro|parsley|ginger|lemon|lime/i.test(lower)) {
      return 'produce';
    } else if (/chicken|beef|pork|fish|shrimp|salmon|tuna|turkey|lamb|bacon|sausage|ham|steak|ground|meat/i.test(lower)) {
      return 'meat';
    } else if (/milk|cheese|yogurt|butter|cream|egg|sour cream|mozzarella|parmesan|cheddar|feta/i.test(lower)) {
      return 'dairy';
    }
    // Everything else goes to pantry
    return 'pantry';
  };

  // Save changes and regenerate shopping list
  const handleSave = async () => {
    if (!currentWeeklyPlan) return;

    // Update the day in the weekly plan
    const updatedDays = currentWeeklyPlan.days.map(day => {
      if (day.day === dayName) {
        return {
          ...day,
          breakfast,
          lunch,
          dinner,
          breakfastQuickFoods,
          lunchQuickFoods,
          dinnerQuickFoods,
        };
      }
      return day;
    });

    // Save updated plan (with old shopping list for immediate save)
    const updatedPlan = {
      ...currentWeeklyPlan,
      days: updatedDays,
    };

    // Close modal immediately for better UX
    onClose();
    console.log('✅ Modal closed immediately');
    
    // Save to Firebase in the BACKGROUND
    saveMealPlan(updatedPlan).then(() => {
      console.log('✅ Meal plan saved to Firebase');
    }).catch(err => {
      console.error('❌ Failed to save meal plan:', err);
    });
    
    // Regenerate shopping list with AI in the BACKGROUND
    console.log('🛒 Regenerating shopping list with AI in background...');
    generateShoppingList(updatedDays).then(async (shoppingList) => {
      console.log('✅ Generated shopping list:', shoppingList.length, 'items', shoppingList);
      
      const finalPlan = {
        ...updatedPlan,
        shoppingList,
      };
      
      await saveMealPlan(finalPlan);
      console.log('✅ Shopping list updated in background');
    }).catch(err => {
      console.error('❌ Failed to regenerate shopping list:', err);
    });
  };

  // Reset all meals for the day
  const handleReset = async () => {
    if (!currentWeeklyPlan) return;

    // Clear all local state
    setBreakfast([]);
    setLunch([]);
    setDinner([]);
    setBreakfastQuickFoods([]);
    setLunchQuickFoods([]);
    setDinnerQuickFoods([]);

    // Update the day in the weekly plan
    const updatedDays = currentWeeklyPlan.days.map(day => {
      if (day.day === dayName) {
        return {
          ...day,
          breakfast: [],
          lunch: [],
          dinner: [],
          breakfastQuickFoods: [],
          lunchQuickFoods: [],
          dinnerQuickFoods: [],
        };
      }
      return day;
    });

    // Save updated plan
    const updatedPlan = {
      ...currentWeeklyPlan,
      days: updatedDays,
    };

    // Save to Firebase
    await saveMealPlan(updatedPlan);
    console.log('✅ Day meals reset and saved');

    // Close the reset dialog
    setIsResetDialogOpen(false);
  };

  // Generate shopping list from meal plan
  const generateShoppingList = async (days: any[]): Promise<ShoppingItem[]> => {
    const ingredientMap = new Map<string, { original: string; category: string }>();
    const quickFoodMap = new Map<string, QuickFood>();
    
    // Collect ingredients and quick foods
    days.forEach(day => {
      const allRecipes = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks];
      
      allRecipes.forEach(recipe => {
        if (!recipe?.ingredients) return;
        recipe.ingredients.forEach((ingredient: any) => {
          const key = ingredient.name.toLowerCase().trim();
          if (!ingredientMap.has(key)) {
            const category = categorizeIngredient(ingredient.name);
            ingredientMap.set(key, { original: ingredient.name, category });
          }
        });
      });
      
      // Collect quick foods
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
    
    console.log('📊 Ingredients before cleaning:', ingredientNames);
    console.log('📊 Quick Foods:', quickFoods.length);
    
    // Clean ingredient names using AI
    let cleanedNames: string[] = [];
    if (ingredientNames.length > 0) {
      try {
        cleanedNames = await cleanIngredientNames(ingredientNames);
        console.log('✨ AI cleaned ingredient names:', cleanedNames);
      } catch (error) {
        console.error('❌ AI cleaning failed, using original names:', error);
        cleanedNames = ingredientNames; // Fallback to original if AI fails
      }
    }
    
    // Ensure we have the same number of cleaned names as original ingredients
    if (cleanedNames.length !== ingredientNames.length) {
      console.error('⚠️ Cleaned names count mismatch! Using original names.');
      cleanedNames = ingredientNames;
    }
    
    // Create shopping list (deduplicated and capitalized)
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
    const shoppingList: ShoppingItem[] = Array.from(itemMap.entries()).map(([name, data], index) => {
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
    
    // Add quick foods (deduplicate with existing items)
    quickFoods.forEach((food, index) => {
      const normalizedFoodName = food.name.toLowerCase().trim();
      
      // Check if this quick food is already in the shopping list
      const existingItem = shoppingList.find(item => 
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
        
        shoppingList.push({
          id: `shopping-quickfood-${index}`,
          name: capitalizedName,
          quantity: food.servingSize,
          category,
          checked: false,
        });
      }
    });
    
    return shoppingList;
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Today's Meals - {dayName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto">
          <div className="space-y-6 pb-4">
            {/* Breakfast Section */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🍳 Breakfast
              </h3>
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {/* Recipes */}
                  <div className="space-y-2">
                    {breakfast.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recipes</p>
                    ) : (
                      breakfast.map(recipe => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipe('breakfast', recipe.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    
                    {/* Add Recipe Button - right after recipes */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowRecipePicker('breakfast')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipe
                    </Button>
                  </div>
                  
                  {/* Quick Foods */}
                  {breakfastQuickFoods.length > 0 && (
                    <div className="pl-4 space-y-1 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Quick Add-ons:</p>
                      {breakfastQuickFoods.map((food, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{food.emoji} {food.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setBreakfastQuickFoods(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Quick Food Button - at the bottom */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowQuickFoodPicker('breakfast')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quick Food
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Lunch Section */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🍽️ Lunch
              </h3>
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {/* Recipes */}
                  <div className="space-y-2">
                    {lunch.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recipes</p>
                    ) : (
                      lunch.map(recipe => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipe('lunch', recipe.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    
                    {/* Add Recipe Button - right after recipes */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowRecipePicker('lunch')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipe
                    </Button>
                  </div>
                  
                  {/* Quick Foods */}
                  {lunchQuickFoods.length > 0 && (
                    <div className="pl-4 space-y-1 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Quick Add-ons:</p>
                      {lunchQuickFoods.map((food, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{food.emoji} {food.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setLunchQuickFoods(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Quick Food Button - at the bottom */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowQuickFoodPicker('lunch')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quick Food
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Dinner Section */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🌙 Dinner
              </h3>
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {/* Recipes */}
                  <div className="space-y-2">
                    {dinner.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recipes</p>
                    ) : (
                      dinner.map(recipe => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipe('dinner', recipe.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    
                    {/* Add Recipe Button - right after recipes */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowRecipePicker('dinner')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Recipe
                    </Button>
                  </div>
                  
                  {/* Quick Foods */}
                  {dinnerQuickFoods.length > 0 && (
                    <div className="pl-4 space-y-1 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Quick Add-ons:</p>
                      {dinnerQuickFoods.map((food, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{food.emoji} {food.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setDinnerQuickFoods(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Quick Food Button - at the bottom */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowQuickFoodPicker('dinner')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quick Food
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Edit Full Week Link */}
            <Button
              variant="link"
              className="w-full"
              onClick={() => {
                onClose();
                setCurrentScreen('weekly-review');
              }}
            >
              Edit Full Week →
            </Button>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsResetDialogOpen(true)} 
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>

        {/* Recipe Picker Modal */}
        {showRecipePicker && !isTransitioning && (
          <Dialog open={!!showRecipePicker} onOpenChange={() => setShowRecipePicker(null)}>
            <DialogContent className="max-w-md p-6 gap-4" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <DialogHeader>
                <DialogTitle>Add Recipe to {showRecipePicker.charAt(0).toUpperCase() + showRecipePicker.slice(1)}</DialogTitle>
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
                onClick={() => {
                  console.log('🔵 Create New Recipe clicked');
                  
                  // Set transitioning flag to hide modals immediately
                  setIsTransitioning(true);
                  
                  // Save which meal type we're adding to
                  if (showRecipePicker) {
                    setPendingTodayMealSelection({ mealType: showRecipePicker });
                    console.log('🔵 Set pendingTodayMealSelection:', showRecipePicker);
                  }
                  
                  // Close both modals immediately (synchronously)
                  setShowRecipePicker(null);
                  onClose();
                  console.log('🔵 Closed both modals');
                  
                  // Open Add Recipe modal after a brief delay to ensure clean state
                  setTimeout(() => {
                    setIsAddRecipeModalOpen(true);
                    setIsTransitioning(false);
                    console.log('🔵 Opened AddRecipeModal');
                  }, 150);
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
                  {getFilteredRecipes(showRecipePicker).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recipes found
                    </p>
                  ) : (
                    getFilteredRecipes(showRecipePicker).map(recipe => (
                      <Card
                        key={recipe.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => addRecipe(showRecipePicker, recipe)}
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

        {/* Quick Food Picker Modal */}
        {showQuickFoodPicker && (
          <Dialog open={!!showQuickFoodPicker} onOpenChange={() => {
            setShowQuickFoodPicker(null);
            setSelectedQuickFoodCategory(null);
          }}>
            <DialogContent className="max-w-md p-6 gap-4" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <DialogHeader>
                <DialogTitle>
                  {!selectedQuickFoodCategory 
                    ? `Add Quick Food to ${showQuickFoodPicker.charAt(0).toUpperCase() + showQuickFoodPicker.slice(1)}`
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
                        onClick={() => addQuickFood(showQuickFoodPicker, food)}
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
      </DialogContent>
    </Dialog>

    {/* Reset Confirmation Dialog */}
    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset All Meals?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all meals (breakfast, lunch, and dinner) for {dayName}. 
            You can add new meals afterward. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>
            Reset All Meals
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

