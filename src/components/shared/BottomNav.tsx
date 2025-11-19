import { Home, ChefHat, ShoppingCart, Apple, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export function BottomNav() {
  const { t } = useTranslation('navigation');
  const { currentScreen, setCurrentScreen } = useApp();

  const navItems = [
    { id: 'home', label: t('tabs.home'), icon: Home, screen: 'home' },
    { id: 'recipes', label: t('tabs.recipes'), icon: ChefHat, screen: 'recipes' },
    { id: 'quickfoods', label: t('tabs.quickFoods'), icon: Apple, screen: 'quick-foods' },
    { id: 'shopping', label: t('tabs.shopping'), icon: ShoppingCart, screen: 'shopping-list' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
      <div className="max-w-md mx-auto flex justify-around items-center h-12">
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
              <Icon className="w-5 h-5 mb-1" />
              <span style={{ fontSize: '11px', lineHeight: '13px' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
