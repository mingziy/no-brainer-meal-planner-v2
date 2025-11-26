import { ChevronRight, Heart, Bell, User as UserIcon, LogOut } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { BottomNav } from '../components/shared/BottomNav';

export function ProfileScreen() {
  const { userProfile, setCurrentScreen } = useApp();
  const { signOut } = useAuth();

  const menuItems = [
    {
      icon: UserIcon,
      label: 'My Preferences',
      description: 'Update dietary preferences and goals',
      action: () => setCurrentScreen('dietary-preferences'),
    },
    {
      icon: Heart,
      label: 'My Favorite Recipes',
      description: 'View your saved meals',
      action: () => {},
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage notification settings',
      action: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1>Profile</h1>
        </div>

        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h3>{userProfile?.name || 'User'}</h3>
            <p className="text-muted-foreground text-sm">
              Cooking for {userProfile?.numberOfKids || 0} {userProfile?.numberOfKids === 1 ? 'child' : 'children'}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={item.action}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p>{item.label}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card 
          className="cursor-pointer hover:bg-destructive/5 transition-colors border-destructive/20"
          onClick={async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Failed to sign out:', error);
            }
          }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-destructive">Log Out</p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
