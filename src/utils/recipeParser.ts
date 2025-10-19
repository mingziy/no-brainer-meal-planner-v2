import { Recipe, Ingredient, RecipeCategory, RecipeCuisine } from '../types';

/**
 * Simulated AI recipe parser
 * In a real app, this would call an AI API like OpenAI GPT-4
 * For now, it does basic text parsing to extract recipe information
 */

export function parseRecipeText(text: string): Partial<Recipe> {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract recipe name (usually first line or after "Recipe:" or "Title:")
  let name = '';
  const namePatterns = [/^title:?\s*(.+)/i, /^recipe:?\s*(.+)/i, /^(.+?)(?:\n|$)/];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      name = match[1].trim();
      break;
    }
  }
  if (!name && lines.length > 0) {
    name = lines[0].replace(/^(recipe|title):?\s*/i, '').trim();
  }

  // Extract ingredients
  const ingredients: Ingredient[] = [];
  let inIngredientsSection = false;
  let ingredientId = 1;

  for (const line of lines) {
    if (/^ingredients?:?$/i.test(line.trim())) {
      inIngredientsSection = true;
      continue;
    }
    if (/^(instructions?|directions?|steps?):?$/i.test(line.trim())) {
      inIngredientsSection = false;
      continue;
    }
    
    if (inIngredientsSection && line.trim()) {
      // Try to parse amount, unit, and name
      const match = line.match(/^[•\-*]?\s*(\d+\/?\d*|\d+\.\d+)?\s*([a-z]+)?\s*(.+?)$/i);
      if (match) {
        const [, amount, unit, ingredientName] = match;
        ingredients.push({
          id: String(ingredientId++),
          amount: amount?.trim() || '1',
          unit: unit?.trim() || '',
          name: ingredientName?.trim() || line.trim().replace(/^[•\-*]\s*/, ''),
        });
      } else {
        ingredients.push({
          id: String(ingredientId++),
          amount: '',
          unit: '',
          name: line.trim().replace(/^[•\-*]\s*/, ''),
        });
      }
    }
  }

  // Extract instructions
  const instructions: string[] = [];
  let inInstructionsSection = false;

  for (const line of lines) {
    if (/^(instructions?|directions?|steps?):?$/i.test(line.trim())) {
      inInstructionsSection = true;
      continue;
    }
    if (/^ingredients?:?$/i.test(line.trim())) {
      inInstructionsSection = false;
      continue;
    }
    
    if (inInstructionsSection && line.trim()) {
      const cleanLine = line.trim().replace(/^\d+[\.)]\s*/, '').replace(/^[•\-*]\s*/, '');
      if (cleanLine.length > 10) {
        instructions.push(cleanLine);
      }
    }
  }

  // Extract prep and cook times
  let prepTime = 15; // default
  let cookTime = 30; // default
  
  const prepMatch = text.match(/prep(?:\s+time)?:?\s*(\d+)\s*(?:min|minute)/i);
  const cookMatch = text.match(/cook(?:\s+time)?:?\s*(\d+)\s*(?:min|minute)/i);
  
  if (prepMatch) prepTime = parseInt(prepMatch[1]);
  if (cookMatch) cookTime = parseInt(cookMatch[1]);

  // Detect cuisine
  let cuisine: RecipeCuisine = 'Other';
  const textLower = text.toLowerCase();
  if (textLower.includes('italian') || textLower.includes('pasta') || textLower.includes('pizza')) cuisine = 'Italian';
  if (textLower.includes('korean') || textLower.includes('kimchi') || textLower.includes('bulgogi')) cuisine = 'Korean';
  if (textLower.includes('chinese') || textLower.includes('stir fry') || textLower.includes('fried rice')) cuisine = 'Chinese';
  if (textLower.includes('mexican') || textLower.includes('taco') || textLower.includes('burrito')) cuisine = 'Mexican';
  if (textLower.includes('japanese') || textLower.includes('sushi') || textLower.includes('ramen')) cuisine = 'Japanese';
  if (textLower.includes('american') || textLower.includes('burger') || textLower.includes('bbq')) cuisine = 'American';

  // Detect categories
  const categories: RecipeCategory[] = [];
  if (textLower.includes('breakfast')) categories.push('Breakfast');
  if (textLower.includes('lunch')) categories.push('Lunch');
  if (textLower.includes('dinner')) categories.push('Dinner');
  if (textLower.includes('kid') || textLower.includes('child')) categories.push('Kid-Friendly');
  if (textLower.includes('batch') || textLower.includes('meal prep')) categories.push('Batch-Cook Friendly');
  
  // Default category if none found
  if (categories.length === 0) {
    categories.push('Dinner');
  }

  // Estimate nutrition based on ingredients (very rough simulation)
  const hasProtein = ingredients.some(ing => 
    /chicken|beef|pork|fish|egg|tofu|bean/i.test(ing.name)
  );
  const hasVeggies = ingredients.some(ing => 
    /vegetable|carrot|broccoli|spinach|lettuce|tomato|pepper/i.test(ing.name)
  );
  const hasCarbs = ingredients.some(ing => 
    /rice|pasta|bread|potato|noodle/i.test(ing.name)
  );

  return {
    name: name || 'New Recipe',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    cuisine,
    categories,
    prepTime,
    cookTime,
    ingredients: ingredients.length > 0 ? ingredients : [
      { id: '1', amount: '', unit: '', name: '' }
    ],
    instructions: instructions.length > 0 ? instructions : [''],
    nutrition: {
      protein: hasProtein ? 25 : 10,
      fiber: hasVeggies ? 5 : 2,
      fat: 12,
      carbs: hasCarbs ? 45 : 20,
      iron: 'Moderate',
      calcium: 'Moderate',
    },
    plateComposition: {
      protein: hasProtein ? 35 : 20,
      veggies: hasVeggies ? 30 : 15,
      carbs: hasCarbs ? 30 : 25,
      fats: 15,
    },
    portions: {
      adult: '1.5 cups',
      child5: '3/4 cup',
      child2: '1/2 cup',
    },
  };
}

/**
 * Example recipe text formats that work well with the parser:
 * 
 * Format 1:
 * Garlic Chicken
 * Prep: 10 minutes
 * Cook: 20 minutes
 * 
 * Ingredients:
 * - 2 lbs chicken breast
 * - 4 cloves garlic
 * - 1/4 cup soy sauce
 * 
 * Instructions:
 * 1. Cube the chicken
 * 2. Mince the garlic
 * 3. Cook in a pan
 * 
 * Format 2:
 * Title: Spaghetti Bolognese
 * Italian dinner recipe
 * 
 * Ingredients
 * 1 lb ground beef
 * 1 can tomatoes
 * 1 lb pasta
 * 
 * Directions
 * Cook the beef in a large pan
 * Add tomatoes and simmer
 * Cook pasta and combine
 */

