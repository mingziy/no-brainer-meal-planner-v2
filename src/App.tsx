import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { SignInScreen } from './components/auth/SignInScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RecipeLibraryScreen } from './screens/RecipeLibraryScreen';
import { AddRecipeModal } from './components/recipe/AddRecipeModal';
import { RecipeDetailsModal } from './components/recipe/RecipeDetailsModal';
import { RecipeEditFormV2 } from './components/recipe/RecipeEditFormV2';
import { WeeklyPlanScreen } from './screens/WeeklyPlanScreen';
import { ShoppingListScreen } from './screens/ShoppingListScreen';
import { PrepHubScreen } from './screens/PrepHubScreen';
import { TodayScreen } from './screens/TodayScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { QuickFoodsScreen } from './screens/QuickFoodsScreen';
import { RecipeChatbotScreen } from './screens/RecipeChatbotScreen';

function AppContent() {
  const { user, authLoading, currentScreen } = useApp();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in screen if not authenticated
  if (!user) {
    return <SignInScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'recipes':
        return <RecipeLibraryScreen />;
      case 'quick-foods':
        return <QuickFoodsScreen />;
      case 'ai-chat':
        return <RecipeChatbotScreen />;
      case 'plan-setup':
      case 'weekly-review':
        return <WeeklyPlanScreen />;
      case 'shopping-list':
        return <ShoppingListScreen />;
      case 'prep-hub':
        return <PrepHubScreen />;
      case 'today':
        return <TodayScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderScreen()}
      {/* Recipe Modals */}
      <AddRecipeModal />
      <RecipeDetailsModal />
      <RecipeEditFormV2 />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
