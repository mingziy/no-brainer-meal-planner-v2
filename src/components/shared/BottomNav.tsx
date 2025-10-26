import { Home, ChefHat, ShoppingCart, Apple, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function BottomNav() {
  const { currentScreen, setCurrentScreen } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, screen: 'home' },
    { id: 'recipes', label: 'Recipes', icon: ChefHat, screen: 'recipes' },
    { id: 'quickfoods', label: 'Quick Foods', icon: Apple, screen: 'quick-foods' },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart, screen: 'shopping-list' },
    { id: 'profile', label: 'Profile', icon: User, screen: 'profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.screen)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
