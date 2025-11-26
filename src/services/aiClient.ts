/**
 * ========================================
 * AI CLIENT - CENTRALIZED AI SERVICE
 * ========================================
 * 
 * This is the ONLY file where AI API calls should happen.
 * All AI prompts, model configurations, and API interactions are centralized here.
 * 
 * Services used:
 * - Google Gemini (recipe parsing, ingredient cleaning, idea generation)
 * - OpenAI (future: fallback, specialized tasks)
 * 
 * NO other file should directly call AI APIs.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';

// ========================================
// MODEL CONFIGURATION
// ========================================

const MODELS = {
  GEMINI_FLASH: 'gemini-2.5-flash',  // Fast, cost-effective
  GEMINI_PRO: 'gemini-2.5-pro',      // More capable, slower
} as const;

const TIMEOUTS = {
  TEXT_PARSING: 60000,    // 60s for text parsing
  IMAGE_PARSING: 90000,   // 90s for image processing
  QUICK_TASK: 30000,      // 30s for simple tasks
} as const;

// ========================================
// FEATURE FLAGS & CONSENT
// ========================================

export const AI_ENABLED = {
  extraction: true,
  cleaning: true,
  ideas: true,
  urlSearch: true,
};

/**
 * Placeholder for AI consent check
 * TODO: Implement proper consent UI flow
 */
function checkAIConsent(feature: keyof typeof AI_ENABLED): boolean {
  return AI_ENABLED[feature];
}

/**
 * Placeholder for AI usage logging
 * TODO: Implement proper logging for compliance
 */
function logAIUsage(feature: string, metadata: any): void {
  console.log(`[AI Usage] ${feature}`, metadata);
}

// ========================================
// HELPER: GET API KEY
// ========================================

function getGeminiApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }
  
  return apiKey;
}

// ========================================
// HELPER: RETRY WITH BACKOFF
// ========================================

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  timeoutMs: number = 30000
): Promise<T> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs);
    });
    
    try {
      console.log(`📡 AI request attempt ${attempt}/${maxAttempts}...`);
      const result = await Promise.race([operation(), timeoutPromise]);
      console.log(`✅ AI request succeeded on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // Check if we should retry
      const shouldRetry = attempt < maxAttempts && (
        error.message?.includes('503') ||
        error.message?.includes('overloaded') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED')
      );
      
      if (shouldRetry) {
        const waitTime = attempt * 3000; // 3s, 6s
        console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
}

// ========================================
// 1. CLEAN INGREDIENT NAMES
// ========================================

/**
 * Clean ingredient names using AI to remove processing details and punctuation.
 * Converts plurals to singular form to consolidate similar items.
 * Also categorizes ingredients for shopping list grouping.
 * Batch processes multiple ingredients in one API call for efficiency.
 */
export async function cleanIngredientNames(
  ingredientNames: string[]
): Promise<Array<{ name: string; category: string }>> {
  if (!checkAIConsent('cleaning')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('cleanIngredientNames', { count: ingredientNames.length });
  
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

    const prompt = `You are a shopping list optimizer. Clean these ingredient names and categorize them for shopping.

CRITICAL RULES:
1. Remove ALL processing details (minced, diced, chopped, sliced, peeled, hulled, etc.)
2. Remove ALL cooking instructions (boneless, skinless, seeds removed, deveined, etc.)
3. Remove ALL punctuation, parentheses, and special characters
4. Convert ALL plurals to SINGULAR form
5. PRESERVE the specific type/variety (red onion stays "red onion", cherry tomato stays "cherry tomato", chicken breast stays "chicken breast")
6. Remove quality descriptors ONLY if they don't change the ingredient (e.g., "extra virgin" from olive oil, "fresh" from garlic)

CATEGORIES (choose ONE for each ingredient):
- produce: vegetables, fruits, herbs, mushrooms
- meat: all meat, poultry, seafood, fish
- dairy: milk, cheese, eggs, yogurt, butter, cream
- pantry: grains, pasta, rice, oil, spices, sauces, condiments, flour

OUTPUT FORMAT (CRITICAL):
Each line must be: CLEANED_NAME | CATEGORY

Examples:
- "garlic (minced)" → "garlic | produce"
- "tomatoes, seeds removed" → "tomato | produce"
- "cherry tomatoes" → "cherry tomato | produce"
- "chicken breast, boneless skinless" → "chicken breast | meat"
- "olive oil (extra virgin)" → "olive oil | pantry"
- "eggs, beaten" → "egg | dairy"
- "onions - diced" → "onion | produce"
- "soy sauce" → "soy sauce | pantry"

Ingredient names to clean (one per line):
${ingredientNames.join('\n')}

Return ONLY "cleaned_name | category" format, one per line, in the same order. No explanations, no numbering, no extra text.`;

    const result = await retryWithBackoff(
      () => model.generateContent(prompt),
      3,
      TIMEOUTS.QUICK_TASK
    );
    
    const response = result.response;
    const text = response.text().trim();
    
    // Parse response
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedResults = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length === 2) {
        return { name: parts[0], category: parts[1] };
      }
      return { name: line, category: 'pantry' };
    });
    
    // Validate count
    if (parsedResults.length !== ingredientNames.length) {
      console.warn('⚠️ AI returned different number of ingredients, using originals');
      return ingredientNames.map(name => ({ name, category: 'pantry' }));
    }
    
    console.log('✅ Cleaned and categorized ingredients');
    return parsedResults;
  } catch (error: any) {
    console.error('❌ Error cleaning ingredient names:', error);
    return ingredientNames.map(name => ({ name, category: 'pantry' }));
  }
}

// ========================================
// 2. PARSE RECIPE FROM TEXT
// ========================================

/**
 * Parse recipe text using Google Gemini AI.
 * Extracts structured recipe data including ingredients, instructions, nutrition.
 */
export async function parseRecipeFromText(
  text: string,
  timeoutMs: number = TIMEOUTS.TEXT_PARSING
): Promise<Partial<Recipe>> {
  if (!checkAIConsent('extraction')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('parseRecipeFromText', { textLength: text.length });
  
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

  const prompt = `You are a recipe parsing assistant. Extract recipe information from the text below and return ONLY valid JSON (no markdown, no explanations).

Required JSON structure:
{
  "name": "Recipe name (string)",
  "cuisine": "Cuisine type (e.g., Italian, Mexican, Japanese, Thai, Indian, Korean, American, French, Mediterranean, etc.)",
  "proteinType": "Main protein source (e.g., Poultry, Beef, Pork, Fish, Vegan, Tofu, Seafood, Eggs, etc.)",
  "mealType": "When to serve (e.g., Breakfast, Lunch, Dinner, Snack)",
  "servings": 4,
  "caloriesPerServing": 350,
  "nutritionCalculationReasoning": "Explain your calculation logic here",
  "ingredients": [
    {
      "id": "1",
      "amount": "2",
      "unit": "cups",
      "name": "flour"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "nutrition": {
    "protein": 25,
    "proteinDV": 50,
    "fiber": 5,
    "fiberDV": 18,
    "fat": 12,
    "fatDV": 15,
    "carbs": 40,
    "carbsDV": 15,
    "iron": "Moderate",
    "calcium": "High"
  }
}

IMPORTANT Rules:
- **cuisine**: Identify the primary cuisine type
- **proteinType**: Use "Poultry" for chicken/turkey/duck, otherwise specific protein
- **mealType**: When this dish is typically served
- Extract all ingredients with amounts/units
- Number each ingredient starting from "1"
- Break instructions into clear steps
- Calculate nutrition from USDA data
- Provide reasoning for nutrition calculations

Return ONLY the JSON object, nothing else.

Recipe text:
${text}`;

  const result = await retryWithBackoff(
    () => model.generateContent(prompt),
    3,
    timeoutMs
  );

  const response = result.response;
  let aiText = response.text();

  // Clean markdown
  let jsonText = aiText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }

  const parsed = JSON.parse(jsonText);

  // Add defaults
  parsed.image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  
  if (!parsed.nutrition) {
    parsed.nutrition = {
      protein: 0,
      fiber: 0,
      fat: 0,
      carbs: 0,
      iron: 'Moderate',
      calcium: 'Moderate',
    };
  }

  // Calculate DV if missing
  if (parsed.nutrition.protein && !parsed.nutrition.proteinDV) {
    parsed.nutrition.proteinDV = Math.round((parsed.nutrition.protein / 50) * 100);
  }
  if (parsed.nutrition.fiber && !parsed.nutrition.fiberDV) {
    parsed.nutrition.fiberDV = Math.round((parsed.nutrition.fiber / 28) * 100);
  }
  if (parsed.nutrition.fat && !parsed.nutrition.fatDV) {
    parsed.nutrition.fatDV = Math.round((parsed.nutrition.fat / 78) * 100);
  }
  if (parsed.nutrition.carbs && !parsed.nutrition.carbsDV) {
    parsed.nutrition.carbsDV = Math.round((parsed.nutrition.carbs / 275) * 100);
  }

  parsed.servings = parsed.servings || 0;
  parsed.caloriesPerServing = parsed.caloriesPerServing || 0;
  parsed.plateComposition = {
    protein: 25,
    veggies: 25,
    carbs: 25,
    fats: 25,
  };
  parsed.isFavorite = false;

  console.log('✅ Parsed recipe from text');
  return parsed;
}

// ========================================
// 3. PARSE RECIPE FROM IMAGE
// ========================================

/**
 * Parse recipe directly from image using Gemini Vision.
 * Much faster than OCR + text parsing.
 */
export async function parseRecipeFromImage(
  imageDataUrl: string
): Promise<Partial<Recipe>> {
  if (!checkAIConsent('extraction')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('parseRecipeFromImage', { imageSize: imageDataUrl.length });
  
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

  const prompt = `Extract recipe from image. Analyze ingredients and calculate nutrition. Return ONLY valid JSON.

Format:
{"name":"Recipe Name","cuisine":"Italian","proteinType":"Poultry","mealType":"Lunch","servings":4,"caloriesPerServing":350,"nutritionCalculationReasoning":"Brief reasoning","nutrition":{"protein":30,"fiber":5,"fat":15,"carbs":40,"iron":"Moderate","calcium":"Moderate"},"ingredients":[{"id":"1","amount":"1","unit":"cup","name":"ingredient"}],"instructions":["Step 1"]}

CRITICAL - Read recipe and calculate nutrition:
1. Number ingredients from "1"
2. **cuisine**: Identify from dish name
3. **proteinType**: Use "Poultry" for chicken/turkey/duck
4. **mealType**: When eaten? (Breakfast, Lunch, Dinner, Snack)
5. **caloriesPerServing**: Estimate from ingredients
6. **nutrition**: Calculate per serving in grams
7. **nutritionCalculationReasoning**: Brief explanation

Return JSON only:`;

  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const result = await retryWithBackoff(
    () => model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]),
    3,
    TIMEOUTS.IMAGE_PARSING
  );

  const response = result.response;
  let aiText = response.text();

  // Clean JSON
  let jsonText = aiText.trim();
  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }
  if (jsonText.toLowerCase().startsWith('json:')) {
    jsonText = jsonText.substring(5).trim();
  }
  
  const jsonStart = jsonText.indexOf('{');
  const jsonEnd = jsonText.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
  }

  const parsedRecipe = JSON.parse(jsonText);

  // Ensure required fields
  parsedRecipe.caloriesPerServing = parsedRecipe.caloriesPerServing || 0;
  parsedRecipe.nutritionCalculationReasoning = parsedRecipe.nutritionCalculationReasoning || '';

  console.log('✅ Parsed recipe from image');
  return parsedRecipe;
}

// ========================================
// 4. GENERATE RECIPE IDEAS
// ========================================

/**
 * Generate recipe ideas based on user query.
 * Returns array of specific recipe names.
 */
export async function generateRecipeIdeas(
  query: string,
  count: number = 5
): Promise<string[]> {
  if (!checkAIConsent('ideas')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('generateRecipeIdeas', { query, count });
  
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

  const prompt = `Based on this query: "${query}"

Generate EXACTLY ${count} specific recipe names that match the request.

Rules:
- Return ONLY a JSON array of recipe names (strings)
- Each recipe name should be specific (e.g., "Honey Garlic Chicken Thighs", not just "Chicken")
- Match the user's dietary preferences, cooking style, and constraints
- Be creative but practical

Example output format:
["Recipe Name 1", "Recipe Name 2", "Recipe Name 3"]

Return ONLY the JSON array, nothing else.`;

  const result = await retryWithBackoff(
    () => model.generateContent(prompt),
    3,
    TIMEOUTS.QUICK_TASK
  );

  const response = result.response;
  let aiText = response.text().trim();

  // Clean response
  if (aiText.startsWith('```json')) {
    aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (aiText.startsWith('```')) {
    aiText = aiText.replace(/```\n?/g, '');
  }

  if (aiText.startsWith('"') && aiText.endsWith('"')) {
    try {
      aiText = JSON.parse(aiText);
    } catch (e) {
      // Continue
    }
  }

  const arrayMatch = aiText.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    aiText = arrayMatch[0];
  }

  const ideas = JSON.parse(aiText);

  if (!Array.isArray(ideas)) {
    throw new Error('Response is not an array');
  }

  console.log('✅ Generated recipe ideas');
  return ideas;
}

// ========================================
// 5. SEARCH RECIPE URL
// ========================================

/**
 * Search for the best recipe URL for a given dish name.
 * Uses AI to generate most likely URL from popular recipe sites.
 */
export async function searchRecipeUrl(dishName: string): Promise<string> {
  if (!checkAIConsent('urlSearch')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('searchRecipeUrl', { dishName });
  
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

    const prompt = `Generate the most likely recipe URL for: "${dishName}"

Popular recipe sites:
- AllRecipes: https://www.allrecipes.com/recipe/[id]/[dish-name]/
- Simply Recipes: https://www.simplyrecipes.com/recipes/[dish_name]/
- Serious Eats: https://www.seriouseats.com/[dish-name-recipe]

Instructions:
1. Use AllRecipes, Simply Recipes, or Serious Eats
2. Format the URL to match the site's pattern
3. Use lowercase, hyphens for spaces
4. Make it as specific as possible

Return ONLY the complete URL (starting with https://), nothing else.`;

    const result = await retryWithBackoff(
      () => model.generateContent(prompt),
      3,
      TIMEOUTS.QUICK_TASK
    );

    const response = result.response;
    let url = response.text().trim();

    // Clean URL
    url = url.replace(/```/g, '').replace(/\n/g, '').trim();

    // Validate
    try {
      new URL(url);
      console.log('✅ Generated recipe URL');
      return url;
    } catch {
      throw new Error('Invalid URL generated');
    }
  } catch (error: any) {
    console.error('❌ Failed to generate recipe URL:', error);
    const searchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(dishName)}`;
    console.log('🔄 Falling back to AllRecipes search');
    return searchUrl;
  }
}

// ========================================
// 6. ANALYZE QUICK FOOD NUTRITION
// ========================================

export interface QuickFoodAnalysis {
  emoji: string;
  category: 'fruit' | 'veggie' | 'dairy' | 'grain' | 'protein' | 'snack' | 'drink';
  servingSize: string;
  calories: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

/**
 * Analyze quick food item and estimate nutrition.
 * Used for QuickFoods feature.
 */
export async function analyzeQuickFoodNutrition(
  foodDescription: string
): Promise<QuickFoodAnalysis> {
  if (!checkAIConsent('extraction')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('analyzeQuickFoodNutrition', { foodDescription });
  
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

  const prompt = `Analyze this food description: "${foodDescription.trim()}"

The user has described a food item including the serving size. Please extract and analyze:
- The food name
- The food category (fruit, veggie, dairy, grain, protein, snack, or drink)
- The serving size mentioned (or use typical serving if not specified)
- Calculate the approximate nutrition values

Provide the following information in JSON format:
{
  "emoji": "appropriate emoji for this food (single emoji)",
  "category": "one of: fruit, veggie, dairy, grain, protein, snack, drink",
  "servingSize": "the serving size mentioned in the description (e.g., '1 cup', '100g', '1 medium')",
  "calories": number (approximate calories for this serving),
  "nutrition": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams)
  }
}

Return ONLY valid JSON, no additional text or explanation.`;

  const result = await retryWithBackoff(
    () => model.generateContent(prompt),
    3,
    TIMEOUTS.QUICK_TASK
  );

  const response = result.response;
  let text = response.text().trim();

  // Clean markdown
  if (text.startsWith('```json')) {
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/```\n?/g, '');
  }

  const data: QuickFoodAnalysis = JSON.parse(text);
  console.log('✅ Analyzed quick food nutrition');
  return data;
}

// ========================================
// 7. CALCULATE RECIPE NUTRITION
// ========================================

export interface RecipeNutritionAnalysis {
  caloriesPerServing: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    iron: 'Low' | 'Moderate' | 'High';
    calcium: 'Low' | 'Moderate' | 'High';
  };
  nutritionCalculationReasoning: string;
}

/**
 * Calculate complete nutrition for a recipe.
 * Used in recipe edit form.
 */
export async function calculateRecipeNutrition(
  recipeName: string,
  ingredients: Array<{ amount: string; unit: string; name: string }>,
  instructions: string[],
  servings: number
): Promise<RecipeNutritionAnalysis> {
  if (!checkAIConsent('extraction')) {
    throw new Error('AI consent required');
  }
  
  logAIUsage('calculateRecipeNutrition', { recipeName, servings });
  
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });

  const ingredientsText = ingredients
    .filter(ing => ing.name.trim())
    .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`.trim())
    .join('\n');

  const instructionsText = instructions
    .filter(inst => inst.trim())
    .map((inst, idx) => `${idx + 1}. ${inst}`)
    .join('\n');

  const prompt = `Calculate the complete nutrition information for this recipe. Return ONLY valid JSON (no markdown, no explanations).

Recipe: ${recipeName}
Servings: ${servings}

Ingredients:
${ingredientsText}

${instructionsText ? `Instructions:\n${instructionsText}` : ''}

Required JSON structure:
{
  "caloriesPerServing": 350,
  "nutrition": {
    "protein": 30,
    "carbs": 40,
    "fat": 15,
    "fiber": 5,
    "iron": "Moderate",
    "calcium": "Moderate"
  },
  "nutritionCalculationReasoning": "Detailed explanation of your calculation including: 1) How you determined serving size, 2) How you calculated calories and macros per serving with specific values for each major ingredient, 3) Sources or reasoning (cite USDA data, nutrition databases, or standard values)"
}

IMPORTANT:
- protein, carbs, fat, fiber: provide values in GRAMS per serving
- iron, calcium: provide as "Low", "Moderate", or "High"
- nutritionCalculationReasoning: explain your calculation methodology

Return ONLY the JSON, no other text.`;

  const result = await retryWithBackoff(
    () => model.generateContent(prompt),
    3,
    TIMEOUTS.TEXT_PARSING
  );

  const response = result.response;
  const text = response.text().trim();

  // Clean JSON
  let jsonText = text;
  if (text.includes('```json')) {
    jsonText = text.split('```json')[1].split('```')[0].trim();
  } else if (text.includes('```')) {
    jsonText = text.split('```')[1].split('```')[0].trim();
  }

  const parsed: RecipeNutritionAnalysis = JSON.parse(jsonText);
  console.log('✅ Calculated recipe nutrition');
  return parsed;
}

// ========================================
// EXPORTS
// ========================================

export {
  MODELS,
  TIMEOUTS,
  checkAIConsent,
  logAIUsage,
  getGeminiApiKey,
  retryWithBackoff,
};
