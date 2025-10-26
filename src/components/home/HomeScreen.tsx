import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';
import { useState, useEffect } from 'react';

export function HomeScreen() {
  const { userProfile, currentWeeklyPlan, setCurrentScreen } = useApp();
  const [showContent, setShowContent] = useState(false);
  
  // Small delay to let localStorage/Firebase load before showing content
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, []);
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysPlan = currentWeeklyPlan?.days.find(d => d.day === today);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
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
        ) : currentWeeklyPlan ? (
          // Has a meal plan - show today's plan or weekly plan
          <>
            {todaysPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>Today's Plan ({today})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaysPlan.breakfast.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">Breakfast</p>
                      {todaysPlan.breakfast.map((recipe, i) => (
                        <p key={i} className="font-medium">{recipe.name}</p>
                      ))}
                    </div>
                  )}
                  {todaysPlan.lunch.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">Lunch</p>
                      {todaysPlan.lunch.map((recipe, i) => (
                        <p key={i} className="font-medium">{recipe.name}</p>
                      ))}
                    </div>
                  )}
                  {todaysPlan.dinner.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">Dinner</p>
                      {todaysPlan.dinner.map((recipe, i) => (
                        <p key={i} className="font-medium">{recipe.name}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setCurrentScreen('today')}
                    >
                      Today's Steps
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => setCurrentScreen('weekly-review')}
                    >
                      Edit Week
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Your Weekly Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    You have a saved meal plan for the week!
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setCurrentScreen('weekly-review')}
                  >
                    View & Edit Week
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // No meal plan - show "Plan Your Week" card
          <>
            <Card 
              className="bg-primary text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setCurrentScreen('plan-setup')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <Calendar className="w-6 h-6" />
                  Plan Your Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/90">
                  Get a personalized meal plan with shopping list and prep instructions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No meal plan yet. Start by planning your week!
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
