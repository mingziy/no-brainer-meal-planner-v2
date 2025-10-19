import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { useApp } from '../../context/AppContext';
import { mockMeals } from '../../data/mockData';
import { MealCard } from '../shared/MealCard';
import { Meal } from '../../types';

interface SwapMealModalProps {
  onClose: () => void;
  dayIndex: number;
  mealType: string;
}

export function SwapMealModal({ onClose, dayIndex, mealType }: SwapMealModalProps) {
  const { currentWeeklyPlan, setCurrentWeeklyPlan } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentWeeklyPlan) return null;

  const currentMeal = currentWeeklyPlan.days[dayIndex][mealType as keyof typeof currentWeeklyPlan.days[0]];
  
  // Get alternative meals based on meal type
  let alternatives: Meal[] = [];
  if (mealType === 'breakfast') {
    alternatives = mockMeals.breakfast;
  } else if (mealType === 'snacks') {
    alternatives = mockMeals.snacks;
  } else {
    // Combine all cuisine meals for lunch/dinner
    alternatives = [...mockMeals.korean, ...mockMeals.italian];
  }

  const filteredAlternatives = alternatives.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMeal = (newMeal: Meal) => {
    const updatedPlan = { ...currentWeeklyPlan };
    if (mealType === 'snacks') {
      updatedPlan.days[dayIndex].snacks = [newMeal, ...updatedPlan.days[dayIndex].snacks.slice(1)];
    } else {
      (updatedPlan.days[dayIndex] as any)[mealType] = newMeal;
    }
    setCurrentWeeklyPlan(updatedPlan);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Swap Meal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlternatives.map((meal) => (
              <div
                key={meal.id}
                onClick={() => handleSelectMeal(meal)}
                className="cursor-pointer"
              >
                <MealCard meal={meal} showActions={false} />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
