import { AppProvider, useApp } from './context/AppContext';
import { SignInScreen } from './components/auth/SignInScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { RecipeLibraryScreen } from './components/recipe/RecipeLibraryScreen';
import { AddRecipeModal } from './components/recipe/AddRecipeModal';
import { RecipeDetailsModal } from './components/recipe/RecipeDetailsModal';
import { RecipeEditForm } from './components/recipe/RecipeEditForm';
import { WeeklyPlanScreen } from './components/planning/WeeklyPlanScreen';
import { ShoppingListScreen } from './components/shopping/ShoppingListScreen';
import { PrepHubScreen } from './components/shopping/PrepHubScreen';
import { TodayScreen } from './components/daily/TodayScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { QuickFoodsScreen } from './components/quickfoods/QuickFoodsScreen';

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
      <RecipeEditForm />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
