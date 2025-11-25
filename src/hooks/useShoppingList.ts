import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShoppingItem } from '../types';

export function useShoppingList(userId: string | null) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load shopping list from Firestore when user logs in
  useEffect(() => {
    if (!userId) {
      setShoppingList([]);
      setLoading(false);
      return;
    }

    console.log('[useShoppingList] Setting up listener for user:', userId);

    // Set up real-time listener for shopping list
    const shoppingListRef = doc(db, 'users', userId, 'shoppingData', 'current');
    
    const unsubscribe = onSnapshot(
      shoppingListRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('[useShoppingList] Loaded shopping list:', data.items?.length || 0, 'items');
          setShoppingList(data.items || []);
        } else {
          console.log('[useShoppingList] No shopping list found, starting fresh');
          setShoppingList([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('[useShoppingList] Error loading shopping list:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Save shopping list to Firestore
  const saveShoppingList = async (items: ShoppingItem[]) => {
    if (!userId) {
      console.warn('[useShoppingList] Cannot save shopping list: no user ID');
      return;
    }

    try {
      console.log('[useShoppingList] Saving shopping list:', items.length, 'items');
      const shoppingListRef = doc(db, 'users', userId, 'shoppingData', 'current');
      
      await setDoc(shoppingListRef, {
        items,
        updatedAt: serverTimestamp()
      });
      
      console.log('[useShoppingList] Shopping list saved successfully');
    } catch (error) {
      console.error('[useShoppingList] Error saving shopping list:', error);
      throw error;
    }
  };

  return {
    shoppingList,
    setShoppingList,
    saveShoppingList,
    loading
  };
}

