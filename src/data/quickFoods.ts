import { QuickFood } from '../types';

/**
 * Pre-populated quick foods database
 * Common grab-and-go items to supplement meals
 */
export const defaultQuickFoods: QuickFood[] = [
  // Fruits
  {
    id: 'banana',
    name: 'Banana',
    category: 'fruit',
    emoji: '🍌',
    calories: 105,
    servingSize: '1 medium',
    nutrition: {
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3.1
    }
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'fruit',
    emoji: '🍎',
    calories: 95,
    servingSize: '1 medium',
    nutrition: {
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4.4
    }
  },
  {
    id: 'orange',
    name: 'Orange',
    category: 'fruit',
    emoji: '🍊',
    calories: 62,
    servingSize: '1 medium',
    nutrition: {
      protein: 1.2,
      carbs: 15,
      fat: 0.2,
      fiber: 3.1
    }
  },
  {
    id: 'blueberries',
    name: 'Blueberries',
    category: 'fruit',
    emoji: '🫐',
    calories: 84,
    servingSize: '1 cup',
    nutrition: {
      protein: 1.1,
      carbs: 21,
      fat: 0.5,
      fiber: 3.6
    }
  },
  {
    id: 'strawberries',
    name: 'Strawberries',
    category: 'fruit',
    emoji: '🍓',
    calories: 49,
    servingSize: '1 cup',
    nutrition: {
      protein: 1,
      carbs: 12,
      fat: 0.5,
      fiber: 3
    }
  },
  {
    id: 'grapes',
    name: 'Grapes',
    category: 'fruit',
    emoji: '🍇',
    calories: 104,
    servingSize: '1 cup',
    nutrition: {
      protein: 1.1,
      carbs: 27,
      fat: 0.2,
      fiber: 1.4
    }
  },

  // Vegetables
  {
    id: 'baby-carrots',
    name: 'Baby Carrots',
    category: 'veggie',
    emoji: '🥕',
    calories: 35,
    servingSize: '10 carrots',
    nutrition: {
      protein: 0.8,
      carbs: 8,
      fat: 0.2,
      fiber: 2.4
    }
  },
  {
    id: 'cherry-tomatoes',
    name: 'Cherry Tomatoes',
    category: 'veggie',
    emoji: '🍅',
    calories: 27,
    servingSize: '1 cup',
    nutrition: {
      protein: 1.3,
      carbs: 6,
      fat: 0.3,
      fiber: 1.8
    }
  },
  {
    id: 'cucumber',
    name: 'Cucumber Slices',
    category: 'veggie',
    emoji: '🥒',
    calories: 16,
    servingSize: '1 cup',
    nutrition: {
      protein: 0.7,
      carbs: 3.6,
      fat: 0.1,
      fiber: 0.5
    }
  },
  {
    id: 'bell-pepper',
    name: 'Bell Pepper',
    category: 'veggie',
    emoji: '🫑',
    calories: 30,
    servingSize: '1 medium',
    nutrition: {
      protein: 1,
      carbs: 7,
      fat: 0.3,
      fiber: 2.5
    }
  },

  // Dairy
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt (Plain)',
    category: 'dairy',
    emoji: '🥛',
    calories: 100,
    servingSize: '6 oz',
    nutrition: {
      protein: 17,
      carbs: 6,
      fat: 0.7,
      fiber: 0
    }
  },
  {
    id: 'string-cheese',
    name: 'String Cheese',
    category: 'dairy',
    emoji: '🧀',
    calories: 80,
    servingSize: '1 stick',
    nutrition: {
      protein: 6,
      carbs: 1,
      fat: 6,
      fiber: 0
    }
  },
  {
    id: 'cottage-cheese',
    name: 'Cottage Cheese',
    category: 'dairy',
    emoji: '🥛',
    calories: 81,
    servingSize: '1/2 cup',
    nutrition: {
      protein: 14,
      carbs: 3,
      fat: 1,
      fiber: 0
    }
  },
  {
    id: 'milk',
    name: 'Milk (2%)',
    category: 'dairy',
    emoji: '🥛',
    calories: 122,
    servingSize: '1 cup',
    nutrition: {
      protein: 8,
      carbs: 12,
      fat: 5,
      fiber: 0
    }
  },

  // Grains
  {
    id: 'whole-wheat-bread',
    name: 'Whole Wheat Bread',
    category: 'grain',
    emoji: '🍞',
    calories: 80,
    servingSize: '1 slice',
    nutrition: {
      protein: 4,
      carbs: 14,
      fat: 1,
      fiber: 2
    }
  },
  {
    id: 'rice-cake',
    name: 'Rice Cake',
    category: 'grain',
    emoji: '🍘',
    calories: 35,
    servingSize: '1 cake',
    nutrition: {
      protein: 0.7,
      carbs: 7,
      fat: 0.3,
      fiber: 0.4
    }
  },
  {
    id: 'oatmeal',
    name: 'Instant Oatmeal',
    category: 'grain',
    emoji: '🥣',
    calories: 100,
    servingSize: '1 packet',
    nutrition: {
      protein: 4,
      carbs: 19,
      fat: 2,
      fiber: 3
    }
  },
  {
    id: 'crackers',
    name: 'Whole Grain Crackers',
    category: 'grain',
    emoji: '🍪',
    calories: 120,
    servingSize: '10 crackers',
    nutrition: {
      protein: 3,
      carbs: 19,
      fat: 4,
      fiber: 2
    }
  },

  // Protein
  {
    id: 'hard-boiled-egg',
    name: 'Hard Boiled Egg',
    category: 'protein',
    emoji: '🥚',
    calories: 78,
    servingSize: '1 large',
    nutrition: {
      protein: 6,
      carbs: 0.6,
      fat: 5,
      fiber: 0
    }
  },
  {
    id: 'deli-turkey',
    name: 'Deli Turkey Breast',
    category: 'protein',
    emoji: '🍖',
    calories: 60,
    servingSize: '2 oz',
    nutrition: {
      protein: 11,
      carbs: 2,
      fat: 1,
      fiber: 0
    }
  },
  {
    id: 'tuna-pouch',
    name: 'Tuna Pouch',
    category: 'protein',
    emoji: '🐟',
    calories: 70,
    servingSize: '1 pouch',
    nutrition: {
      protein: 15,
      carbs: 0,
      fat: 0.5,
      fiber: 0
    }
  },
  {
    id: 'edamame',
    name: 'Edamame',
    category: 'protein',
    emoji: '🫘',
    calories: 120,
    servingSize: '1/2 cup',
    nutrition: {
      protein: 11,
      carbs: 10,
      fat: 5,
      fiber: 4
    }
  },

  // Snacks
  {
    id: 'almonds',
    name: 'Almonds',
    category: 'snack',
    emoji: '🥜',
    calories: 164,
    servingSize: '1 oz (23 nuts)',
    nutrition: {
      protein: 6,
      carbs: 6,
      fat: 14,
      fiber: 3.5
    }
  },
  {
    id: 'peanut-butter',
    name: 'Peanut Butter',
    category: 'snack',
    emoji: '🥜',
    calories: 190,
    servingSize: '2 tbsp',
    nutrition: {
      protein: 8,
      carbs: 7,
      fat: 16,
      fiber: 2
    }
  },
  {
    id: 'hummus',
    name: 'Hummus',
    category: 'snack',
    emoji: '🫘',
    calories: 70,
    servingSize: '2 tbsp',
    nutrition: {
      protein: 2,
      carbs: 6,
      fat: 5,
      fiber: 2
    }
  },
  {
    id: 'protein-bar',
    name: 'Protein Bar',
    category: 'snack',
    emoji: '🍫',
    calories: 190,
    servingSize: '1 bar',
    nutrition: {
      protein: 20,
      carbs: 22,
      fat: 5,
      fiber: 3
    }
  },
  {
    id: 'granola-bar',
    name: 'Granola Bar',
    category: 'snack',
    emoji: '🍫',
    calories: 100,
    servingSize: '1 bar',
    nutrition: {
      protein: 2,
      carbs: 17,
      fat: 3,
      fiber: 1
    }
  },
  {
    id: 'trail-mix',
    name: 'Trail Mix',
    category: 'snack',
    emoji: '🥜',
    calories: 150,
    servingSize: '1/4 cup',
    nutrition: {
      protein: 4,
      carbs: 13,
      fat: 10,
      fiber: 2
    }
  },
  {
    id: 'dark-chocolate',
    name: 'Dark Chocolate',
    category: 'snack',
    emoji: '🍫',
    calories: 170,
    servingSize: '1 oz',
    nutrition: {
      protein: 2,
      carbs: 13,
      fat: 12,
      fiber: 3
    }
  },

  // Drinks
  {
    id: 'orange-juice',
    name: 'Orange Juice',
    category: 'drink',
    emoji: '🧃',
    calories: 110,
    servingSize: '1 cup',
    nutrition: {
      protein: 2,
      carbs: 26,
      fat: 0,
      fiber: 0.5
    }
  },
  {
    id: 'almond-milk',
    name: 'Almond Milk (Unsweetened)',
    category: 'drink',
    emoji: '🥛',
    calories: 30,
    servingSize: '1 cup',
    nutrition: {
      protein: 1,
      carbs: 1,
      fat: 2.5,
      fiber: 0
    }
  },
  {
    id: 'protein-shake',
    name: 'Protein Shake',
    category: 'drink',
    emoji: '🥤',
    calories: 160,
    servingSize: '1 bottle',
    nutrition: {
      protein: 30,
      carbs: 3,
      fat: 3,
      fiber: 0
    }
  },
  {
    id: 'green-tea',
    name: 'Green Tea (Unsweetened)',
    category: 'drink',
    emoji: '🍵',
    calories: 0,
    servingSize: '1 cup',
    nutrition: {
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
  }
];

