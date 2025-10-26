import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { WeeklyPlan } from '../types';

export function useMealPlans(userId: string | null) {
  // Only cache currentPlan (not all plans) to avoid localStorage quota
  const [mealPlans, setMealPlans] = useState<WeeklyPlan[]>([]);
  
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(() => {
    if (!userId) return null;
    try {
      const cached = localStorage.getItem(`currentPlan_${userId}`);
      if (cached) {
        console.log('📦 Loaded currentPlan from localStorage cache');
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);

  // Load meal plans from Firebase
  useEffect(() => {
    if (!userId) {
      console.log('📋 No userId, skipping meal plan load');
      setMealPlans([]);
      setCurrentPlan(null);
      setLoading(false);
      return;
    }

    console.log('📋 Setting up real-time listener for meal plans, userId:', userId);
    
    // Real-time listener for user's meal plans
    const plansRef = collection(db, 'mealPlans');
    const q = query(plansRef, where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔄 Meal plans snapshot received, docs:', snapshot.size);
      
      const plans: WeeklyPlan[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        plans.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        } as WeeklyPlan);
      });

      // Sort in memory (newest first)
      plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log('✅ Loaded meal plans:', plans.length, plans);
      
      setMealPlans(plans);
      
      if (plans.length > 0) {
        console.log('📌 Setting current plan:', plans[0].id);
        const newCurrentPlan = plans[0];
        setCurrentPlan(newCurrentPlan);
        
        // Save ONLY current plan to localStorage (not all plans to avoid quota)
        try {
          localStorage.setItem(`currentPlan_${userId}`, JSON.stringify(newCurrentPlan));
          console.log('💾 Cached currentPlan to localStorage');
        } catch (e) {
          console.warn('⚠️ Failed to cache current plan to localStorage:', e);
        }
      } else {
        console.log('📌 No plans found');
        setCurrentPlan(null);
        // Clear localStorage if no plans
        try {
          localStorage.removeItem(`currentPlan_${userId}`);
        } catch (e) {
          console.warn('Failed to clear localStorage:', e);
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error('❌ Error loading meal plans:', error);
      setLoading(false);
    });

    // Cleanup function - unsubscribe when component unmounts
    return unsubscribe;
  }, [userId]);

  // Save or update meal plan
  const saveMealPlan = async (plan: Omit<WeeklyPlan, 'id' | 'createdAt'> | WeeklyPlan): Promise<string | undefined> => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }

    console.log('💾 Saving meal plan...', { userId, planId: 'id' in plan ? plan.id : 'new' });

    try {
      const planData = {
        ...plan,
        userId,
        updatedAt: Timestamp.now(),
      };

      // If plan has an ID, update it
      if ('id' in plan && plan.id) {
        console.log('Updating existing plan:', plan.id);
        const planRef = doc(db, 'mealPlans', plan.id);
        await updateDoc(planRef, planData);
        
        // Update local state
        setMealPlans(prev => prev.map(p => p.id === plan.id ? { ...plan, updatedAt: new Date() } as WeeklyPlan : p));
        setCurrentPlan({ ...plan, updatedAt: new Date() } as WeeklyPlan);
        
        console.log('✅ Meal plan updated:', plan.id);
        return plan.id;
      } else {
        // Create new plan
        console.log('Creating new plan');
        const plansRef = collection(db, 'mealPlans');
        const docRef = await addDoc(plansRef, {
          ...planData,
          createdAt: Timestamp.now(),
        });
        
        const newPlan: WeeklyPlan = {
          ...plan,
          id: docRef.id,
          createdAt: new Date(),
        } as WeeklyPlan;
        
        // Update local state
        setMealPlans(prev => [newPlan, ...prev]);
        setCurrentPlan(newPlan);
        
        console.log('✅ New meal plan created:', docRef.id);
        return docRef.id;
      }
    } catch (error) {
      console.error('❌ Error saving meal plan:', error);
      throw error;
    }
  };

  // Delete meal plan
  const deleteMealPlan = async (planId: string): Promise<void> => {
    if (!userId) return;

    try {
      const planRef = doc(db, 'mealPlans', planId);
      await deleteDoc(planRef);
      
      // Update local state
      setMealPlans(prev => prev.filter(p => p.id !== planId));
      
      if (currentPlan?.id === planId) {
        // Set the next most recent plan as current
        const remainingPlans = mealPlans.filter(p => p.id !== planId);
        setCurrentPlan(remainingPlans.length > 0 ? remainingPlans[0] : null);
      }
      
      console.log('Meal plan deleted:', planId);
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      throw error;
    }
  };

  return {
    mealPlans,
    currentPlan,
    loading,
    saveMealPlan,
    deleteMealPlan,
    setCurrentPlan, // Allow manual setting for local changes
  };
}

