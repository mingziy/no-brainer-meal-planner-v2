import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Clock, Beef, Leaf, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function CookingStyleScreen() {
  const { setCurrentScreen, userProfile, setUserProfile } = useApp();
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const goals = [
    { id: 'quick', label: 'Quickest Meals Possible', icon: Clock },
    { id: 'protein', label: 'High Protein', icon: Beef },
    { id: 'veggies', label: 'More Veggies', icon: Leaf },
    { id: 'balanced', label: 'Balanced Variety', icon: Scale },
  ];

  const handleComplete = () => {
    setUserProfile({
      ...userProfile,
      cookingGoal: selectedGoal as any,
      hasCompletedOnboarding: true,
    } as any);
    
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <h1>What are your goals?</h1>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                  selectedGoal === goal.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-secondary/30 hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedGoal === goal.id ? 'bg-primary text-primary-foreground' : 'bg-accent'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span>{goal.label}</span>
              </button>
            );
          })}
        </div>

        <Button 
          className="w-full"
          onClick={handleComplete}
          disabled={!selectedGoal}
        >
          All Set! Let's Plan
        </Button>
      </div>
    </div>
  );
}
