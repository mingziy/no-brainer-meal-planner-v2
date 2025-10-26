import { Share2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { mockPrepTasks } from '../../data/mockData';
import { useEffect, useState } from 'react';
import { ShoppingItem } from '../../types';
import { cleanIngredientNames } from '../../utils/geminiRecipeParser';

export function ShoppingListScreen() {
  const { shoppingList, setShoppingList, setCurrentScreen, setPrepTasks, currentWeeklyPlan } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Auto-generate shopping list when first opening the tab with a meal plan but no list
  useEffect(() => {
    if (!currentWeeklyPlan) return;
    
    // Only generate if shopping list is empty
    if (shoppingList.length === 0 && !isGenerating) {
      console.log('📝 Auto-generating shopping list from current meal plan');
      generateShoppingListFromPlan();
    }
  }, [currentWeeklyPlan]);
  
  // Helper to extract base ingredient name (remove processing details)
  const extractBaseIngredient = (ingredientName: string): string => {
    let cleaned = ingredientName.toLowerCase().trim();
    const processingWords = [
      'minced', 'diced', 'chopped', 'sliced', 'crushed', 'grated', 'shredded',
      'peeled', 'cubed', 'julienned', 'fresh', 'dried', 'frozen', 'canned',
      'cooked', 'raw', 'whole', 'halved', 'quartered', 'ground', 'smashed',
      'thinly sliced', 'finely chopped', 'roughly chopped', 'finely diced',
      'large', 'medium', 'small', 'baby', 'young', 'mature',
      'boneless', 'skinless', 'bone-in', 'skin-on'
    ];
    processingWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '').trim();
    });
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };
  
  // Categorize ingredient
  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (/lettuce|tomato|onion|garlic|carrot|potato|spinach|pepper|cucumber|avocado|broccoli|zucchini|mushroom|celery|cabbage|kale|arugula|basil|cilantro|parsley|ginger|lemon|lime/i.test(lower)) {
      return 'produce';
    } else if (/chicken|beef|pork|fish|shrimp|salmon|tuna|turkey|lamb|bacon|sausage|ham|steak|ground|meat/i.test(lower)) {
      return 'meat';
    } else if (/milk|cheese|yogurt|butter|cream|egg|sour cream|mozzarella|parmesan|cheddar|feta/i.test(lower)) {
      return 'dairy';
    } else if (/rice|pasta|flour|sugar|salt|oil|sauce|stock|broth|vinegar|soy sauce|bread|cereal|beans|lentils|quinoa|oats|honey|maple syrup|olive oil|vegetable oil|sesame oil|coconut oil|balsamic|wine|spice|cumin|paprika|oregano|thyme|cinnamon|vanilla|cocoa|chocolate|nuts|almond|walnut|peanut|cashew|pine nut/i.test(lower)) {
      return 'pantry';
    }
    return 'other';
  };
  
  // Generate shopping list from current weekly plan with AI cleaning
  const generateShoppingListFromPlan = async () => {
    if (!currentWeeklyPlan || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const ingredientMap = new Map<string, { original: string; category: string }>();
      
      // Collect all unique ingredients from planned meals
      currentWeeklyPlan.days.forEach(day => {
        [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].forEach(recipe => {
          if (!recipe) return;
          
          recipe.ingredients.forEach(ingredient => {
            const key = ingredient.name.toLowerCase().trim();
            
            if (!ingredientMap.has(key)) {
              const category = categorizeIngredient(ingredient.name);
              ingredientMap.set(key, { original: ingredient.name, category });
            }
          });
        });
      });
      
      // Get all unique ingredient names
      const ingredientNames = Array.from(ingredientMap.values()).map(v => v.original);
      
      // Clean ingredient names using AI
      console.log('🤖 Sending', ingredientNames.length, 'ingredients to AI for cleaning...');
      const cleanedNames = await cleanIngredientNames(ingredientNames);
      
      // Get currently checked items to preserve them
      const checkedItems = new Set(
        shoppingList.filter(item => item.checked).map(item => item.name.toLowerCase().trim())
      );
      
      // Create shopping list with cleaned names
      const newShoppingList: ShoppingItem[] = cleanedNames.map((cleanedName, index) => {
        const originalData = Array.from(ingredientMap.values())[index];
        const key = cleanedName.toLowerCase().trim();
        
        return {
          id: `shopping-${index}`,
          name: cleanedName,
          quantity: '',
          category: originalData.category as 'produce' | 'meat' | 'pantry' | 'dairy' | 'other',
          checked: checkedItems.has(key)
        };
      });
      
      setShoppingList(newShoppingList);
      console.log('✅ Shopping list generated with', newShoppingList.length, 'AI-cleaned items');
    } catch (error) {
      console.error('❌ Error generating shopping list:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = (id: string) => {
    setShoppingList(
      shoppingList.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleExportList = () => {
    const listText = shoppingList.map(item => `${item.checked ? '✓' : '☐'} ${item.name} (${item.quantity})`).join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'Shopping List',
        text: listText,
      });
    } else {
      navigator.clipboard.writeText(listText);
      alert('Shopping list copied to clipboard!');
    }
  };

  const handleGotGroceries = () => {
    setPrepTasks(mockPrepTasks);
    setCurrentScreen('prep-hub');
  };

  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const categoryNames = {
    produce: 'Produce',
    meat: 'Meat & Poultry',
    pantry: 'Pantry',
    dairy: 'Dairy',
    other: 'Other',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1>This Week's Shopping List</h1>
          <p className="text-muted-foreground">
            Check off items you already have at home
          </p>
        </div>

        {!currentWeeklyPlan ? (
          <Card className="bg-secondary/30">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-4">
                No meal plan yet. Create a weekly meal plan to generate your shopping list!
              </p>
              <Button 
                className="w-full" 
                onClick={() => setCurrentScreen('plan-setup')}
              >
                Plan Your Week
              </Button>
            </CardContent>
          </Card>
        ) : isGenerating ? (
          <Card className="bg-secondary/30">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                🤖 AI is cleaning your shopping list...
              </p>
            </CardContent>
          </Card>
        ) : shoppingList.length === 0 ? (
          <Card className="bg-secondary/30">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Your shopping list is empty. Add meals to your weekly plan!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{categoryNames[category as keyof typeof categoryNames]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <label
                          htmlFor={item.id}
                          className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => generateShoppingListFromPlan()}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'AI Cleaning...' : 'Regenerate with AI'}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleExportList}>
                <Share2 className="w-4 h-4 mr-2" />
                Export List
              </Button>
              <Button className="w-full" onClick={handleGotGroceries}>
                I have all my groceries!
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
