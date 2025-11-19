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

// Helper function to get the start of the week (Monday at 00:00:00)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  // Set to midnight to ensure consistent comparison
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Helper function to get the end of the week (Sunday at 23:59:59)
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Helper function to format week label
function formatWeekLabel(weekStart: Date, weekEnd: Date): string {
  const today = new Date();
  const thisWeekStart = getWeekStart(today);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(thisWeekStart.getDate() + 7);
  
  // Normalize weekStart to midnight for comparison
  const normalizedWeekStart = new Date(weekStart);
  normalizedWeekStart.setHours(0, 0, 0, 0);
  
  console.log('🏷️ Formatting week label:', {
    weekStart: normalizedWeekStart.toISOString(),
    thisWeekStart: thisWeekStart.toISOString(),
    nextWeekStart: nextWeekStart.toISOString(),
    isThisWeek: normalizedWeekStart.getTime() === thisWeekStart.getTime(),
    isNextWeek: normalizedWeekStart.getTime() === nextWeekStart.getTime()
  });
  
  // Check if it's this week
  if (normalizedWeekStart.getTime() === thisWeekStart.getTime()) {
    return 'This Week';
  }
  
  // Check if it's next week
  if (normalizedWeekStart.getTime() === nextWeekStart.getTime()) {
    return 'Next Week';
  }
  
  // Otherwise, format as date range
  const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

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
        
        // Convert Firestore Timestamps to Dates and normalize time
        let weekStartDate: Date;
        let weekEndDate: Date;
        
        if (data.weekStartDate) {
          weekStartDate = data.weekStartDate instanceof Timestamp 
            ? data.weekStartDate.toDate() 
            : new Date(data.weekStartDate);
          weekStartDate.setHours(0, 0, 0, 0); // Normalize to midnight
        } else {
          // Fallback: calculate from createdAt or current date
          const fallbackDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
          weekStartDate = getWeekStart(fallbackDate);
        }
        
        if (data.weekEndDate) {
          weekEndDate = data.weekEndDate instanceof Timestamp 
            ? data.weekEndDate.toDate() 
            : new Date(data.weekEndDate);
          weekEndDate.setHours(23, 59, 59, 999); // Normalize to end of day
        } else {
          // Fallback: calculate from weekStartDate
          weekEndDate = getWeekEnd(weekStartDate);
        }
        
        // Generate weekLabel if missing
        const weekLabel = data.weekLabel || formatWeekLabel(weekStartDate, weekEndDate);
        
        plans.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          weekStartDate,
          weekEndDate,
          weekLabel,
        } as WeeklyPlan);
      });

      // Sort by week start date (most recent first)
      plans.sort((a, b) => b.weekStartDate.getTime() - a.weekStartDate.getTime());

      console.log('✅ Loaded meal plans:', plans.length, plans);
      
      setMealPlans(plans);
      
      // Find "this week's" plan
      const today = new Date();
      const thisWeekStart = getWeekStart(today);
      
      console.log('🔍 Looking for this week\'s plan:', {
        today: today.toISOString(),
        thisWeekStart: thisWeekStart.toISOString(),
        thisWeekStartTime: thisWeekStart.getTime(),
        availablePlans: plans.map(p => ({
          id: p.id,
          weekLabel: p.weekLabel,
          weekStartDate: p.weekStartDate.toISOString(),
          weekStartTime: p.weekStartDate.getTime(),
          matches: p.weekStartDate.getTime() === thisWeekStart.getTime()
        }))
      });
      
      // Find all plans for this week, then get the most recently created one
      const thisWeekPlans = plans.filter(p => 
        p.weekStartDate.getTime() === thisWeekStart.getTime()
      );
      
      const thisWeekPlan = thisWeekPlans.length > 0 
        ? thisWeekPlans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;
      
      if (thisWeekPlan) {
        console.log('📌 Setting current plan (this week):', thisWeekPlan.id, '(most recent of', thisWeekPlans.length, 'plans for this week)');
        setCurrentPlan(thisWeekPlan);
        
        // Save ONLY current plan to localStorage (not all plans to avoid quota)
        try {
          localStorage.setItem(`currentPlan_${userId}`, JSON.stringify(thisWeekPlan));
          console.log('💾 Cached currentPlan to localStorage');
        } catch (e) {
          console.warn('⚠️ Failed to cache current plan to localStorage:', e);
        }
      } else if (plans.length > 0) {
        // Fallback: use the most recent plan if no "this week" plan exists
        console.log('📌 No plan for this week, using most recent:', plans[0].id);
        setCurrentPlan(plans[0]);
        
        try {
          localStorage.setItem(`currentPlan_${userId}`, JSON.stringify(plans[0]));
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

    console.log('💾 Saving meal plan...', { userId, planId: 'id' in plan ? plan.id : 'new', weekStart: plan.weekStartDate });

    try {
      const planData = {
        ...plan,
        userId,
        updatedAt: Timestamp.now(),
      };

      // Check if a plan already exists for this week (to avoid duplicates)
      const planWeekStart = new Date(plan.weekStartDate);
      planWeekStart.setHours(0, 0, 0, 0);
      
      const existingPlanForWeek = mealPlans.find(p => 
        p.weekStartDate.getTime() === planWeekStart.getTime()
      );

      // If plan has an ID, update it
      if ('id' in plan && plan.id) {
        console.log('✏️ Updating existing plan by ID:', plan.id);
        const planRef = doc(db, 'mealPlans', plan.id);
        await updateDoc(planRef, planData);
        
        // Update local state
        setMealPlans(prev => prev.map(p => p.id === plan.id ? { ...plan, updatedAt: new Date() } as WeeklyPlan : p));
        setCurrentPlan({ ...plan, updatedAt: new Date() } as WeeklyPlan);
        
        console.log('✅ Meal plan updated:', plan.id);
        return plan.id;
      } else if (existingPlanForWeek) {
        // Plan for this week already exists - update it instead of creating new
        console.log('📝 Plan for this week already exists, updating:', existingPlanForWeek.id);
        const planRef = doc(db, 'mealPlans', existingPlanForWeek.id);
        await updateDoc(planRef, planData);
        
        const updatedPlan: WeeklyPlan = {
          ...plan,
          id: existingPlanForWeek.id,
          createdAt: existingPlanForWeek.createdAt, // Keep original creation time
          updatedAt: new Date(),
        } as WeeklyPlan;
        
        // Update local state
        setMealPlans(prev => prev.map(p => p.id === existingPlanForWeek.id ? updatedPlan : p));
        setCurrentPlan(updatedPlan);
        
        console.log('✅ Meal plan updated (overwrote existing):', existingPlanForWeek.id);
        return existingPlanForWeek.id;
      } else {
        // Create new plan (no plan exists for this week yet)
        console.log('🆕 Creating new plan for week:', plan.weekLabel);
        const plansRef = collection(db, 'mealPlans');
        const docRef = await addDoc(plansRef, {
          ...planData,
          createdAt: Timestamp.now(),
        });
        
        const newPlan: WeeklyPlan = {
          ...plan,
          id: docRef.id,
          createdAt: new Date(),
          updatedAt: new Date(),
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
    currentPlan, // Most recent or "this week's" plan
    loading,
    saveMealPlan,
    deleteMealPlan,
    setCurrentPlan, // Allow manual setting for local changes
    
    // Helper functions
    getWeekStart,
    getWeekEnd,
    formatWeekLabel,
    
    // Get specific week plans (always return the most recently created plan for that week)
    getThisWeekPlan: () => {
      const today = new Date();
      const thisWeekStart = getWeekStart(today);
      const weekPlans = mealPlans.filter(p => p.weekStartDate.getTime() === thisWeekStart.getTime());
      if (weekPlans.length === 0) return null;
      // Return the most recently created plan for this week
      return weekPlans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    },
    
    getNextWeekPlan: () => {
      const today = new Date();
      const thisWeekStart = getWeekStart(today);
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(thisWeekStart.getDate() + 7);
      const weekPlans = mealPlans.filter(p => p.weekStartDate.getTime() === nextWeekStart.getTime());
      if (weekPlans.length === 0) return null;
      // Return the most recently created plan for next week
      return weekPlans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    },
    
    getPlanByWeekStart: (weekStart: Date) => {
      return mealPlans.find(p => p.weekStartDate.getTime() === weekStart.getTime()) || null;
    },
  };
}

