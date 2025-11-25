import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MoreVertical, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export function UserButton() {
  const { user, signOut } = useAuth();
  const { setCurrentScreen } = useApp();
  const [showSwitchAccountDialog, setShowSwitchAccountDialog] = useState(false);

  console.log('👤 UserButton rendering:', {
    hasUser: !!user,
    userName: user?.displayName,
    showSwitchAccountDialog
  });

  if (!user) {
    console.log('⚠️ No user, returning null');
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('❌ Failed to sign out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  console.log('🎨 About to render UserButton JSX');

  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3"
            onClick={(e) => {
              console.log('🖱️ Button clicked!');
            }}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white"
          sideOffset={8}
        >
          <DropdownMenuItem 
            onClick={() => {
              console.log('🔐 Switch Account clicked');
              setShowSwitchAccountDialog(true);
            }}
            className="py-4 px-4 cursor-pointer"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            <span className="text-base">Switch Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Switch Account Dialog */}
      <Dialog open={showSwitchAccountDialog} onOpenChange={setShowSwitchAccountDialog}>
        <DialogContent className="w-[calc(100vw-3rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{user.displayName || 'User'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

