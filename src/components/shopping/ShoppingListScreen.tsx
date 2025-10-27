import { Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { useEffect, useState } from 'react';
import { ShoppingItem, WeeklyPlan } from '../../types';

export function ShoppingListScreen() {
  const { 
    shoppingList, 
    setShoppingList, 
    setCurrentScreen, 
    currentWeeklyPlan,
    mealPlans,
    getThisWeekPlan,
    getNextWeekPlan
  } = useApp();
  
  const [selectedWeekPlanId, setSelectedWeekPlanId] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<WeeklyPlan | null>(null);
  
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
          <h1>Shopping List</h1>
          <p className="text-muted-foreground">
            Check off items you already have at home
          </p>
        </div>

        {/* Week Selector */}
        {uniqueWeekPlans.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Week</label>
                <Select value={selectedWeekPlanId} onValueChange={handleWeekChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a week" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueWeekPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.weekLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
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

            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={handleExportList}>
                <Share2 className="w-4 h-4 mr-2" />
                Export List
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
