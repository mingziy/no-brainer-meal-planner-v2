import { UtensilsCrossed } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';

export function SplashScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1>No Brainer Meal Planner</h1>
          <p className="text-muted-foreground">
            Healthy meals for your kids, without the guesswork.
          </p>
        </div>

        <div className="space-y-3 pt-8">
          <Button 
            className="w-full"
            onClick={() => setCurrentScreen('welcome')}
          >
            Sign Up
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setCurrentScreen('welcome')}
          >
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
}
