import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { MealCard } from '../shared/MealCard';
import { AssemblyModal } from './AssemblyModal';
import { Meal } from '../../types';
import { getDailyRecommendations, getAgeLabel, calculatePercentage } from '../../utils/nutritionRecommendations';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function TodayScreen() {
  const { currentWeeklyPlan, userProfile } = useApp();
  const [selectedMeal, setSelectedMeal] = useState<{ meal: Meal; type: string } | null>(null);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysPlan = currentWeeklyPlan?.days.find(d => d.day === today);

  if (!todaysPlan) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto p-6">
          <p className="text-center text-muted-foreground">No meal plan for today</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Calculate daily totals from all meals
  const allMeals = [todaysPlan.breakfast, todaysPlan.lunch, todaysPlan.dinner, ...todaysPlan.snacks];
  const dailyTotals = allMeals.reduce(
    (acc, meal) => ({
      protein: acc.protein + meal.nutrition.protein,
      grains: acc.grains + meal.nutrition.carbs,
      fruits: acc.fruits + Math.round(meal.nutrition.fiber * 0.4),
      vegetables: acc.vegetables + Math.round(meal.nutrition.fiber * 0.6),
      fat: acc.fat + meal.nutrition.fat,
    }),
    { protein: 0, grains: 0, fruits: 0, vegetables: 0, fat: 0 }
  );

  // Get child's age and recommendations
  const childAge = userProfile?.kidsAges?.[0] || 5;
  const recommendations = getDailyRecommendations(childAge);
  const ageLabel = getAgeLabel(childAge);

  // Get first snack for the 2x2 grid
  const firstSnack = todaysPlan.snacks[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1>Today's Meals: {today}</h1>
          <p className="text-muted-foreground">
            Everything you need for today's nutrition
          </p>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Breakfast */}
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedMeal({ meal: todaysPlan.breakfast, type: 'Breakfast' })}
          >
            <CardContent className="p-3 space-y-2">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <ImageWithFallback
                  src={todaysPlan.breakfast.image}
                  alt={todaysPlan.breakfast.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm">Breakfast</h4>
                <p className="text-xs text-muted-foreground truncate">{todaysPlan.breakfast.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Snack */}
          {firstSnack && (
            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedMeal({ meal: firstSnack, type: 'Snack' })}
            >
              <CardContent className="p-3 space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={firstSnack.image}
                    alt={firstSnack.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm">Snack</h4>
                  <p className="text-xs text-muted-foreground truncate">{firstSnack.name}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lunch */}
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedMeal({ meal: todaysPlan.lunch, type: 'Lunch' })}
          >
            <CardContent className="p-3 space-y-2">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <ImageWithFallback
                  src={todaysPlan.lunch.image}
                  alt={todaysPlan.lunch.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm">Lunch</h4>
                <p className="text-xs text-muted-foreground truncate">{todaysPlan.lunch.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dinner */}
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedMeal({ meal: todaysPlan.dinner, type: 'Dinner' })}
          >
            <CardContent className="p-3 space-y-2">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <ImageWithFallback
                  src={todaysPlan.dinner.image}
                  alt={todaysPlan.dinner.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm">Dinner</h4>
                <p className="text-xs text-muted-foreground truncate">{todaysPlan.dinner.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Nutrition Progress */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3>Daily Nutrition Goals</h3>
              <span className="text-xs text-muted-foreground">For child {ageLabel}</span>
            </div>

            <div className="space-y-3">
              {/* Protein Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Protein</span>
                  <span>
                    <span className="text-primary">{dailyTotals.protein}g</span>
                    <span className="text-muted-foreground"> / {recommendations.protein}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.protein, recommendations.protein), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.protein, recommendations.protein)}% complete
                </p>
              </div>

              {/* Grains Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Grains</span>
                  <span>
                    <span className="text-primary">{dailyTotals.grains}g</span>
                    <span className="text-muted-foreground"> / {recommendations.grains}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.grains, recommendations.grains), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.grains, recommendations.grains)}% complete
                </p>
              </div>

              {/* Fruits Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fruits</span>
                  <span>
                    <span className="text-primary">{dailyTotals.fruits}g</span>
                    <span className="text-muted-foreground"> / {recommendations.fruits}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.fruits, recommendations.fruits), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.fruits, recommendations.fruits)}% complete
                </p>
              </div>

              {/* Vegetables Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Vegetables</span>
                  <span>
                    <span className="text-primary">{dailyTotals.vegetables}g</span>
                    <span className="text-muted-foreground"> / {recommendations.vegetables}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.vegetables, recommendations.vegetables), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.vegetables, recommendations.vegetables)}% complete
                </p>
              </div>

              {/* Fat Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fat</span>
                  <span>
                    <span className="text-primary">{dailyTotals.fat}g</span>
                    <span className="text-muted-foreground"> / {recommendations.fat}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.fat, recommendations.fat), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.fat, recommendations.fat)}% complete
                </p>
              </div>
            </div>

            {calculatePercentage(dailyTotals.protein, recommendations.protein) >= 90 &&
             calculatePercentage(dailyTotals.grains, recommendations.grains) >= 90 &&
             calculatePercentage(dailyTotals.vegetables, recommendations.vegetables) >= 70 ? (
              <p className="text-sm text-center text-primary pt-2">
                ✨ Excellent! You're meeting your child's daily nutrition goals!
              </p>
            ) : (
              <p className="text-sm text-center text-muted-foreground pt-2">
                Keep going! Every meal gets you closer to your goals.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />

      {selectedMeal && (
        <AssemblyModal
          meal={selectedMeal.meal}
          mealType={selectedMeal.type}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  );
}
