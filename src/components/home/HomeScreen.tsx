import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';

export function HomeScreen() {
  const { userProfile, currentWeeklyPlan, setCurrentScreen } = useApp();
  
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

        {todaysPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Breakfast</p>
                <p>{todaysPlan.breakfast.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Lunch</p>
                <p>{todaysPlan.lunch.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Dinner</p>
                <p>{todaysPlan.dinner.name}</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setCurrentScreen('today')}
              >
                See Today's Steps
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {!currentWeeklyPlan && (
          <Card className="bg-secondary/30">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No meal plan yet. Start by planning your week!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
