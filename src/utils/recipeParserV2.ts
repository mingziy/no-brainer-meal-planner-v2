import { Recipe, Ingredient } from '../types';

/**
 * Enhanced recipe parser for messy OCR text
 * Handles unstructured, real-world OCR output
 */

export function parseRecipeTextV2(text: string): Partial<Recipe> {
  // Clean up text
  const cleanedText = text
    .replace(/\s+/g, ' ')  // Multiple spaces → single space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .trim();

  const lines = cleanedText
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Initialize recipe
  const recipe: Partial<Recipe> = {
    name: extractRecipeName(lines, cleanedText),
    image: '',
    cuisine: detectCuisine(cleanedText),
    categories: detectCategories(cleanedText),
    prepTime: extractTime(cleanedText, ['prep', '准备', '腌']),
    cookTime: extractTime(cleanedText, ['cook', 'bake', 'roast', '烤', '煮', '炒']),
    ingredients: extractIngredientsSmarter(lines, cleanedText),
    instructions: extractInstructionsSmarter(lines, cleanedText),
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    plateComposition: {
      protein: 0,
      carbs: 0,
      vegetables: 0,
    },
    portions: extractPortions(cleanedText),
    isFavorite: false,
    originalText: text, // Store the raw extracted text
  };

  return recipe;
}

function extractRecipeName(lines: string[], text: string): string {
  // Look for the longest line in first 10 lines (usually the title)
  const topLines = lines.slice(0, Math.min(10, lines.length));
  
  // Remove lines that look like section headers
  const candidates = topLines.filter(line => 
    line.length > 5 && 
    line.length < 100 &&
    !/(ingredients?|食材|材料|instructions?|做法|步骤)/i.test(line)
  );

  if (candidates.length > 0) {
    // Return the longest line as it's likely the title
    return candidates.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  // Fallback: use first line
  return lines[0] || 'Untitled Recipe';
}

function detectCuisine(text: string): string {
  const cuisinePatterns = {
    'Chinese': /中式|中国|炒|爆炒|炒饭|酱油|锅|川菜|粤菜|湘菜|东北菜/,
    'Vietnamese': /越南|越式|banh|pho|米粉/i,
    'Japanese': /日式|日本|寿司|拉面|天妇罗|味噌/,
    'Korean': /韩式|韩国|泡菜|烤肉|石锅/,
    'Italian': /italian|pasta|pizza|risotto/i,
    'Mexican': /mexican|taco|burrito|enchilada/i,
    'Indian': /indian|curry|tikka|masala|naan/i,
  };

  for (const [cuisine, pattern] of Object.entries(cuisinePatterns)) {
    if (pattern.test(text)) {
      return cuisine;
    }
  }

  return 'Other';
}

function detectCategories(text: string): string[] {
  const categories = [];
  
  if (/早餐|breakfast/i.test(text)) categories.push('Breakfast');
  if (/午餐|午饭|中餐|lunch/i.test(text)) categories.push('Lunch');
  if (/晚餐|晚饭|dinner/i.test(text)) categories.push('Dinner');
  if (/儿童|孩子|kid|child/i.test(text)) categories.push('Kid-Friendly');
  if (/批量|备餐|meal prep|batch/i.test(text)) categories.push('Meal Prep');
  
  return categories.length > 0 ? categories : ['Main Dish'];
}

function extractTime(text: string, keywords: string[]): number {
  // Look for patterns like "30分钟", "30 minutes", "30 min", "30 一 40分钟"
  const pattern = new RegExp(`(${keywords.join('|')}).{0,20}?(\\d+)\\s*(分钟|minutes?|mins?|小时|hours?|hrs?)`, 'i');
  const match = text.match(pattern);
  
  if (match) {
    const time = parseInt(match[2]);
    const unit = match[3];
    
    // Convert hours to minutes
    if (/小时|hours?|hrs?/i.test(unit)) {
      return time * 60;
    }
    return time;
  }
  
  return 0;
}

function extractPortions(text: string): number {
  // Look for patterns like "4人份", "serves 4", "4 servings"
  const patterns = [
    /(\d+)\s*人份/,
    /serves?\s*(\d+)/i,
    /(\d+)\s*servings?/i,
    /(\d+)\s*份/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return 4; // Default
}

function extractIngredientsSmarter(lines: string[], text: string): Ingredient[] {
  const ingredients: Ingredient[] = [];
  let ingredientId = 1;
  
  // Common ingredient indicators
  const ingredientPatterns = [
    // Chinese patterns: "鸡腿 300g", "白糖 60g", "盐 6g"
    /([\u4e00-\u9fa5]+)\s*(\d+\.?\d*)\s*(g|ml|克|毫升|勺|杯|个|片|条)/,
    // Mixed: "法棍 2 条", "胡萝卜 丝 150g"
    /([\u4e00-\u9fa5]+[\u4e00-\u9fa5\s]*?)\s*(\d+\.?\d*)\s*(g|ml|克|毫升|勺|杯|个|片|条|cm)/,
    // "适量", "少许"
    /([\u4e00-\u9fa5]+)\s*(适量|少许)/,
    // English: "2 cups flour", "1 tablespoon salt"
    /(\d+\.?\d*)\s+(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|lbs?|pounds?)\s+([\w\s]+)/i,
  ];
  
  for (const line of lines) {
    // Skip obvious section headers
    if (/^(做法|步骤|instructions?|directions?|method|烤箱|复脆|组装):?$/i.test(line)) {
      continue;
    }
    
    // Try each pattern
    let matched = false;
    for (const pattern of ingredientPatterns) {
      const match = line.match(pattern);
      if (match) {
        matched = true;
        
        if (pattern.source.includes('适量|少许')) {
          // Pattern: "盐 适量"
          ingredients.push({
            id: String(ingredientId++),
            amount: match[2],
            unit: '',
            name: match[1].trim(),
          });
        } else if (pattern.source.includes('cups?|tbsp')) {
          // English pattern
          ingredients.push({
            id: String(ingredientId++),
            amount: match[1],
            unit: match[2],
            name: match[3].trim(),
          });
        } else {
          // Chinese pattern
          ingredients.push({
            id: String(ingredientId++),
            amount: match[2] || '',
            unit: match[3] || '',
            name: match[1].trim().replace(/\\s+/g, ''),
          });
        }
        break;
      }
    }
    
    // If line contains food words but no match, add as ingredient anyway
    if (!matched && line.length < 50 && containsFoodWords(line)) {
      ingredients.push({
        id: String(ingredientId++),
        amount: '',
        unit: '',
        name: line.trim(),
      });
    }
  }
  
  // Remove duplicates and clean up
  const seen = new Set<string>();
  return ingredients.filter(ing => {
    const key = ing.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function containsFoodWords(line: string): boolean {
  const foodKeywords = [
    '鸡', '牛', '猪', '鱼', '虾', '蛋', '肉', '菜', '面', '饭', '米', '豆腐',
    '胡萝卜', '白萝卜', '黄瓜', '番茄', '西红柿', '土豆', '洋葱', '大蒜',
    '姜', '葱', '香菜', '青椒', '辣椒',
    'chicken', 'beef', 'pork', 'fish', 'egg', 'meat', 'vegetable',
    'carrot', 'potato', 'onion', 'garlic', 'tomato',
    '油', '盐', '糖', '醋', '酱油', 'oil', 'salt', 'sugar', 'vinegar',
    'flour', 'bread', 'noodle', 'rice',
  ];
  
  return foodKeywords.some(keyword => line.includes(keyword));
}

function extractInstructionsSmarter(lines: string[], text: string): string[] {
  const instructions: string[] = [];
  
  // Look for instruction indicators
  const instructionKeywords = [
    '做法', '步骤', '制作', '烹饪', '方法',
    'instructions', 'directions', 'method', 'steps',
    '腌', '烤', '炒', '煮', '切', '拌', '放', '加',
    'mix', 'bake', 'cook', 'fry', 'add', 'pour', 'stir',
  ];
  
  for (const line of lines) {
    // Skip if it's clearly an ingredient
    if (line.match(/\d+\s*(g|ml|克|毫升|杯|勺)/)) {
      continue;
    }
    
    // Check if it contains instruction keywords or cooking verbs
    const hasInstructionWord = instructionKeywords.some(keyword => 
      line.includes(keyword)
    );
    
    // Long lines (> 20 chars) with cooking verbs are likely instructions
    if ((hasInstructionWord || line.length > 20) && line.length < 200) {
      const cleaned = line
        .replace(/^\d+[.、）)]/, '') // Remove numbering
        .replace(/^[•\-*]\s*/, '') // Remove bullets
        .trim();
      
      if (cleaned.length > 5) {
        instructions.push(cleaned);
      }
    }
  }
  
  // If we didn't find many instructions, be more lenient
  if (instructions.length < 3) {
    for (const line of lines) {
      if (line.length > 30 && line.length < 200 &&
          !line.match(/\d+\s*(g|ml|克|毫升)/) &&
          !/(ingredients?|食材|材料)/i.test(line)) {
        instructions.push(line);
      }
    }
  }
  
  return instructions.slice(0, 15); // Limit to 15 steps
}

