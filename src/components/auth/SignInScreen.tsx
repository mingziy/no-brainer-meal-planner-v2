import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChefHat, Loader2 } from 'lucide-react';

export function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // This will redirect to Google sign-in page
      await signInWithGoogle();
      // Note: setIsLoading(false) won't be reached because page will redirect
    } catch (error) {
      console.error('Failed to sign in:', error);
      alert('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to Meal Planner</CardTitle>
            <CardDescription className="mt-2">
              Sign in to save and sync your recipes across all your devices
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Save recipes to the cloud</li>
              <li>Access from any device</li>
              <li>Share recipes with friends</li>
              <li>AI-powered recipe extraction</li>
              <li>Support for Chinese and English recipes</li>
            </ul>
          </div>

          <Button 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

