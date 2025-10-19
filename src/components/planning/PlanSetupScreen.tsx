import { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateWeeklyPlan } from '../../data/mockData';
import { BottomNav } from '../shared/BottomNav';

export function PlanSetupScreen() {
  const { setCurrentScreen, setCurrentWeeklyPlan } = useApp();
  const [selectedCuisine, setSelectedCuisine] = useState('');

  const cuisines = [
    { id: 'korean', label: 'Korean', emoji: '🍜' },
    { id: 'thai', label: 'Thai', emoji: '🍛' },
    { id: 'chinese', label: 'Chinese', emoji: '🥡' },
    { id: 'italian', label: 'Italian', emoji: '🍝' },
    { id: 'classics', label: 'Kid-Friendly Classics', emoji: '🍕' },
    { id: 'surprise', label: 'Surprise Me!', emoji: '✨' },
  ];

  const handleFindMeals = () => {
    const cuisine = selectedCuisine === 'surprise' 
      ? cuisines[Math.floor(Math.random() * cuisines.length - 1)].id
      : selectedCuisine;
    
    const plan = generateWeeklyPlan(cuisine);
    setCurrentWeeklyPlan(plan);
    setCurrentScreen('weekly-review');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1>What's the vibe for this week?</h1>
          <p className="text-muted-foreground">Choose a cuisine style for your meal plan</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => setSelectedCuisine(cuisine.id)}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedCuisine === cuisine.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-secondary/30 hover:border-primary/50'
              }`}
            >
              <div className="text-4xl mb-2">{cuisine.emoji}</div>
              <p className="text-sm">{cuisine.label}</p>
            </button>
          ))}
        </div>

        <Button 
          className="w-full"
          onClick={handleFindMeals}
          disabled={!selectedCuisine}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Find Meals
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
