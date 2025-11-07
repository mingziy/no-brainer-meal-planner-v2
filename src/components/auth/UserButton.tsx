import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { MoreVertical } from 'lucide-react';

export function UserButton() {
  const { user } = useAuth();
  const { setCurrentScreen } = useApp();

  if (!user) return null;

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => setCurrentScreen('profile')}
    >
      <MoreVertical className="h-5 w-5" />
    </Button>
  );
}

