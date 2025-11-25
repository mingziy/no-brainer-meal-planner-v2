/**
 * Account Deletion Screen
 * Placeholder for App Store compliance
 */

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import { privacyService } from '../services/privacy';
import { AlertTriangle } from 'lucide-react';

export function AccountDeletionScreen() {
  const { user } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDeleteRequest = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await privacyService.requestAccountDeletion(user.uid);
      alert('Account deletion requested. You will be logged out shortly.');
      // TODO: Sign out user and redirect to login
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      alert('Failed to request account deletion. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Delete Account
            </CardTitle>
            <CardDescription>
              This action cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Deleting your account will permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>All your recipes</li>
              <li>All meal plans</li>
              <li>All shopping lists</li>
              <li>All quick foods</li>
              <li>Your account data</li>
            </ul>
            
            {!showConfirm ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowConfirm(true)}
              >
                I want to delete my account
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-600">
                  Are you absolutely sure?
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleDeleteRequest}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, delete'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

