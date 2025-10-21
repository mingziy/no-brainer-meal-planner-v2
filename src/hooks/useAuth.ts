import { useState, useEffect } from 'react';
import { 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Set persistence first
        await setPersistence(auth, browserLocalPersistence);

        // Check for redirect result and wait for it to complete
        await getRedirectResult(auth);

        // Set up the auth state listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (isMounted) {
            console.log('👤 Auth state changed:', currentUser ? `Signed in: ${currentUser.email}` : 'Signed out');
            setUser(currentUser);
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error in auth initialization:', error);
        throw error;
      }
    };

    const unsubscribePromise = initAuth().catch((error) => {
      console.error('❌ Auth initialization error:', error);
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribePromise?.then(unsub => unsub?.());
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Set persistence before signing in
      await setPersistence(auth, browserLocalPersistence);
      
      // Try popup first (works better on mobile Safari)
      try {
        await signInWithPopup(auth, googleProvider);
        return;
      } catch (popupError: any) {
        // If popup fails (blocked), fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔓 useAuth: signOut called');
      await firebaseSignOut(auth);
      console.log('🔓 useAuth: Firebase signOut completed');
    } catch (error) {
      console.error('🔓 useAuth: Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
}

