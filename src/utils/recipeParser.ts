import { Recipe, Ingredient, RecipeCategory, RecipeCuisine } from '../types';

/**
 * Simulated AI recipe parser
 * In a real app, this would call an AI API like OpenAI GPT-4
 * For now, it does basic text parsing to extract recipe information
 */

export function parseRecipeText(text: string): Partial<Recipe> {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Section headers to skip when finding recipe name
  const sectionHeaders = /^(ingredients?|instructions?|directions?|steps?|prep time|cook time|servings?|portions?|食材|材料|原料|做法|步骤|制作方法|烹饪步骤|准备时间|烹饪时间):?\s*$/i;
  
  // Extract recipe name (usually first non-section-header line or after "Recipe:" or "Title:")
  let name = '';
  const namePatterns = [/^title:?\s*(.+)/i, /^recipe:?\s*(.+)/i];
  
  // First try explicit name patterns
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      name = match[1].trim();
      break;
    }
  }
  
  // If no explicit name found, use first non-section-header line
  if (!name) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!sectionHeaders.test(trimmedLine) && trimmedLine.length > 3) {
        name = trimmedLine.replace(/^(recipe|title):?\s*/i, '').trim();
        break;
      }
    }
  }
  
  // Fallback to generic name if still not found
  if (!name) {
    name = 'Untitled Recipe';
  }

  // Extract ingredients
  const ingredients: Ingredient[] = [];
  let inIngredientsSection = false;
  let ingredientId = 1;

  for (const line of lines) {
    // Support both English and Chinese keywords
    if (/^(ingredients?|食材|材料|原料):?$/i.test(line.trim())) {
      inIngredientsSection = true;
      continue;
    }
    if (/^(instructions?|directions?|steps?|做法|步骤|制作方法|烹饪步骤):?$/i.test(line.trim())) {
      inIngredientsSection = false;
      continue;
    }
    
    if (inIngredientsSection && line.trim()) {
      // Try to parse amount, unit, and name (supports English and Chinese)
      // Supports patterns like: "2 cups flour", "2杯 面粉", "200克 鸡肉", "适量 盐"
      const match = line.match(/^[•\-*]?\s*(\d+\.?\d*|适量|少许)?\s*([\u4e00-\u9fa5a-z]+)?\s*(.+?)$/i);
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
    // Support both English and Chinese keywords
    if (/^(instructions?|directions?|steps?|做法|步骤|制作方法|烹饪步骤):?$/i.test(line.trim())) {
      inInstructionsSection = true;
      continue;
    }
    if (/^(ingredients?|食材|材料|原料):?$/i.test(line.trim())) {
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

  // Extract prep and cook times (supports English and Chinese)
  let prepTime = 15; // default
  let cookTime = 30; // default
  
  const prepMatch = text.match(/(?:prep(?:\s+time)?|准备时间|备料时间):?\s*(\d+)\s*(?:min|minute|分钟)/i);
  const cookMatch = text.match(/(?:cook(?:\s+time)?|烹饪时间|cooking time):?\s*(\d+)\s*(?:min|minute|分钟)/i);
  
  if (prepMatch) prepTime = parseInt(prepMatch[1]);
  if (cookMatch) cookTime = parseInt(cookMatch[1]);

  // Detect cuisine (supports English and Chinese keywords)
  let cuisine: RecipeCuisine = 'Other';
  const textLower = text.toLowerCase();
  
  // Chinese cuisine detection
  if (textLower.includes('chinese') || textLower.includes('中式') || textLower.includes('中国') ||
      textLower.includes('stir fry') || textLower.includes('炒') || textLower.includes('爆炒') ||
      textLower.includes('fried rice') || textLower.includes('炒饭') ||
      textLower.includes('soy sauce') || textLower.includes('酱油') ||
      textLower.includes('wok') || textLower.includes('锅')) {
    cuisine = 'Chinese';
  }
  
  // Other cuisines
  if (textLower.includes('italian') || textLower.includes('pasta') || textLower.includes('pizza')) cuisine = 'Italian';
  if (textLower.includes('korean') || textLower.includes('kimchi') || textLower.includes('bulgogi') || textLower.includes('韩式')) cuisine = 'Korean';
  if (textLower.includes('mexican') || textLower.includes('taco') || textLower.includes('burrito')) cuisine = 'Mexican';
  if (textLower.includes('japanese') || textLower.includes('sushi') || textLower.includes('ramen') || textLower.includes('日式')) cuisine = 'Japanese';
  if (textLower.includes('american') || textLower.includes('burger') || textLower.includes('bbq')) cuisine = 'American';

  // Detect categories (supports English and Chinese)
  const categories: RecipeCategory[] = [];
  if (textLower.includes('breakfast') || textLower.includes('早餐')) categories.push('Breakfast');
  if (textLower.includes('lunch') || textLower.includes('午餐') || textLower.includes('中餐')) categories.push('Lunch');
  if (textLower.includes('dinner') || textLower.includes('晚餐') || textLower.includes('晚饭')) categories.push('Dinner');
  if (textLower.includes('kid') || textLower.includes('child') || textLower.includes('儿童') || textLower.includes('孩子')) categories.push('Kid-Friendly');
  if (textLower.includes('batch') || textLower.includes('meal prep') || textLower.includes('批量') || textLower.includes('备餐')) categories.push('Batch-Cook Friendly');
  
  // Default category if none found
  if (categories.length === 0) {
    categories.push('Dinner');
  }

  // Estimate nutrition based on ingredients (supports English and Chinese)
  const hasProtein = ingredients.some(ing => 
    /chicken|beef|pork|fish|egg|tofu|bean|鸡|牛|猪|鱼|蛋|豆腐|肉/i.test(ing.name)
  );
  const hasVeggies = ingredients.some(ing => 
    /vegetable|carrot|broccoli|spinach|lettuce|tomato|pepper|菜|胡萝卜|西兰花|菠菜|番茄|辣椒|蔬菜/i.test(ing.name)
  );
  const hasCarbs = ingredients.some(ing => 
    /rice|pasta|bread|potato|noodle|米|面|饭|面条|馒头|土豆/i.test(ing.name)
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

