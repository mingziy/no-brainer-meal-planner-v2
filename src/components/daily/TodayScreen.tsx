import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { RecipeDetailsModal } from '../recipe/RecipeDetailsModal';
import { Recipe } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function TodayScreen() {
  const { currentWeeklyPlan, userProfile } = useApp();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

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

  // Calculate daily totals from all recipes in all meals
  const allRecipes = [
    ...todaysPlan.breakfast,
    ...todaysPlan.lunch,
    ...todaysPlan.dinner,
    ...todaysPlan.snacks
  ];
  
  // FDA Daily Values (based on 2000 calorie diet)
  const dailyValues = {
    calories: 2000,
    protein: 50, // grams
    carbs: 275, // grams
    fat: 78, // grams
    fiber: 28, // grams
  };
  
  // Calculate percentages
  const calculatePercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((current / target) * 100);
  };
  
  // Calculate average calories per meal (assuming 1 serving each)
  const getAverageCaloriesForMeal = (recipes: Recipe[]) => {
    if (recipes.length === 0) return 0;
    const totalCalories = recipes.reduce((sum, recipe) => sum + (recipe.caloriesPerServing || 0), 0);
    return totalCalories / recipes.length;
  };
  
  const breakfastCalories = getAverageCaloriesForMeal(todaysPlan.breakfast);
  const lunchCalories = getAverageCaloriesForMeal(todaysPlan.lunch);
  const dinnerCalories = getAverageCaloriesForMeal(todaysPlan.dinner);
  const snacksCalories = todaysPlan.snacks.reduce((sum, recipe) => sum + (recipe.caloriesPerServing || 0), 0);
  const totalCalories = breakfastCalories + lunchCalories + dinnerCalories + snacksCalories;
  
  console.log('Calorie breakdown:', {
    breakfast: breakfastCalories,
    lunch: lunchCalories,
    dinner: dinnerCalories,
    snacks: snacksCalories,
    total: totalCalories,
    percentage: calculatePercentage(totalCalories, dailyValues.calories),
    barWidth: `${Math.min(calculatePercentage(totalCalories, dailyValues.calories), 100)}%`
  });
  
  // Sum up macronutrients (protein, carbs, fat, fiber) from all recipes
  const dailyTotals = allRecipes.reduce(
    (acc, recipe) => ({
      protein: acc.protein + (recipe.nutrition.protein || 0),
      carbs: acc.carbs + (recipe.nutrition.carbs || 0),
      fat: acc.fat + (recipe.nutrition.fat || 0),
      fiber: acc.fiber + (recipe.nutrition.fiber || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1>Today's Meals: {today}</h1>
          <p className="text-muted-foreground">
            Everything you need for today's nutrition
          </p>
        </div>

        {/* Breakfast Section */}
        <MealSection
          title="Breakfast"
          recipes={todaysPlan.breakfast}
          onRecipeClick={setSelectedRecipe}
        />

        {/* Lunch Section */}
        <MealSection
          title="Lunch"
          recipes={todaysPlan.lunch}
          onRecipeClick={setSelectedRecipe}
        />

        {/* Dinner Section */}
        <MealSection
          title="Dinner"
          recipes={todaysPlan.dinner}
          onRecipeClick={setSelectedRecipe}
        />

        {/* Daily Nutrition Progress */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3>Daily Nutrition Goals</h3>
              <span className="text-xs text-muted-foreground">Based on 2000 cal/day</span>
            </div>

            {/* Calories */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Calories</span>
                <span>
                  <span className="text-primary font-bold">{Math.round(totalCalories)} cal</span>
                  <span className="text-muted-foreground"> / {dailyValues.calories} cal</span>
                </span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all rounded-full"
                  style={{ width: `${Math.min(calculatePercentage(totalCalories, dailyValues.calories), 100)}%` }}
                />
              </div>
              <p className="text-xs text-right text-primary">
                {calculatePercentage(totalCalories, dailyValues.calories)}% of daily value
              </p>
            </div>

            <div className="space-y-3">
              {/* Protein Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Protein</span>
                  <span>
                    <span className="text-primary">{Math.round(dailyTotals.protein)}g</span>
                    <span className="text-muted-foreground"> / {dailyValues.protein}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.protein, dailyValues.protein), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.protein, dailyValues.protein)}% DV
                </p>
              </div>

              {/* Carbs Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Carbohydrates</span>
                  <span>
                    <span className="text-primary">{Math.round(dailyTotals.carbs)}g</span>
                    <span className="text-muted-foreground"> / {dailyValues.carbs}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.carbs, dailyValues.carbs), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.carbs, dailyValues.carbs)}% DV
                </p>
              </div>

              {/* Fat Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Fat</span>
                  <span>
                    <span className="text-primary">{Math.round(dailyTotals.fat)}g</span>
                    <span className="text-muted-foreground"> / {dailyValues.fat}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.fat, dailyValues.fat), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.fat, dailyValues.fat)}% DV
                </p>
              </div>

              {/* Fiber Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Dietary Fiber</span>
                  <span>
                    <span className="text-primary">{Math.round(dailyTotals.fiber)}g</span>
                    <span className="text-muted-foreground"> / {dailyValues.fiber}g</span>
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all rounded-full"
                    style={{ width: `${Math.min(calculatePercentage(dailyTotals.fiber, dailyValues.fiber), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-right text-primary">
                  {calculatePercentage(dailyTotals.fiber, dailyValues.fiber)}% DV
                </p>
              </div>
            </div>

            {calculatePercentage(totalCalories, dailyValues.calories) >= 80 &&
             calculatePercentage(totalCalories, dailyValues.calories) <= 120 &&
             calculatePercentage(dailyTotals.protein, dailyValues.protein) >= 80 ? (
              <p className="text-sm text-center text-primary pt-2">
                ✨ Excellent! You're meeting your daily nutrition goals!
              </p>
            ) : calculatePercentage(totalCalories, dailyValues.calories) < 80 ? (
              <p className="text-sm text-center text-muted-foreground pt-2">
                Add more meals to reach your calorie goals.
              </p>
            ) : (
              <p className="text-sm text-center text-muted-foreground pt-2">
                Great progress! Keep balanced nutrition in mind.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />

      {selectedRecipe && (
        <RecipeDetailsModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}

// Meal Section Component - displays a meal with multiple recipe cards
interface MealSectionProps {
  title: string;
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
}

function MealSection({ title, recipes, onRecipeClick }: MealSectionProps) {
  if (recipes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No recipes planned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onRecipeClick(recipe)}
            className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors"
          >
            <ImageWithFallback
              src={recipe.image}
              alt={recipe.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h4 className="font-medium">{recipe.name}</h4>
              <p className="text-sm text-muted-foreground">
                {recipe.prepTime + recipe.cookTime} min • {recipe.caloriesPerServing} cal/serving
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
