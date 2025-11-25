import { Share2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';
import { useEffect, useState } from 'react';
import { ShoppingItem, WeeklyPlan, QuickFood, Recipe } from '../../types';
import { cleanIngredientNames } from '../../utils/geminiRecipeParser';
export function ShoppingListScreen() {
  const { 
    shoppingList, 
    setShoppingList,
    saveShoppingList, 
    setCurrentScreen, 
    currentWeeklyPlan,
    mealPlans,
    getThisWeekPlan,
    getNextWeekPlan,
    recipes,
    saveMealPlan
  } = useApp();
  
  const [selectedWeekPlanId, setSelectedWeekPlanId] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<WeeklyPlan | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Get current week's start date for comparison
  const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };
  
  const getNextWeekStart = () => {
    const thisWeek = getCurrentWeekStart();
    const nextWeek = new Date(thisWeek);
    nextWeek.setDate(thisWeek.getDate() + 7);
    return nextWeek;
  };
  
  // Helper to format unified week label: "This Week (Oct 27 - Nov 2)"
  const formatUnifiedWeekLabel = (plan: WeeklyPlan): string => {
    const thisWeekStart = getCurrentWeekStart();
    const nextWeekStart = getNextWeekStart();
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    const planWeekStart = new Date(plan.weekStartDate);
    planWeekStart.setHours(0, 0, 0, 0);
    
    // Format date range
    const startStr = plan.weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = plan.weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateRange = `${startStr} - ${endStr}`;
    
    // Determine relative label
    if (planWeekStart.getTime() === thisWeekStart.getTime()) {
      return `This Week (${dateRange})`;
    } else if (planWeekStart.getTime() === nextWeekStart.getTime()) {
      return `Next Week (${dateRange})`;
    } else if (planWeekStart.getTime() === lastWeekStart.getTime()) {
      return `Last Week (${dateRange})`;
    } else if (planWeekStart.getTime() < thisWeekStart.getTime()) {
      // Past weeks
      const weeksAgo = Math.floor((thisWeekStart.getTime() - planWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return `${weeksAgo} Weeks Ago (${dateRange})`;
    } else {
      // Future weeks
      const weeksAhead = Math.floor((planWeekStart.getTime() - thisWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return `${weeksAhead} Weeks Ahead (${dateRange})`;
    }
  };
  
  // Deduplicate meal plans - keep only the most recent plan for each week
  // Also compute proper display labels
  const uniqueWeekPlans = mealPlans.reduce((acc: WeeklyPlan[], plan) => {
    const existingPlan = acc.find(p => 
      p.weekStartDate.getTime() === plan.weekStartDate.getTime()
    );
    
    if (!existingPlan) {
      acc.push({ ...plan, weekLabel: formatUnifiedWeekLabel(plan) });
    } else {
      // If this plan is newer (more recently created), replace the existing one
      const existingIndex = acc.indexOf(existingPlan);
      if (plan.createdAt.getTime() > existingPlan.createdAt.getTime()) {
        acc[existingIndex] = { ...plan, weekLabel: formatUnifiedWeekLabel(plan) };
      }
    }
    
    return acc;
  }, []).sort((a, b) => {
    // Sort: This Week, Next Week, then by date (most recent first)
    const thisWeekStart = getCurrentWeekStart();
    const nextWeekStart = getNextWeekStart();
    
    const aTime = a.weekStartDate.getTime();
    const bTime = b.weekStartDate.getTime();
    const thisTime = thisWeekStart.getTime();
    const nextTime = nextWeekStart.getTime();
    
    // This Week comes first
    if (aTime === thisTime) return -1;
    if (bTime === thisTime) return 1;
    
    // Next Week comes second
    if (aTime === nextTime) return -1;
    if (bTime === nextTime) return 1;
    
    // Everything else sorted by date (most recent first)
    return bTime - aTime;
  });
  
  // Initialize selected plan when mealPlans load
  useEffect(() => {
    if (mealPlans.length === 0) return;
    
    // Default to "this week's" plan if available
    const thisWeekPlan = getThisWeekPlan();
    if (thisWeekPlan && !selectedWeekPlanId) {
      console.log('🛒 Initializing with this week\'s plan:', thisWeekPlan.weekLabel);
      setSelectedWeekPlanId(thisWeekPlan.id);
      setSelectedPlan(thisWeekPlan);
    } else if (!selectedWeekPlanId && mealPlans.length > 0) {
      // Fallback to most recent plan
      console.log('🛒 Initializing with most recent plan:', mealPlans[0].weekLabel);
      setSelectedWeekPlanId(mealPlans[0].id);
      setSelectedPlan(mealPlans[0]);
    }
  }, [mealPlans, getThisWeekPlan]);
  
  
  // Update shopping list when selected plan changes
  useEffect(() => {
    if (!selectedPlan) {
      console.log('🛒 No selected plan');
      return;
    }
    
    console.log('🛒 Selected plan changed:', {
      id: selectedPlan.id,
      weekLabel: selectedPlan.weekLabel,
      hasShoppingList: !!selectedPlan.shoppingList,
      shoppingListLength: selectedPlan.shoppingList?.length || 0,
      shoppingListItems: selectedPlan.shoppingList
    });
    
    if (selectedPlan.shoppingList && selectedPlan.shoppingList.length > 0) {
      console.log('📝 Loading shopping list from selected plan:', selectedPlan.weekLabel, selectedPlan.shoppingList);
      setShoppingList(selectedPlan.shoppingList);
    } else {
      // No shopping list saved - clear it
      console.log('📝 No shopping list for:', selectedPlan.weekLabel);
      setShoppingList([]);
    }
  }, [selectedPlan?.id]); // Only trigger when the plan ID changes
  
  // Handle week selection change
  const handleWeekChange = (planId: string) => {
    setSelectedWeekPlanId(planId);
    const plan = mealPlans.find(p => p.id === planId) || null;
    setSelectedPlan(plan);
  };
  
  const toggleItem = async (id: string) => {
    const updatedList = shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setShoppingList(updatedList);
    
    // Save to Firestore
    try {
      await saveShoppingList(updatedList);
      console.log('[ShoppingListScreen] Shopping list saved after toggle');
    } catch (error) {
      console.error('[ShoppingListScreen] Error saving shopping list:', error);
    }
  };

  const handleExportList = () => {
    // Build the export text with the same grouping and order as displayed
    const exportSections: string[] = [];
    
    sortedCategories.forEach(category => {
      // Add category header
      const categoryHeader = categoryNames[category as keyof typeof categoryNames];
      exportSections.push(`\n${categoryHeader}\n${'─'.repeat(categoryHeader.length)}`);
      
      // Add items in the same order as displayed (alphabetically sorted)
      groupedItems[category].forEach(item => {
        exportSections.push(`${item.checked ? '✓' : '☐'} ${item.name}`);
      });
    });
    
    const listText = exportSections.join('\n').trim();
    
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

  // Check if text contains Chinese characters
  const containsChinese = (text: string): boolean => {
    return /[\u4e00-\u9fa5]/.test(text);
  };

  // Translate Chinese ingredients to English using Gemini AI
  const translateIngredientsToEnglish = async (ingredientNames: string[]): Promise<string[]> => {
    const chineseIngredients = ingredientNames.filter(name => containsChinese(name));
    
    if (chineseIngredients.length === 0) {
      return ingredientNames; // No translation needed
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ Gemini API key not configured, keeping Chinese ingredients as is');
        return ingredientNames;
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Translate these Chinese ingredient names to English. Return ONLY the English translation, one per line, in the same order. Keep it simple and natural for a grocery shopping list.

Chinese ingredients to translate:
${chineseIngredients.join('\n')}

Return ONLY the English translations, one per line, no explanations, no numbering.`;

      console.log('🌐 Translating', chineseIngredients.length, 'Chinese ingredients to English...');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const translations = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (translations.length !== chineseIngredients.length) {
        console.warn('⚠️ Translation count mismatch, keeping originals');
        return ingredientNames;
      }

      // Create a map of Chinese to English translations
      const translationMap = new Map<string, string>();
      chineseIngredients.forEach((chinese, index) => {
        translationMap.set(chinese, translations[index]);
      });

      // Replace Chinese ingredients with English translations
      const translatedNames = ingredientNames.map(name => {
        if (containsChinese(name) && translationMap.has(name)) {
          const translation = translationMap.get(name)!;
          console.log('🌐 Translated:', name, '→', translation);
          return translation;
        }
        return name;
      });

      console.log('✅ Translation complete:', chineseIngredients.length, 'ingredients translated');
      return translatedNames;
    } catch (error) {
      console.error('❌ Error translating ingredients:', error);
      return ingredientNames; // Fallback to original names
    }
  };

  // Categorize ingredient for shopping list
  const categorizeIngredient = (name: string): string => {
    const nameLower = name.toLowerCase();
    
    // Produce (English + Chinese)
    if (/vegetable|fruit|lettuce|tomato|onion|garlic|pepper|carrot|broccoli|spinach|kale|cabbage|potato|avocado|apple|banana|berry|lemon|lime|orange|herb|cilantro|parsley|basil/.test(nameLower)) {
      return 'produce';
    }
    // Chinese produce keywords
    if (/蔬菜|水果|生菜|番茄|西红柿|洋葱|蒜|大蒜|辣椒|胡萝卜|西兰花|菠菜|白菜|土豆|马铃薯|牛油果|苹果|香蕉|柠檬|橙|橘|姜|葱|香菜|香葱|香菇|蘑菇|木耳|金针菇|豆芽|芹菜|茄子|黄瓜|青瓜|南瓜|冬瓜|丝瓜|苦瓜|韭菜|豆角|豌豆|玉米|青椒|红椒|彩椒|芦笋|西芹|花菜|莴笋|萝卜|山药|莲藕|竹笋|荸荠/.test(name)) {
      return 'produce';
    }
    
    // Meat (English + Chinese)
    if (/chicken|beef|pork|fish|salmon|turkey|lamb|meat|bacon|sausage|shrimp|crab|lobster/.test(nameLower)) {
      return 'meat';
    }
    // Chinese meat keywords
    if (/鸡|鸡肉|鸡胸|鸡腿|鸡翅|牛肉|猪肉|鱼|鱼肉|三文鱼|鲑鱼|火鸡|羊肉|肉|培根|香肠|腊肠|虾|蟹|螃蟹|龙虾|鸭|鸭肉|排骨|五花肉|里脊|牛排|肉丸|肉馅|肉片|肉丁/.test(name)) {
      return 'meat';
    }
    
    // Dairy (English + Chinese)
    if (/milk|cheese|yogurt|butter|cream|egg|dairy/.test(nameLower)) {
      return 'dairy';
    }
    // Chinese dairy keywords
    if (/牛奶|奶|芝士|奶酪|酸奶|黄油|奶油|蛋|鸡蛋|蛋黄|蛋清|蛋白/.test(name)) {
      return 'dairy';
    }
    
    // Pantry (default for everything else like rice, pasta, oil, spices, sauces, etc.)
    return 'pantry';
  };

  // Regenerate shopping list from selected plan
  const handleRegenerateShoppingList = async () => {
    if (!selectedPlan) {
      alert('No meal plan selected');
      return;
    }

    setIsRegenerating(true);
    
    try {
      const ingredientMap = new Map<string, { original: string; category: string }>();
      const quickFoodMap = new Map<string, QuickFood>();
      
      // Collect all unique ingredients from planned meals
      console.log('🌏 Current language mode:', isChineseMode ? 'Chinese' : 'English');
      
      selectedPlan.days.forEach(day => {
        const allRecipes = [...day.breakfast, ...day.lunch, ...day.dinner, ...(day.snacks || [])];
        
        allRecipes.forEach(recipe => {
          // Look up the full recipe to get ingredients
          const fullRecipe = recipes.find(r => r.id === recipe.id);
          if (!fullRecipe) {
            console.log('⚠️ Recipe not found:', recipe.id);
            return;
          }
          
          console.log('📖 Processing recipe:', fullRecipe.name, {
            hasEnglishIngredients: !!fullRecipe.ingredients?.length,
            hasChineseIngredients: !!fullRecipe.ingredientsZh?.length,
            isChineseMode,
            englishCount: fullRecipe.ingredients?.length || 0,
            chineseCount: fullRecipe.ingredientsZh?.length || 0
          });
          
          // Use language-appropriate ingredients
          const ingredientsToUse = isChineseMode && fullRecipe.ingredientsZh 
            ? fullRecipe.ingredientsZh 
            : fullRecipe.ingredients;
          
          if (!ingredientsToUse || ingredientsToUse.length === 0) {
            console.log('⚠️ No ingredients found for recipe:', fullRecipe.name);
            return;
          }
          
          console.log('✅ Processing recipe:', fullRecipe.name, '- ingredients:', ingredientsToUse.length);
          
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
      
      console.log('🔄 Regenerating shopping list with', ingredientNames.length, 'ingredients');
      
      // Step 1: Translate Chinese ingredients to English if in English mode
      let translatedNames = ingredientNames;
      if (!isChineseMode) {
        try {
          translatedNames = await translateIngredientsToEnglish(ingredientNames);
        } catch (error) {
          console.error('❌ Translation failed, using original names:', error);
          translatedNames = ingredientNames;
        }
      }
      
      // Step 2: Clean ingredient names and categorize using AI
      let cleanedIngredients: Array<{ name: string; category: string }> = [];
      if (translatedNames.length > 0) {
        try {
          cleanedIngredients = await cleanIngredientNames(translatedNames);
        } catch (error) {
          console.error('❌ AI cleaning failed, using translated names:', error);
          cleanedIngredients = translatedNames.map((name, index) => ({
            name,
            category: Array.from(ingredientMap.values())[index].category
          }));
        }
      }
      
      // Create shopping list with cleaned ingredient names (deduplicated and capitalized)
      const itemMap = new Map<string, { category: string }>();
      
      cleanedIngredients.forEach((item) => {
        const normalizedName = item.name.toLowerCase().trim();
        
        if (!itemMap.has(normalizedName)) {
          itemMap.set(normalizedName, { category: item.category });
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
      
      // Update the selected plan with new shopping list
      const updatedPlan = {
        ...selectedPlan,
        shoppingList: newShoppingList
      };
      
      await saveMealPlan(updatedPlan);
      setShoppingList(newShoppingList);
      
      // Also save to user's shopping list collection
      try {
        await saveShoppingList(newShoppingList);
        console.log('✅ Shopping list saved to Firestore');
      } catch (saveError) {
        console.error('❌ Error saving shopping list to Firestore:', saveError);
      }
      
      console.log('✅ Shopping list regenerated with', newShoppingList.length, 'items');
      alert(`Shopping list regenerated! ${newShoppingList.length} items (plurals converted to singular)`);
    } catch (error) {
      console.error('❌ Error regenerating shopping list:', error);
      alert('Failed to regenerate shopping list. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  // Sort items alphabetically within each category
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  const categoryNames = {
    produce: '🥬 Produce',
    meat: '🍖 Meat & Poultry',
    dairy: '🥛 Dairy',
    pantry: '🍞 Pantry',
  };

  // Define category order
  const categoryOrder = ['produce', 'meat', 'dairy', 'pantry'];
  
  // Get sorted categories
  const sortedCategories = categoryOrder.filter(cat => groupedItems[cat] && groupedItems[cat].length > 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1>Shopping List</h1>
            
            <div className="flex items-center gap-2">
              {/* Action Buttons - Refresh and Export */}
              {selectedPlan && shoppingList.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRegenerateShoppingList}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportList}
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </>
              )}
              <UserButton />
            </div>
          </div>
          <p className="text-muted-foreground">
            Check off items you already have at home
          </p>
        </div>

        {/* Week Selector - Button Group */}
        {uniqueWeekPlans.length > 0 && (
          <div className="flex gap-2">
            {/* Last Week */}
            {uniqueWeekPlans.find(p => p.weekLabel?.includes('Last Week')) && (
              <Button
                key={uniqueWeekPlans.find(p => p.weekLabel?.includes('Last Week'))!.id}
                variant={selectedWeekPlanId === uniqueWeekPlans.find(p => p.weekLabel?.includes('Last Week'))!.id ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleWeekChange(uniqueWeekPlans.find(p => p.weekLabel?.includes('Last Week'))!.id)}
              >
                Last Week
              </Button>
            )}
            
            {/* This Week */}
            {uniqueWeekPlans.find(p => p.weekLabel?.includes('This Week')) && (
              <Button
                key={uniqueWeekPlans.find(p => p.weekLabel?.includes('This Week'))!.id}
                variant={selectedWeekPlanId === uniqueWeekPlans.find(p => p.weekLabel?.includes('This Week'))!.id ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleWeekChange(uniqueWeekPlans.find(p => p.weekLabel?.includes('This Week'))!.id)}
              >
                This Week
              </Button>
            )}
            
            {/* Next Week */}
            {uniqueWeekPlans.find(p => p.weekLabel?.includes('Next Week')) && (
              <Button
                key={uniqueWeekPlans.find(p => p.weekLabel?.includes('Next Week'))!.id}
                variant={selectedWeekPlanId === uniqueWeekPlans.find(p => p.weekLabel?.includes('Next Week'))!.id ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleWeekChange(uniqueWeekPlans.find(p => p.weekLabel?.includes('Next Week'))!.id)}
              >
                Next Week
              </Button>
            )}
          </div>
        )}

        {!selectedPlan ? (
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
        ) : shoppingList.length === 0 ? (
          <Card className="bg-secondary/30">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No shopping list for this week. Add meals to your plan and save it to generate a shopping list!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {sortedCategories.map(category => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{categoryNames[category as keyof typeof categoryNames]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedItems[category].map(item => (
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
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
