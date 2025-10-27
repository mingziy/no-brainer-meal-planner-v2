import { useState } from 'react';
import { ChevronRight, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { RecipeDetailsModal } from '../recipe/RecipeDetailsModal';
import { EditTodayMealsModal } from './EditTodayMealsModal';
import { Recipe, QuickFood } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function TodayScreen() {
  const { currentWeeklyPlan, userProfile } = useApp();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
  
  // Get all quick foods from today's plan
  const allQuickFoods = [
    ...(todaysPlan.breakfastQuickFoods || []),
    ...(todaysPlan.lunchQuickFoods || []),
    ...(todaysPlan.dinnerQuickFoods || [])
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
  // Note: caloriesPerServing is already per serving, don't divide again!
  const getAverageCaloriesForMeal = (recipes: Recipe[]) => {
    if (recipes.length === 0) return 0;
    const totalCalories = recipes.reduce((sum, recipe) => {
      return sum + (recipe.caloriesPerServing || 0);
    }, 0);
    return totalCalories / recipes.length;
  };
  
  const breakfastCalories = getAverageCaloriesForMeal(todaysPlan.breakfast);
  const lunchCalories = getAverageCaloriesForMeal(todaysPlan.lunch);
  const dinnerCalories = getAverageCaloriesForMeal(todaysPlan.dinner);
  const snacksCalories = todaysPlan.snacks.reduce((sum, recipe) => {
    return sum + (recipe.caloriesPerServing || 0);
  }, 0);
  
  // Add quick foods calories
  const quickFoodsCalories = allQuickFoods.reduce((sum, food) => sum + food.calories, 0);
  
  const totalCalories = breakfastCalories + lunchCalories + dinnerCalories + snacksCalories + quickFoodsCalories;
  
  console.log('Calorie breakdown:', {
    breakfast: breakfastCalories,
    lunch: lunchCalories,
    dinner: dinnerCalories,
    snacks: snacksCalories,
    total: totalCalories,
    percentage: calculatePercentage(totalCalories, dailyValues.calories),
    barWidth: `${Math.min(calculatePercentage(totalCalories, dailyValues.calories), 100)}%`
  });
  
  // Sum up macronutrients from recipes
  // Note: nutrition values are already per serving, don't divide again!
  const recipeTotals = allRecipes.reduce(
    (acc, recipe) => {
      const protein = recipe.nutrition?.protein || 0;
      const carbs = recipe.nutrition?.carbs || 0;
      const fat = recipe.nutrition?.fat || 0;
      const fiber = recipe.nutrition?.fiber || 0;
      
      console.log(`Recipe: ${recipe.name} - Per serving: Protein: ${protein.toFixed(1)}g, Carbs: ${carbs.toFixed(1)}g, Fat: ${fat.toFixed(1)}g, Fiber: ${fiber.toFixed(1)}g`);
      
      return {
        protein: acc.protein + protein,
        carbs: acc.carbs + carbs,
        fat: acc.fat + fat,
        fiber: acc.fiber + fiber,
      };
    },
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  
  // Add quick foods nutrition
  const quickFoodsTotals = allQuickFoods.reduce(
    (acc, food) => ({
      protein: acc.protein + food.nutrition.protein,
      carbs: acc.carbs + food.nutrition.carbs,
      fat: acc.fat + food.nutrition.fat,
      fiber: acc.fiber + food.nutrition.fiber,
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  
  // Combine recipes + quick foods
  const dailyTotals = {
    protein: recipeTotals.protein + quickFoodsTotals.protein,
    carbs: recipeTotals.carbs + quickFoodsTotals.carbs,
    fat: recipeTotals.fat + quickFoodsTotals.fat,
    fiber: recipeTotals.fiber + quickFoodsTotals.fiber,
  };
  
  console.log('Daily nutrition totals (recipes + quick foods):', dailyTotals);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1>Today's Meals: {today}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Meals
            </Button>
          </div>
          <p className="text-muted-foreground">
            Everything you need for today's nutrition
          </p>
        </div>

        {/* Breakfast Section */}
        <MealSection
          title="Breakfast"
          recipes={todaysPlan.breakfast}
          quickFoods={todaysPlan.breakfastQuickFoods}
          onRecipeClick={setSelectedRecipe}
        />

        {/* Lunch Section */}
        <MealSection
          title="Lunch"
          recipes={todaysPlan.lunch}
          quickFoods={todaysPlan.lunchQuickFoods}
          onRecipeClick={setSelectedRecipe}
        />

        {/* Dinner Section */}
        <MealSection
          title="Dinner"
          recipes={todaysPlan.dinner}
          quickFoods={todaysPlan.dinnerQuickFoods}
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

      {/* Edit Today's Meals Modal */}
      {todaysPlan && (
        <EditTodayMealsModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          dayPlan={todaysPlan}
          dayName={today}
        />
      )}
    </div>
  );
}

// Meal Section Component - displays a meal with multiple recipe cards + quick foods
interface MealSectionProps {
  title: string;
  recipes: Recipe[];
  quickFoods?: QuickFood[];
  onRecipeClick: (recipe: Recipe) => void;
}

function MealSection({ title, recipes, quickFoods = [], onRecipeClick }: MealSectionProps) {
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
        {recipes.map((recipe) => {
          // caloriesPerServing is already per serving, no need to divide
          const perServingCalories = Math.round(recipe.caloriesPerServing);
          
          return (
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
                  {perServingCalories} cal/serving
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          );
        })}
        
        {/* Quick Foods - smaller bullets */}
        {quickFoods.length > 0 && (
          <div className="pl-8 space-y-2">
            {quickFoods.map((food, index) => (
              <div key={`${food.id}-${index}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                <span className="text-base">{food.emoji}</span>
                <span>{food.name}</span>
                <span className="text-xs">({food.calories} cal)</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
