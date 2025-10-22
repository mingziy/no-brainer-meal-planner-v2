import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Recipe } from '../types';

export function useRecipes(userId: string | null) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Real-time listener for user's recipes
    const recipesRef = collection(db, 'recipes');
    const q = query(recipesRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipesData: Recipe[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        const recipe = {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to Date objects
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Recipe;
        
        // Debug: Log if recipe has Chinese version
        if (recipe.nameZh) {
          console.log('📚 Loaded bilingual recipe from Firebase:', {
            id: recipe.id,
            english: recipe.name,
            chinese: recipe.nameZh,
            hasChineseIngredients: !!recipe.ingredientsZh,
            hasChineseInstructions: !!recipe.instructionsZh
          });
        }
        
        recipesData.push(recipe);
      });
      setRecipes(recipesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching recipes:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('User must be signed in to add recipes');

    try {
      const docRef = await addDoc(collection(db, 'recipes'), {
        ...recipe,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  };

  const updateRecipe = async (recipeId: string, updates: Partial<Recipe>) => {
    if (!userId) throw new Error('User must be signed in to update recipes');

    try {
      const recipeRef = doc(db, 'recipes', recipeId);
      await updateDoc(recipeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!userId) throw new Error('User must be signed in to delete recipes');

    try {
      await deleteDoc(doc(db, 'recipes', recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  };

  const toggleFavorite = async (recipeId: string, currentValue: boolean) => {
    await updateRecipe(recipeId, { isFavorite: !currentValue });
  };

  return {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
  };
}

