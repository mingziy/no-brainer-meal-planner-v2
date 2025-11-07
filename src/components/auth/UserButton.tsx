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
import { MoreVertical, Globe, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTranslation } from 'react-i18next';

export function UserButton() {
  const { user, signOut } = useAuth();
  const { setCurrentScreen } = useApp();
  const { i18n } = useTranslation();
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showSwitchAccountDialog, setShowSwitchAccountDialog] = useState(false);

  console.log('👤 UserButton rendering:', {
    hasUser: !!user,
    userName: user?.displayName,
    showLanguageDialog,
    showSwitchAccountDialog
  });

  if (!user) {
    console.log('⚠️ No user, returning null');
    return null;
  }

  const handleLanguageSelect = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageDialog(false);
  };

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
              console.log('🌐 Language clicked');
              setShowLanguageDialog(true);
            }}
            className="py-4 px-4 cursor-pointer"
          >
            <Globe className="mr-3 h-5 w-5 text-gray-400" />
            <span className="text-base">Language</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="!bg-gray-300 my-0 mx-0" style={{ height: '1px', backgroundColor: '#d1d5db' }} />
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
      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="w-[calc(100vw-3rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Language</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <button
              onClick={() => handleLanguageSelect('en')}
              className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                i18n.language === 'en' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xl">🇺🇸</span>
                </div>
                <div>
                  <p className="font-medium">English</p>
                  <p className="text-sm text-gray-500">English (US)</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleLanguageSelect('zh')}
              className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                i18n.language === 'zh' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xl">🇨🇳</span>
                </div>
                <div>
                  <p className="font-medium">中文</p>
                  <p className="text-sm text-gray-500">Chinese (Simplified)</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

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

