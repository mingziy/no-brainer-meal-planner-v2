import { Calendar, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';
import { useState, useEffect } from 'react';

export function HomeScreen() {
  const { 
    userProfile, 
    currentWeeklyPlan, 
    setCurrentScreen,
    setPlanningWeekOffset,
    setViewingDayOffset,
    getWeekStart,
    getNextWeekPlan,
    getThisWeekPlan
  } = useApp();
  
  const [showContent, setShowContent] = useState(false);
  
  // Small delay to let localStorage/Firebase load before showing content
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, []);
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const thisWeekPlan = getThisWeekPlan();
  const nextWeekPlan = getNextWeekPlan();
  
  // Check if plans are completely empty (all days have no meals)
  const isThisWeekPlanEmpty = thisWeekPlan ? thisWeekPlan.days.every(day => 
    day.breakfast.length === 0 && 
    day.lunch.length === 0 && 
    day.dinner.length === 0 && 
    (day.snacks?.length || 0) === 0
  ) : true;
  
  const isNextWeekPlanEmpty = nextWeekPlan ? nextWeekPlan.days.every(day => 
    day.breakfast.length === 0 && 
    day.lunch.length === 0 && 
    day.dinner.length === 0 && 
    (day.snacks?.length || 0) === 0
  ) : true;
  
  // Get today's and tomorrow's plans
  const todaysPlan = thisWeekPlan?.days.find(d => d.day === today);
  
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Check if tomorrow is in next week (if today is Sunday and tomorrow is Monday)
  const todayDate = new Date();
  const isTomorrowNextWeek = todayDate.getDay() === 0; // Sunday = 0
  
  // Get tomorrow's plan from the correct week
  const tomorrowsPlan = isTomorrowNextWeek 
    ? nextWeekPlan?.days.find(d => d.day === tomorrowDay)
    : thisWeekPlan?.days.find(d => d.day === tomorrowDay);
  
  // Check if today/tomorrow have meals
  const hasTodayMeals = todaysPlan && (
    todaysPlan.breakfast.length > 0 || 
    todaysPlan.lunch.length > 0 || 
    todaysPlan.dinner.length > 0
  );
  
  const hasTomorrowMeals = tomorrowsPlan && (
    tomorrowsPlan.breakfast.length > 0 || 
    tomorrowsPlan.lunch.length > 0 || 
    tomorrowsPlan.dinner.length > 0
  );
  
  // Get all 7 days for the week overview
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Determine which day of the week today is
  const todayIndex = weekDays.indexOf(today);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1>Hi {userProfile?.name || 'there'}!</h1>
            <p className="text-muted-foreground">Ready to plan some delicious meals?</p>
          </div>
          <UserButton />
        </div>

        {!showContent ? (
          // Brief loading to prevent flash
          <div className="h-32" />
        ) : (
          <>
            {/* Today's Plan Card */}
            {hasTodayMeals ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>🌟 Today ({today})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Breakfast */}
                  {todaysPlan!.breakfast.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">Breakfast</p>
                      {todaysPlan!.breakfast.map((recipe, i) => (
                        <p key={i} className="text-sm pl-2">• {recipe.name}</p>
                      ))}
                      {todaysPlan!.breakfastQuickFoods && todaysPlan!.breakfastQuickFoods.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          {todaysPlan!.breakfastQuickFoods.map((food, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {food.emoji} {food.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Lunch */}
                  {todaysPlan!.lunch.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">Lunch</p>
                      {todaysPlan!.lunch.map((recipe, i) => (
                        <p key={i} className="text-sm pl-2">• {recipe.name}</p>
                      ))}
                      {todaysPlan!.lunchQuickFoods && todaysPlan!.lunchQuickFoods.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          {todaysPlan!.lunchQuickFoods.map((food, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {food.emoji} {food.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Dinner */}
                  {todaysPlan!.dinner.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">Dinner</p>
                      {todaysPlan!.dinner.map((recipe, i) => (
                        <p key={i} className="text-sm pl-2">• {recipe.name}</p>
                      ))}
                      {todaysPlan!.dinnerQuickFoods && todaysPlan!.dinnerQuickFoods.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          {todaysPlan!.dinnerQuickFoods.map((food, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {food.emoji} {food.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action button */}
                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setViewingDayOffset(0);
                        setCurrentScreen('today');
                      }}
                    >
                      View Today's Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // No meals for today - CTA
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Today's Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Plan your meals for today to stay on track
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setViewingDayOffset(0);
                      setCurrentScreen('today');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Plan Today
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tomorrow's Plan Card */}
            {hasTomorrowMeals ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>🔮 Tomorrow ({tomorrowDay})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Breakfast */}
                  {tomorrowsPlan!.breakfast.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">Breakfast</p>
                      {tomorrowsPlan!.breakfast.map((recipe, i) => (
                        <p key={i} className="text-sm pl-2">• {recipe.name}</p>
                      ))}
                      {tomorrowsPlan!.breakfastQuickFoods && tomorrowsPlan!.breakfastQuickFoods.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          {tomorrowsPlan!.breakfastQuickFoods.map((food, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {food.emoji} {food.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Lunch */}
                  {tomorrowsPlan!.lunch.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">Lunch</p>
                      {tomorrowsPlan!.lunch.map((recipe, i) => (
                        <p key={i} className="text-sm pl-2">• {recipe.name}</p>
                      ))}
                      {tomorrowsPlan!.lunchQuickFoods && tomorrowsPlan!.lunchQuickFoods.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          {tomorrowsPlan!.lunchQuickFoods.map((food, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {food.emoji} {food.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Dinner */}
                  {tomorrowsPlan!.dinner.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm font-medium">Dinner</p>
                      {tomorrowsPlan!.dinner.map((recipe, i) => (
                        <p key={i} className="text-sm pl-2">• {recipe.name}</p>
                      ))}
                      {tomorrowsPlan!.dinnerQuickFoods && tomorrowsPlan!.dinnerQuickFoods.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          {tomorrowsPlan!.dinnerQuickFoods.map((food, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {food.emoji} {food.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action button */}
                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setViewingDayOffset(1);
                        setCurrentScreen('today');
                      }}
                    >
                      View Tomorrow's Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // No meals for tomorrow - CTA
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Tomorrow's Meals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Plan ahead for tomorrow and stay prepared
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setViewingDayOffset(1);
                      setCurrentScreen('today');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Plan Tomorrow
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* This Week's Plan Card */}
            {isThisWeekPlanEmpty ? (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add This Week's Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get started with a personalized meal plan for this week
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setPlanningWeekOffset(0); // This week
                      setCurrentScreen('weekly-review');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Plan This Week
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>📋 This Week's Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weekDays.map((day, index) => {
                    const dayPlan = thisWeekPlan?.days[index];
                    const hasRecipes = dayPlan && (
                      dayPlan.breakfast.length > 0 || 
                      dayPlan.lunch.length > 0 || 
                      dayPlan.dinner.length > 0 || 
                      dayPlan.snacks.length > 0
                    );
                    const isToday = index === todayIndex;
                    const isPast = index < todayIndex;
                    
                    return (
                      <div key={day} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`${isToday ? 'font-bold text-primary' : ''} min-w-[80px]`}>
                            {day}
                          </span>
                          <span className="flex-1 border-b border-dashed"></span>
                          <span>
                            {isToday && '• '}
                            {isPast && hasRecipes && '✓ '}
                            {!isPast && !isToday && hasRecipes && '📝 '}
                            {!hasRecipes && '⚪ '}
                          </span>
                        </div>
                        {/* Meal preview */}
                        {dayPlan && hasRecipes && (
                          <div className="pl-4 space-y-0.5 text-xs text-muted-foreground">
                            {dayPlan.breakfast.length > 0 && (
                              <p>B: {dayPlan.breakfast.map(r => r.name).join(', ')}</p>
                            )}
                            {dayPlan.lunch.length > 0 && (
                              <p>L: {dayPlan.lunch.map(r => r.name).join(', ')}</p>
                            )}
                            {dayPlan.dinner.length > 0 && (
                              <p>D: {dayPlan.dinner.map(r => r.name).join(', ')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      setPlanningWeekOffset(0); // This week
                      setCurrentScreen('weekly-review');
                    }}
                  >
                    Edit This Week
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Next Week - CTA or Plan Preview */}
            {isNextWeekPlanEmpty ? (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Next Week's Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stay ahead of the game and plan for next week
                  </p>
                  <Button 
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setPlanningWeekOffset(1); // Next week
                      setCurrentScreen('weekly-review');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Plan Next Week
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>📅 Next Week's Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weekDays.map((day, index) => {
                    const dayPlan = nextWeekPlan?.days[index];
                    const hasRecipes = dayPlan && (
                      dayPlan.breakfast.length > 0 || 
                      dayPlan.lunch.length > 0 || 
                      dayPlan.dinner.length > 0 || 
                      dayPlan.snacks.length > 0
                    );
                    
                    return (
                      <div key={day} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="min-w-[80px]">{day}</span>
                          <span className="flex-1 border-b border-dashed"></span>
                          <span>
                            {hasRecipes ? '📝 ' : '⚪ '}
                          </span>
                        </div>
                        {/* Meal preview */}
                        {dayPlan && hasRecipes && (
                          <div className="pl-4 space-y-0.5 text-xs text-muted-foreground">
                            {dayPlan.breakfast.length > 0 && (
                              <p>B: {dayPlan.breakfast.map(r => r.name).join(', ')}</p>
                            )}
                            {dayPlan.lunch.length > 0 && (
                              <p>L: {dayPlan.lunch.map(r => r.name).join(', ')}</p>
                            )}
                            {dayPlan.dinner.length > 0 && (
                              <p>D: {dayPlan.dinner.map(r => r.name).join(', ')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      setPlanningWeekOffset(1); // Next week
                      setCurrentScreen('weekly-review');
                    }}
                  >
                    Edit Next Week
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
