import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { MealCard } from '../shared/MealCard';
import { BottomNav } from '../shared/BottomNav';
import { MealDetailsModal } from './MealDetailsModal';
import { SwapMealModal } from './SwapMealModal';
import { Meal } from '../../types';
import { RotateCcw } from 'lucide-react';
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

export function WeeklyReviewScreen() {
  const { currentWeeklyPlan, setCurrentScreen, setShoppingList, saveMealPlan } = useApp();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapContext, setSwapContext] = useState<{ dayIndex: number; mealType: string } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  if (!currentWeeklyPlan) return null;

  const handleViewInfo = (meal: Meal) => {
    setSelectedMeal(meal);
  };

  const handleSwap = (dayIndex: number, mealType: string) => {
    setSwapContext({ dayIndex, mealType });
    setShowSwapModal(true);
  };

  const handleCreateShoppingList = () => {
    // Generate shopping list from weekly plan (simplified)
    const mockItems = [
      { id: '1', name: 'Broccoli', quantity: '2 crowns', category: 'produce' as const, checked: false },
      { id: '2', name: 'Garlic', quantity: '3 heads', category: 'produce' as const, checked: false },
      { id: '3', name: 'Apples', quantity: '1 bag', category: 'produce' as const, checked: false },
      { id: '4', name: 'Chicken Breast', quantity: '4 lbs', category: 'meat' as const, checked: false },
      { id: '5', name: 'Pasta', quantity: '1 box', category: 'pantry' as const, checked: false },
    ];
    setShoppingList(mockItems);
    setCurrentScreen('shopping-list');
  };

  const handleResetWeeklyPlan = async () => {
    if (!currentWeeklyPlan) return;

    const updatedDays = currentWeeklyPlan.days.map(day => ({
      ...day,
      breakfast: [],
      breakfastQuickFoods: [],
      lunch: [],
      lunchQuickFoods: [],
      dinner: [],
      dinnerQuickFoods: [],
    }));

    const updatedPlan = {
      ...currentWeeklyPlan,
      days: updatedDays,
    };

    await saveMealPlan(updatedPlan);
    setIsResetDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1>Your Weekly Plan</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDialogOpen(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <p className="text-muted-foreground">
            Review your meals and make any swaps you'd like
          </p>
        </div>

        <div className="space-y-4">
          {currentWeeklyPlan.days.map((day, dayIndex) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle>{day.day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Breakfast</p>
                  <MealCard
                    meal={day.breakfast}
                    onViewInfo={() => handleViewInfo(day.breakfast)}
                    onSwap={() => handleSwap(dayIndex, 'breakfast')}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Lunch</p>
                  <MealCard
                    meal={day.lunch}
                    onViewInfo={() => handleViewInfo(day.lunch)}
                    onSwap={() => handleSwap(dayIndex, 'lunch')}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Dinner</p>
                  <MealCard
                    meal={day.dinner}
                    onViewInfo={() => handleViewInfo(day.dinner)}
                    onSwap={() => handleSwap(dayIndex, 'dinner')}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Snacks</p>
                  <div className="space-y-2">
                    {day.snacks.map((snack) => (
                      <MealCard
                        key={snack.id}
                        meal={snack}
                        onViewInfo={() => handleViewInfo(snack)}
                        showActions={false}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" onClick={handleCreateShoppingList}>
          This looks great! Create Shopping List
        </Button>
      </div>

      <BottomNav />

      {selectedMeal && (
        <MealDetailsModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onSwap={() => {
            setShowSwapModal(true);
            setSelectedMeal(null);
          }}
        />
      )}

      {showSwapModal && swapContext && (
        <SwapMealModal
          onClose={() => setShowSwapModal(false)}
          dayIndex={swapContext.dayIndex}
          mealType={swapContext.mealType}
        />
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
