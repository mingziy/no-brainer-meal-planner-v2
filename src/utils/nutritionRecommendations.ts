// Daily recommended intake values for children by age
// Based on USDA dietary guidelines

export interface DailyRecommendations {
  protein: number; // grams
  grains: number; // grams
  fruits: number; // grams
  vegetables: number; // grams
  fat: number; // grams
  fiber: number; // grams
  calories: number;
  calcium: number; // mg
  iron: number; // mg
}

export function getDailyRecommendations(age: number): DailyRecommendations {
  if (age <= 3) {
    return {
      protein: 13,
      grains: 85, // ~3 oz equivalents
      fruits: 150, // ~1.5 cups
      vegetables: 150, // ~1.5 cups
      fat: 35, // ~30-40% of 1000 cal
      fiber: 19,
      calories: 1000,
      calcium: 700,
      iron: 7,
    };
  } else if (age <= 8) {
    return {
      protein: 19,
      grains: 140, // ~5 oz equivalents
      fruits: 200, // ~2 cups
      vegetables: 200, // ~2 cups
      fat: 45, // ~30-35% of 1400 cal
      fiber: 25,
      calories: 1400,
      calcium: 1000,
      iron: 10,
    };
  } else if (age <= 13) {
    return {
      protein: 34,
      grains: 170, // ~6 oz equivalents
      fruits: 225, // ~2.5 cups
      vegetables: 250, // ~2.5 cups
      fat: 55, // ~25-35% of 1800 cal
      fiber: 31,
      calories: 1800,
      calcium: 1300,
      iron: 8,
    };
  } else {
    // Teens
    return {
      protein: 52,
      grains: 200, // ~7 oz equivalents
      fruits: 275, // ~3 cups
      vegetables: 300, // ~3 cups
      fat: 70, // ~25-35% of 2200 cal
      fiber: 38,
      calories: 2200,
      calcium: 1300,
      iron: 15,
    };
  }
}

export function getAgeLabel(age: number): string {
  if (age <= 3) {
    return '1-3 years';
  } else if (age <= 8) {
    return '4-8 years';
  } else if (age <= 13) {
    return '9-13 years';
  } else {
    return '14+ years';
  }
}

export function calculatePercentage(actual: number, recommended: number): number {
  return Math.round((actual / recommended) * 100);
}
