import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Meal } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useApp } from '../../context/AppContext';
import { getDailyRecommendations, getAgeLabel, calculatePercentage } from '../../utils/nutritionRecommendations';

interface AssemblyModalProps {
  meal: Meal;
  mealType: string;
  onClose: () => void;
}

export function AssemblyModal({ meal, mealType, onClose }: AssemblyModalProps) {
  const { userProfile } = useApp();
  const [marked, setMarked] = useState(false);
  
  // Get the youngest child's age for recommendations
  const childAge = userProfile?.kidsAges?.[0] || 5;
  const recommendations = getDailyRecommendations(childAge);
  const ageLabel = getAgeLabel(childAge);

  const handleMarkEaten = () => {
    setMarked(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const { protein, veggies, carbs, fats } = meal.plateComposition;
  const total = protein + veggies + carbs + fats;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mealType} Assembly (5 min)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!marked ? (
            <>
              <div className="space-y-3">
                <h3>Step 1: Grab Your Prep</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 p-3 bg-secondary/30 rounded-lg">
                    <span className="text-muted-foreground">•</span>
                    <span>Take 1 portion of '{meal.name}' from the fridge.</span>
                  </li>
                  <li className="flex items-start gap-2 p-3 bg-secondary/30 rounded-lg">
                    <span className="text-muted-foreground">•</span>
                    <span>Take 1 portion of chopped vegetables.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3>Step 2: Final Steps</h3>
                <ol className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      1
                    </span>
                    <span className="flex-1">Microwave the main dish for 90 seconds, covered.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      2
                    </span>
                    <span className="flex-1">Heat vegetables (steam or microwave for 2 minutes).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      3
                    </span>
                    <span className="flex-1">Combine on a plate. Done!</span>
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-primary">Today's Plate</h4>
                  <span className="text-xs text-primary/70">For child {ageLabel}</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm">Daily Nutrition Goals</h4>
                  
                  {/* Protein Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Protein</span>
                      <span>
                        <span className="text-primary">{meal.nutrition.protein}g</span>
                        <span className="text-muted-foreground"> / {recommendations.protein}g daily</span>
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(meal.nutrition.protein, recommendations.protein), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-primary">
                      {calculatePercentage(meal.nutrition.protein, recommendations.protein)}% of daily goal
                    </p>
                  </div>

                  {/* Grains Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Grains</span>
                      <span>
                        <span className="text-primary">{meal.nutrition.carbs}g</span>
                        <span className="text-muted-foreground"> / {recommendations.grains}g daily</span>
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full transition-all rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(meal.nutrition.carbs, recommendations.grains), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-primary">
                      {calculatePercentage(meal.nutrition.carbs, recommendations.grains)}% of daily goal
                    </p>
                  </div>

                  {/* Fruits Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Fruits</span>
                      <span>
                        <span className="text-primary">{Math.round(meal.nutrition.fiber * 0.4)}g</span>
                        <span className="text-muted-foreground"> / {recommendations.fruits}g daily</span>
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full transition-all rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(Math.round(meal.nutrition.fiber * 0.4), recommendations.fruits), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-primary">
                      {calculatePercentage(Math.round(meal.nutrition.fiber * 0.4), recommendations.fruits)}% of daily goal
                    </p>
                  </div>

                  {/* Vegetables Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Vegetables</span>
                      <span>
                        <span className="text-primary">{Math.round(meal.nutrition.fiber * 0.6)}g</span>
                        <span className="text-muted-foreground"> / {recommendations.vegetables}g daily</span>
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-green-500 h-full transition-all rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(Math.round(meal.nutrition.fiber * 0.6), recommendations.vegetables), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-primary">
                      {calculatePercentage(Math.round(meal.nutrition.fiber * 0.6), recommendations.vegetables)}% of daily goal
                    </p>
                  </div>

                  {/* Fat Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Fat</span>
                      <span>
                        <span className="text-primary">{meal.nutrition.fat}g</span>
                        <span className="text-muted-foreground"> / {recommendations.fat}g daily</span>
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-full transition-all rounded-full"
                        style={{ width: `${Math.min(calculatePercentage(meal.nutrition.fat, recommendations.fat), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-primary">
                      {calculatePercentage(meal.nutrition.fat, recommendations.fat)}% of daily goal
                    </p>
                  </div>
                </div>

                <p className="text-sm text-center text-primary pt-2">
                  ✨ Nailed it! A perfectly balanced, nutritious meal.
                </p>
              </div>

              <div className="p-3 bg-accent rounded-lg">
                <p className="text-sm">
                  <span className="text-primary">💡 Tip:</span> Want to add a boost? Add a sprinkle of sesame seeds for extra nutrients!
                </p>
              </div>

              <Button className="w-full" onClick={handleMarkEaten}>
                Mark as Eaten
              </Button>
            </>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </div>
              <h3>Great job!</h3>
              <p className="text-muted-foreground">
                You've completed another nutritious meal
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
