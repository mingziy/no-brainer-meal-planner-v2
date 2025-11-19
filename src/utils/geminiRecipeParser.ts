import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';

/**
 * Translate recipe ingredients and instructions to English
 * Used when a recipe is extracted in Chinese to create bilingual versions
 */
export async function translateRecipeToEnglish(
  ingredients: Array<{ id: string; amount: string; unit: string; name: string }>,
  instructions: string[],
  name: string
): Promise<{
  nameEn: string;
  ingredientsEn: Array<{ id: string; amount: string; unit: string; name: string }>;
  instructionsEn: string[];
}> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured, skipping translation');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  try {
    console.log('🌐 Translating recipe to English...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Translate this Chinese recipe to English. Return ONLY valid JSON with no markdown or explanations.

Recipe Name: ${name}

Ingredients:
${ingredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`).join('\n')}

Instructions:
${instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}

Return JSON in this exact format:
{
  "nameEn": "English recipe name",
  "ingredientsEn": [
    {"id": "1", "amount": "2", "unit": "cups", "name": "flour"}
  ],
  "instructionsEn": [
    "Step 1 in English",
    "Step 2 in English"
  ]
}

IMPORTANT:
- Translate ingredient names naturally (e.g., 猪肉 → pork, 大蒜 → garlic)
- Keep amounts and units the same
- Keep ingredient IDs the same
- Translate instructions clearly and naturally
- Return ONLY the JSON, no other text`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const translated = JSON.parse(text);
    
    console.log('✅ Translation complete');
    return translated;
  } catch (error) {
    console.error('❌ Error translating recipe:', error);
    throw error;
  }
}

/**
 * Check if text contains Chinese characters
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Clean ingredient names using AI to remove processing details and punctuation
 * Converts plurals to singular form to consolidate similar items
 * Batch processes multiple ingredients in one API call for efficiency
 */
export async function cleanIngredientNames(ingredientNames: string[]): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured, falling back to regex cleaning');
    return ingredientNames; // Fallback to original names
  }

  try {
    console.log('🧹 Cleaning', ingredientNames.length, 'ingredient names with AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Clean these ingredient names for a shopping list. Remove ALL processing details, cooking instructions, punctuation, and descriptions. Convert plurals to singular form. Return ONLY the core ingredient name in SINGULAR form.

Examples:
- "garlic (minced)" → "garlic"
- "tomatoes, seeds removed" → "tomato"
- "chicken breast, boneless skinless" → "chicken breast"
- "olive oil (extra virgin)" → "olive oil"
- "onions - diced" → "onion"
- "bell peppers (red, chopped)" → "bell pepper"
- "carrots" → "carrot"
- "potatoes" → "potato"
- "green beans" → "green bean"
- "strawberries" → "strawberry"

Ingredient names to clean (one per line):
${ingredientNames.join('\n')}

Return ONLY the cleaned names in SINGULAR form, one per line, in the same order. No explanations, no numbering, no extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Split by newlines and clean up
    const cleanedNames = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Validate we got the same number of results
    if (cleanedNames.length !== ingredientNames.length) {
      console.warn('⚠️ AI returned different number of ingredients, using originals');
      return ingredientNames;
    }
    
    console.log('✅ Cleaned ingredient names:', cleanedNames);
    return cleanedNames;
  } catch (error) {
    console.error('❌ Error cleaning ingredient names with AI:', error);
    return ingredientNames; // Fallback to original names
  }
}

/**
 * Parse recipe text using Google Gemini AI
 * Falls back to local parser if AI fails
 * @param text - The recipe text to parse
 * @param timeoutMs - Optional timeout in milliseconds (default: 90000ms for OCR, 60000ms for clean text)
 */
export async function parseRecipeWithGemini(text: string, timeoutMs: number = 90000): Promise<Partial<Recipe>> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  // Retry logic for API overload errors
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Create timeout promise with configurable timeout
  const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`AI request timeout after ${timeoutMs / 1000} seconds`)), timeoutMs);
  });

  try {
      console.log(`📡 Sending request to Gemini API (attempt ${attempt}/3)...`);
    const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash for improved parsing
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a recipe parsing assistant. Extract recipe information from the text below and return ONLY valid JSON (no markdown, no explanations).

CRITICAL RULE: Detect the original language ('en' for English, 'zh' for Chinese/中文) and extract ALL content in that ORIGINAL language ONLY. DO NOT translate or provide bilingual content.

Required JSON structure:
{
  "originalLanguage": "en" or "zh",
  "name": "Recipe name in ORIGINAL language",
  "cuisine": "Cuisine type in ORIGINAL language (e.g., Chinese, Italian, Mexican, Japanese, Thai, Indian, Korean, American, French, Mediterranean, etc.)",
  "proteinType": "Main protein source in ORIGINAL language (e.g., Chicken, Beef, Pork, Fish, Vegan, Tofu, Shrimp, Turkey, Lamb, Eggs, etc.)",
  "mealType": "When to serve in ORIGINAL language (e.g., Breakfast, Lunch, Dinner, Snack)",
  "servings": 4,
  "caloriesPerServing": 350,
  "nutritionCalculationReasoning": "Explain in ORIGINAL language your calculation logic here, including: 1) How you determined serving size (from recipe text or estimated from ingredient amounts), 2) How you calculated calories per serving (cite USDA nutrition data, common nutrition databases, or standard calorie values), 3) Sources or reasoning for nutrition estimates (protein/carbs/fat/fiber)",
  "ingredients": [
    {
      "id": "1",
      "amount": "2",
      "unit": "cups",
      "name": "flour in ORIGINAL language"
    }
  ],
  "instructions": [
    "Step 1 instruction in ORIGINAL language",
    "Step 2 instruction in ORIGINAL language"
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
  },
  "portions": {
    "adult": "1 cup",
    "child5": "3/4 cup",
    "child2": "1/2 cup"
  }
}

IMPORTANT Rules:
- **Detect original language**: Set "originalLanguage" to "en" (English) or "zh" (Chinese/中文)
- **NO TRANSLATION**: Extract ALL content in the detected ORIGINAL language ONLY
- **NO BILINGUAL**: Do not provide both languages, only the original
- **cuisine**: Identify the primary cuisine type (e.g., Chinese, Italian, Mexican, Japanese, Thai, Indian, Korean, American, French, Mediterranean, etc.)
- **proteinType**: Identify the MAIN protein source. Examples:
  * Chicken dish → "Chicken"
  * Beef stir-fry → "Beef"
  * Tofu scramble → "Tofu"
  * Grilled salmon → "Fish"
  * Shrimp pasta → "Shrimp"
  * No meat/fish → "Vegan"
- **mealType**: When this dish is typically served (Breakfast, Lunch, Dinner, or Snack)
- Extract all ingredients with amounts/units
- Number each ingredient starting from "1"
- Break instructions into clear steps

**SERVING SIZE & NUTRITION CALCULATION (CRITICAL RULES)**:

**DO NOT use any nutrition information from the source recipe text. Calculate EVERYTHING from scratch using official USDA data.**

1. **Serving Size Determination**:
   - If recipe states serving size (e.g., "serves 4", "makes 6 servings"), use that exact number
   - If NO explicit serving size but ingredients have SPECIFIC AMOUNTS, estimate servings using:
     * 3-4 oz (85-115g) protein per serving (USDA dietary guidelines)
     * 1 cup vegetables per serving (MyPlate recommendations)
     * 1/2 cup cooked grains/pasta per serving (standard portion)
   - If ingredients LACK specific amounts, set "servings": 0

2. **Nutrition Calculation from Ingredients ONLY**:
   - **IGNORE any nutrition facts from the recipe source** (e.g., "350 calories", "20g protein")
   - Calculate ALL nutrition values from scratch by:
     a) Look up each ingredient in USDA FoodData Central
     b) Use ingredient amounts to calculate total nutrition
     c) Divide by number of servings to get per-serving values
   
3. **Official USDA FoodData Central Values** (per 100g RAW/UNCOOKED):
   
   **Proteins (raw/uncooked)**:
   - Chicken breast (raw, skinless): 165 cal, 31g protein, 0g carbs, 3.6g fat
   - Chicken thigh (raw, skinless): 119 cal, 18g protein, 0g carbs, 4.7g fat
   - Ground beef (80/20, raw): 254 cal, 17g protein, 0g carbs, 20g fat
   - Ground turkey (raw): 203 cal, 19g protein, 0g carbs, 13g fat
   - Salmon (raw, Atlantic): 208 cal, 20g protein, 0g carbs, 13g fat
   - Shrimp (raw): 85 cal, 18g protein, 0.9g carbs, 0.5g fat
   - Pork chop (raw, lean): 143 cal, 19g protein, 0g carbs, 7g fat
   - Tofu (firm, raw): 76 cal, 8g protein, 1.9g carbs, 4.8g fat
   - Eggs (whole, raw): 143 cal, 13g protein, 0.7g carbs, 9.5g fat, 0g fiber
   
   **Grains/Carbs (dry/uncooked)**:
   - White rice (dry, uncooked): 365 cal, 7g protein, 80g carbs, 0.6g fat, 1.3g fiber
   - Brown rice (dry, uncooked): 370 cal, 7.9g protein, 77.2g carbs, 2.9g fat, 3.5g fiber
   - Pasta (dry, uncooked): 371 cal, 13g protein, 75g carbs, 1.5g fat, 3.2g fiber
   - Quinoa (dry, uncooked): 368 cal, 14g protein, 64g carbs, 6g fat, 7g fiber
   - Oats (dry, uncooked): 389 cal, 17g protein, 66g carbs, 7g fat, 10.6g fiber
   - Bread (white): 265 cal, 9g protein, 49g carbs, 3.2g fat, 2.7g fiber
   
   **Vegetables (raw)**:
   - Broccoli (raw): 34 cal, 2.8g protein, 7g carbs, 0.4g fat, 2.6g fiber
   - Spinach (raw): 23 cal, 2.9g protein, 3.6g carbs, 0.4g fat, 2.2g fiber
   - Carrots (raw): 41 cal, 0.9g protein, 10g carbs, 0.2g fat, 2.8g fiber
   - Bell pepper (raw): 31 cal, 1g protein, 6g carbs, 0.3g fat, 2.1g fiber
   - Onion (raw): 40 cal, 1.1g protein, 9.3g carbs, 0.1g fat, 1.7g fiber
   - Tomatoes (raw): 18 cal, 0.9g protein, 3.9g carbs, 0.2g fat, 1.2g fiber
   - Zucchini (raw): 17 cal, 1.2g protein, 3.1g carbs, 0.3g fat, 1g fiber
   
   **Fats/Oils**:
   - Olive oil: 884 cal, 0g protein, 0g carbs, 100g fat, 0g fiber
   - Butter: 717 cal, 0.9g protein, 0.1g carbs, 81g fat, 0g fiber
   - Vegetable oil: 884 cal, 0g protein, 0g carbs, 100g fat, 0g fiber
   
   **Dairy (raw/fresh)**:
   - Whole milk: 61 cal, 3.2g protein, 4.8g carbs, 3.3g fat
   - Cheddar cheese: 403 cal, 25g protein, 1.3g carbs, 33g fat
   - Greek yogurt (plain): 59 cal, 10g protein, 3.6g carbs, 0.4g fat
   
   **Other**:
   - Sugar (granulated): 387 cal, 0g protein, 100g carbs, 0g fat, 0g fiber
   - Soy sauce: 53 cal, 5.6g protein, 4.9g carbs, 0g fat, 0g fiber
   
4. **% Daily Value Calculation** (based on FDA 2000 calorie diet):
   - proteinDV: (protein in g / 50g) × 100
   - fiberDV: (fiber in g / 28g) × 100
   - fatDV: (fat in g / 78g) × 100
   - carbsDV: (carbs in g / 275g) × 100
   
5. **Iron/Calcium**: Use "Low", "Moderate", or "High" based on ingredient types
   
6. **nutritionCalculationReasoning**: 
   - Show step-by-step calculation for EACH ingredient
   - Example: "1 lb chicken (454g): 750 cal, 141g protein, 16g fat"
   - Then show: "Total / 4 servings = 350 cal, 35g protein per serving"
   - Always cite USDA FoodData Central as source

Return ONLY the JSON object, nothing else.

Recipe text:
${text}`;

    console.log('📡 Sending request to Gemini API...');
    
    // Race between API call and timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]) as any;
    
    console.log('📥 Received response from Gemini');
    const response = result.response;
    const aiText = response.text();
    
    console.log('🤖 Gemini raw response:', aiText);

    // Try to extract JSON from the response (in case AI adds markdown)
    let jsonText = aiText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    console.log('✅ Gemini parsed recipe:', parsed);
    console.log('🔢 Calorie data extracted:', {
      caloriesPerServing: parsed.caloriesPerServing,
      servings: parsed.servings,
      hasReasoning: !!parsed.nutritionCalculationReasoning
    });
    
    // Log nutrition calculation reasoning if provided
    if (parsed.nutritionCalculationReasoning) {
      console.log('📊 GEMINI NUTRITION CALCULATION LOGIC:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(parsed.nutritionCalculationReasoning);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.warn('⚠️ No nutritionCalculationReasoning in parsed recipe');
    }
    
    // Add default image
    parsed.image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
    
    // Add default nutrition if not provided by AI
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
    
    // Calculate % Daily Value if not provided by AI (based on FDA 2000 calorie diet)
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
    
    // Add default servings and calories if not provided
    if (!parsed.servings) {
      parsed.servings = 0; // 0 means unknown/not specified
    }
    if (!parsed.caloriesPerServing) {
      parsed.caloriesPerServing = 0;
    }
    
    // Add default plate composition
    parsed.plateComposition = {
      protein: 25,
      veggies: 25,
      carbs: 25,
      fats: 25,
    };
    
    parsed.isFavorite = false;
    
    return parsed;
    
  } catch (error: any) {
      lastError = error;
      console.error(`❌ Gemini parsing attempt ${attempt} failed:`, error.message);
      
      if (error.message === 'API_KEY_NOT_CONFIGURED') {
        throw error;
      }
      
      // If it's a 503 (overloaded) and we have retries left, wait and retry
      if (error.message && error.message.includes('503') && attempt < 3) {
        const waitTime = attempt * 3000; // 3s, 6s
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors or last attempt, break
      break;
    }
  }
  
  // All retries failed
  console.error('❌ All Gemini parsing attempts failed:', lastError);
    console.error('Error details:', {
    message: lastError.message,
    stack: lastError.stack,
    name: lastError.name,
    ...lastError
  });
  
  // If AI fails, throw error to trigger fallback
  throw new Error(`AI parsing failed after 3 attempts: ${lastError.message}`);
}

/**
 * Parse recipe and generate BOTH English and Chinese versions
 * This creates a bilingual recipe perfect for building a Chinese recipe database from US sources
 */
export async function parseRecipeWithBilingualSupport(text: string): Promise<Partial<Recipe>> {
  console.log('🌏 Starting bilingual recipe parsing...');
  
  // First, parse the English version
  const englishRecipe = await parseRecipeWithGemini(text);
  console.log('✅ English version parsed');
  
  // Add a small delay to avoid rate limiting
  console.log('⏳ Waiting 2 seconds before Chinese translation to avoid rate limits...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Now, generate Chinese version
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ API key not configured, skipping Chinese translation');
    return englishRecipe; // Return English only if no API key
  }
  
  // Retry logic for Chinese translation
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔄 Chinese translation attempt ${attempt}/3...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const chinesePrompt = `You are a recipe translation assistant. Translate the following recipe INTO CHINESE (简体中文).

Translate these fields to Chinese:
- Recipe name
- All ingredient names (keep amounts/units as they are, just translate the ingredient names)
- All instruction steps

Return ONLY valid JSON with this structure:
{
  "nameZh": "中文食谱名称",
  "ingredientsZh": [
    {
      "id": "1",
      "amount": "2",
      "unit": "cups",
      "name": "面粉"
    }
  ],
  "instructionsZh": [
    "第一步的中文说明",
    "第二步的中文说明"
  ]
}

IMPORTANT:
- Translate ingredient NAMES to Chinese, but keep amounts and units in original format
- Translate instruction steps to natural Chinese
- Return ONLY the JSON, no markdown or explanations

Original English Recipe:
Name: ${englishRecipe.name}
Ingredients: ${JSON.stringify(englishRecipe.ingredients)}
Instructions: ${JSON.stringify(englishRecipe.instructions)}`;

    console.log('📡 Sending Chinese translation request to Gemini...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Chinese translation timeout')), 60000);
    });
    
    const result = await Promise.race([
      model.generateContent(chinesePrompt),
      timeoutPromise
    ]) as any;
    
    const response = result.response;
    let aiText = response.text().trim();
    
    // Remove markdown if present
    if (aiText.startsWith('```json')) {
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (aiText.startsWith('```')) {
      aiText = aiText.replace(/```\n?/g, '');
    }
    
    const chineseData = JSON.parse(aiText);
    console.log('✅ Chinese version generated:', chineseData);
    
    // Merge both versions
    const bilingualRecipe = {
      ...englishRecipe,
      nameZh: chineseData.nameZh,
      ingredientsZh: chineseData.ingredientsZh,
      instructionsZh: chineseData.instructionsZh,
    };
    
    console.log('🌏 Final bilingual recipe:', {
      english: { name: bilingualRecipe.name, ingredientCount: bilingualRecipe.ingredients?.length },
      chinese: { name: bilingualRecipe.nameZh, ingredientCount: bilingualRecipe.ingredientsZh?.length }
    });
    
    return bilingualRecipe;
    
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
      
      // If it's a 503 (overloaded) and we have retries left, wait and retry
      if (error.message.includes('503') && attempt < 3) {
        const waitTime = attempt * 3000; // 3s, 6s
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors or last attempt, break
      break;
    }
  }
  
  // All retries failed
  console.warn('⚠️ All Chinese translation attempts failed:', lastError?.message);
  console.log('📝 Returning English-only version');
  return englishRecipe;
}

/**
 * Parse recipe directly from image using Gemini Vision
 * This is MUCH faster than OCR + text parsing
 * @param imageDataUrl - Base64 data URL of the image
 */
export async function parseRecipeFromImage(imageDataUrl: string): Promise<Partial<Recipe>> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  console.log('📸 Processing image directly with Gemini Vision...');

  // Retry logic with exponential backoff
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Increase timeout to 90 seconds for image processing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI image processing timeout after 90 seconds')), 90000);
    });

    try {
      console.log(`📡 Sending image to Gemini API (attempt ${attempt}/3)...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Extract recipe from image. Analyze ingredients and calculate nutrition. Return ONLY valid JSON.

CRITICAL: Detect the original language ('en' for English or 'zh' for Chinese/中文) and extract ALL content in ORIGINAL language ONLY. DO NOT translate.

Format:
{"originalLanguage":"en or zh","name":"Recipe Name in ORIGINAL","cuisine":"Vietnamese","proteinTypes":["Chicken","Pork"],"mealType":"Lunch","servings":4,"caloriesPerServing":350,"nutritionCalculationReasoning":"Brief reasoning","nutrition":{"protein":30,"fiber":5,"fat":15,"carbs":40,"iron":"Moderate","calcium":"Moderate"},"ingredients":[{"id":"1","amount":"1","unit":"cup","name":"ingredient in ORIGINAL"}],"instructions":["Step 1 in ORIGINAL"]}

CRITICAL - Read recipe and calculate nutrition:
1. **originalLanguage**: Detect 'en' or 'zh' - extract everything in that language
2. Number ingredients from "1"
3. **cuisine**: Identify from dish name (Vietnamese, Chinese, Italian, Japanese, Korean, Thai, Indian, Mexican, American, French, Mediterranean, Other)
4. **proteinTypes**: ARRAY of proteins - if multiple, list ALL: ["Chicken","Pork"]
5. **mealType**: When eaten? (Breakfast, Lunch, Dinner, Snack)
6. **caloriesPerServing**: Estimate from ingredients
7. **nutrition**: Calculate per serving in grams:
   - protein: grams of protein (e.g., 30)
   - carbs: grams of carbohydrates (e.g., 40)
   - fat: grams of fat (e.g., 15)
   - fiber: grams of fiber (e.g., 5)
   - iron: "Low", "Moderate", or "High"
   - calcium: "Low", "Moderate", or "High"
8. **nutritionCalculationReasoning**: Brief explanation of calorie/nutrition calculation
9. **NO TRANSLATION**: Keep name, ingredients, instructions in original detected language

Return JSON only:`;

      // Convert base64 data URL to the format Gemini expects
      const base64Data = imageDataUrl.split(',')[1];
      const mimeType = imageDataUrl.split(';')[0].split(':')[1];

      const result = await Promise.race([
        model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]),
        timeoutPromise
      ]) as any;

      console.log('📥 Received response from Gemini Vision');
      const response = result.response;
      const aiText = response.text();
      
      console.log('🤖 Gemini raw response:', aiText);

      // Try to extract JSON from the response
      let jsonText = aiText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      
      // Remove "JSON:" prefix if present
      if (jsonText.toLowerCase().startsWith('json:')) {
        jsonText = jsonText.substring(5).trim();
      }
      
      // Find the actual JSON object (starts with { and ends with })
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }

      console.log('📝 Cleaned JSON text:', jsonText.substring(0, 200) + '...');
      const parsedRecipe = JSON.parse(jsonText);
      
      // Ensure required fields exist (AI might omit them)
      if (!parsedRecipe.caloriesPerServing) {
        parsedRecipe.caloriesPerServing = 0;
      }
      if (!parsedRecipe.nutritionCalculationReasoning) {
        parsedRecipe.nutritionCalculationReasoning = '';
      }
      
      // Handle proteinTypes array (new format) or proteinType string (old format)
      if (parsedRecipe.proteinTypes && Array.isArray(parsedRecipe.proteinTypes)) {
        // Store as array for the form to use
        parsedRecipe.proteinTypesArray = parsedRecipe.proteinTypes;
        // Keep first one as proteinType for backward compatibility
        parsedRecipe.proteinType = parsedRecipe.proteinTypes[0];
      } else if (parsedRecipe.proteinType) {
        // Handle comma-separated string from old responses
        if (parsedRecipe.proteinType.includes(',')) {
          parsedRecipe.proteinTypesArray = parsedRecipe.proteinType.split(',').map((s: string) => s.trim());
        } else {
          parsedRecipe.proteinTypesArray = [parsedRecipe.proteinType];
        }
      }
      
      console.log('✅ Successfully parsed recipe from image');
      console.log('🔢 Calorie data from image:', {
        caloriesPerServing: parsedRecipe.caloriesPerServing,
        servings: parsedRecipe.servings,
        hasReasoning: !!parsedRecipe.nutritionCalculationReasoning
      });
      console.log('🏷️ Tags extracted from image:', {
        cuisine: parsedRecipe.cuisine || 'MISSING',
        proteinTypes: parsedRecipe.proteinTypesArray || [parsedRecipe.proteinType] || 'MISSING',
        mealType: parsedRecipe.mealType || 'MISSING'
      });
      
      if (parsedRecipe.nutritionCalculationReasoning) {
        console.log('📊 IMAGE NUTRITION CALCULATION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(parsedRecipe.nutritionCalculationReasoning);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.warn('⚠️ No nutritionCalculationReasoning in image parsing result');
      }
      
      return parsedRecipe;
      
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // Retry immediately for 503/timeout errors
      if (attempt < 3 && 
          (error.message.includes('503') || 
           error.message.includes('overloaded') || 
           error.message.includes('timeout') ||
           error.message.includes('ECONNREFUSED'))) {
        console.log(`🔄 Retrying immediately (${attempt + 1}/3)...`);
        continue;
      }
      
      // For other errors, stop
      break;
    }
  }
  
  throw new Error(`AI image processing failed after 3 attempts: ${lastError.message}`);
}

/**
 * Generate recipe ideas based on user query
 * @param query - Natural language description (English or Chinese)
 * @param count - Number of recipe ideas to generate (default: 5)
 */
export async function generateRecipeIdeas(query: string, count: number = 5): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  console.log(`💡 Generating ${count} recipe ideas for: "${query}"`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Based on this query: "${query}"

Generate EXACTLY ${count} specific recipe names that match the request.

Rules:
- Return ONLY a JSON array of recipe names (strings)
- Each recipe name should be specific (e.g., "Honey Garlic Chicken Thighs", not just "Chicken")
- If query is in Chinese, respond in Chinese
- If query is in English, respond in English
- Match the user's dietary preferences, cooking style, and constraints
- Be creative but practical

Example output format:
["Recipe Name 1", "Recipe Name 2", "Recipe Name 3"]

Return ONLY the JSON array, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let aiText = response.text().trim();
    
    console.log('🤖 Raw AI response:', aiText);
    
    // Remove markdown code blocks if present
    if (aiText.startsWith('```json')) {
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (aiText.startsWith('```')) {
      aiText = aiText.replace(/```\n?/g, '');
    }
    
    // If the response is a JSON string (wrapped in quotes), parse it first
    if (aiText.startsWith('"') && aiText.endsWith('"')) {
      try {
        // Remove outer quotes and parse as JSON string
        aiText = JSON.parse(aiText);
        console.log('📝 Unwrapped JSON string:', aiText);
      } catch (e) {
        console.log('⚠️ Could not unwrap JSON string, continuing...');
      }
    }
    
    // Try to extract JSON array if it's embedded in text
    const arrayMatch = aiText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      aiText = arrayMatch[0];
    }

    try {
      const ideas = JSON.parse(aiText);
      
      // Validate it's an array
      if (!Array.isArray(ideas)) {
        throw new Error('Response is not an array');
      }
      
      console.log('✅ Generated recipe ideas:', ideas);
      return ideas;
    } catch (parseError: any) {
      console.error('❌ JSON parse failed. Raw text:', aiText);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to generate recipe ideas:', error);
    throw new Error(`Failed to generate ideas: ${error.message}`);
  }
}

/**
 * Search for the best recipe URL for a given dish name
 * Uses AI to generate most likely URL from popular recipe sites
 * @param dishName - Name of the dish to search for
 */
export async function searchRecipeUrl(dishName: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  console.log(`🔍 Finding recipe URL for: "${dishName}"`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate the most likely recipe URL for: "${dishName}"

Popular recipe sites:
- AllRecipes: https://www.allrecipes.com/recipe/[id]/[dish-name]/
- Simply Recipes: https://www.simplyrecipes.com/recipes/[dish_name]/
- Serious Eats: https://www.seriouseats.com/[dish-name-recipe]
- Food Network: https://www.foodnetwork.com/recipes/[chef]/[dish-name]
- Bon Appetit: https://www.bonappetit.com/recipe/[dish-name]
- Chinese (if dish is Chinese): 
  - https://www.xiachufang.com/search/?keyword=${encodeURIComponent(dishName)}
  - https://www.meishij.net/search/?q=${encodeURIComponent(dishName)}

Instructions:
1. If it's a Chinese dish (like 宫保鸡丁), use Chinese recipe sites
2. For Western dishes, use AllRecipes, Simply Recipes, or Serious Eats
3. Format the URL to match the site's pattern
4. Use lowercase, hyphens for spaces
5. Make it as specific as possible

Return ONLY the complete URL (starting with https://), nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let url = response.text().trim();
    
    // Clean up the URL
    url = url.replace(/```/g, '').replace(/\n/g, '').trim();
    
    // Validate URL format
    try {
      new URL(url);
      console.log('✅ Generated recipe URL:', url);
      return url;
    } catch {
      // If AI fails, construct a search URL for AllRecipes
      const searchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(dishName)}`;
      console.log('⚠️ AI URL invalid, using AllRecipes search:', searchUrl);
      return searchUrl;
    }
  } catch (error: any) {
    console.error('❌ Failed to generate recipe URL:', error);
    // Fallback to AllRecipes search
    const searchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(dishName)}`;
    console.log('🔄 Falling back to AllRecipes search:', searchUrl);
    return searchUrl;
  }
}

/**
 * Translate a recipe on-demand from one language to another
 * @param recipe - The recipe to translate
 * @param sourceLanguage - 'en' or 'zh'
 * @param targetLanguage - 'en' or 'zh'
 */
export async function translateRecipe(
  recipe: {
    name: string;
    ingredients: Array<{ id: string; amount: string; unit: string; name: string }>;
    instructions: string[];
    cuisine?: string;
    proteinType?: string;
    mealType?: string;
  },
  sourceLanguage: 'en' | 'zh',
  targetLanguage: 'en' | 'zh'
): Promise<{
  nameTranslated: string;
  ingredientsTranslated: Array<{ id: string; amount: string; unit: string; name: string }>;
  instructionsTranslated: string[];
  cuisineTranslated?: string;
  proteinTypeTranslated?: string;
  mealTypeTranslated?: string;
}> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured, cannot translate');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  try {
    console.log(`🌐 Translating recipe from ${sourceLanguage} to ${targetLanguage}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const targetLanguageName = targetLanguage === 'en' ? 'English' : 'Chinese (简体中文)';
    const sourceLanguageName = sourceLanguage === 'en' ? 'English' : 'Chinese (简体中文)';

    const prompt = `Your task: Translate this recipe from ${sourceLanguageName} to ${targetLanguageName}.

Source Recipe:
- Name: ${recipe.name}
- Cuisine: ${recipe.cuisine || 'N/A'}
- Protein Type: ${recipe.proteinType || 'N/A'}
- Meal Type: ${recipe.mealType || 'N/A'}
- Ingredients: ${JSON.stringify(recipe.ingredients)}
- Instructions: ${JSON.stringify(recipe.instructions)}

Translation Rules:
1. Translate ALL fields accurately to ${targetLanguageName}
2. Keep cooking terminology precise and culturally appropriate
3. Convert units if culturally appropriate (e.g., cups vs. ml)
4. Maintain ingredient specificity (don't generalize)
5. Keep cooking technique names accurate
6. For ingredients: keep amounts and units, translate only the ingredient names
7. IMPORTANT: You MUST translate the tags (cuisine, proteinType, mealType):
   - If source is "Chicken" -> translate to "鸡肉"
   - If source is "Pork" -> translate to "猪肉"
   - If source is "Beef" -> translate to "牛肉"
   - If source is "Seafood" -> translate to "海鲜"
   - If source is "Eggs" -> translate to "鸡蛋"
   - If source is "Breakfast" -> translate to "早餐"
   - If source is "Lunch" -> translate to "午餐"
   - If source is "Dinner" -> translate to "晚餐"
   - If source is "Japanese" -> translate to "日本料理"
   - If source is "Chinese" -> translate to "中国菜"
   - If source is "N/A" -> return empty string ""

CRITICAL: You MUST include these three fields in your response:
- cuisineTranslated
- proteinTypeTranslated  
- mealTypeTranslated

Return JSON in this EXACT format (DO NOT omit any fields):
{
  "nameTranslated": "translated recipe name",
  "cuisineTranslated": "translated cuisine or empty string",
  "proteinTypeTranslated": "translated protein type or empty string",
  "mealTypeTranslated": "translated meal type or empty string",
  "ingredientsTranslated": [
    {"id": "1", "amount": "2", "unit": "cups", "name": "translated ingredient name"}
  ],
  "instructionsTranslated": [
    "translated step 1",
    "translated step 2"
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations. ALL fields must be present.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const translated = JSON.parse(text);
    
    console.log('✅ Translation complete:', {
      originalName: recipe.name,
      translatedName: translated.nameTranslated,
      originalCuisine: recipe.cuisine,
      cuisineTranslated: translated.cuisineTranslated,
      originalProteinType: recipe.proteinType,
      proteinTypeTranslated: translated.proteinTypeTranslated,
      originalMealType: recipe.mealType,
      mealTypeTranslated: translated.mealTypeTranslated,
      fullResponse: translated
    });
    return translated;
  } catch (error) {
    console.error('❌ Error translating recipe:', error);
    throw error;
  }
}

/**
 * Detect language of quick food input
 * @param foodName - The food name entered by user
 */
export async function detectQuickFoodLanguage(
  foodName: string
): Promise<{
  originalLanguage: 'en' | 'zh';
  name: string;
}> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    // Simple fallback: check if it contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(foodName);
    return {
      originalLanguage: hasChinese ? 'zh' : 'en',
      name: foodName
    };
  }

  try {
    console.log(`🔍 Detecting language of food: "${foodName}"`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Detect the language of this food name: "${foodName}"

Detection Rules:
1. Detect if the input is English ('en') or Chinese ('zh')
2. Return the food name EXACTLY as entered (no translation)
3. If mixed language, detect the dominant language

Return JSON in this EXACT format:
{
  "originalLanguage": "en" or "zh",
  "name": "${foodName}"
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const detected = JSON.parse(text);
    
    console.log('✅ Language detected:', detected.originalLanguage);
    return detected;
  } catch (error) {
    console.error('❌ Error detecting language:', error);
    // Fallback to simple detection
    const hasChinese = /[\u4e00-\u9fa5]/.test(foodName);
    return {
      originalLanguage: hasChinese ? 'zh' : 'en',
      name: foodName
    };
  }
}

/**
 * Translate shopping list items to a target language
 * @param items - Array of shopping item names
 * @param targetLanguage - 'en' or 'zh'
 */
export async function translateShoppingList(
  items: Array<{ name: string; originalLanguage?: 'en' | 'zh' }>,
  targetLanguage: 'en' | 'zh'
): Promise<Array<{ original: string; translated: string; originalLanguage: 'en' | 'zh' }>> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured, cannot translate shopping list');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  try {
    console.log(`🛒 Translating ${items.length} shopping items to ${targetLanguage}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const targetLanguageName = targetLanguage === 'en' ? 'English' : 'Chinese (简体中文)';
    const itemsList = items.map(item => item.name).join(', ');

    const prompt = `Translate ALL these grocery items to ${targetLanguageName}:

Items: ${itemsList}

Translation Rules:
1. Detect each item's current language
2. Translate ALL items to ${targetLanguageName}
3. Use grocery-appropriate terminology
4. Keep items in singular form when appropriate
5. Maintain ingredient specificity

Return JSON array in this EXACT format:
[
  {"original": "original item name", "translated": "translated item name", "originalLanguage": "en" or "zh"},
  {"original": "original item name", "translated": "translated item name", "originalLanguage": "en" or "zh"}
]

Example:
Input: ["鸡蛋", "Milk", "面包", "Tomatoes"]
Target: English
Output: [
  {"original": "鸡蛋", "translated": "Eggs", "originalLanguage": "zh"},
  {"original": "Milk", "translated": "Milk", "originalLanguage": "en"},
  {"original": "面包", "translated": "Bread", "originalLanguage": "zh"},
  {"original": "Tomatoes", "translated": "Tomatoes", "originalLanguage": "en"}
]

IMPORTANT: Return ONLY valid JSON array, no markdown, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to extract JSON array if there's extra text
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      text = arrayMatch[0];
    }
    
    const translated = JSON.parse(text);
    
    console.log('✅ Shopping list translation complete');
    return translated;
  } catch (error) {
    console.error('❌ Error translating shopping list:', error);
    throw error;
  }
}

/**
 * Translate quick foods (food name and serving size)
 */
export async function translateQuickFoods(
  foods: Array<{ id: string; name: string; servingSize: string; originalLanguage?: 'en' | 'zh' }>,
  targetLanguage: 'en' | 'zh'
): Promise<Array<{ id: string; nameTranslated: string; servingSizeTranslated: string }>> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured, skipping translation');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  try {
    console.log(`🔄 Translating ${foods.length} quick foods to ${targetLanguage}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const foodList = foods.map(f => ({
      id: f.id,
      name: f.name,
      servingSize: f.servingSize,
      originalLanguage: f.originalLanguage || 'en'
    }));

    const prompt = `You are a professional food translator. Translate the following quick food items to ${targetLanguage === 'en' ? 'English' : 'Chinese'}.

Rules:
1. Translate both the food name and serving size
2. Keep the translation natural and commonly used
3. For serving sizes, translate units appropriately (e.g., "1 medium" → "1个中等大小", "1 cup" → "1杯")
4. If already in target language, return the same text
5. Maintain food item specificity and clarity

Input:
${JSON.stringify(foodList, null, 2)}

Return JSON array in this EXACT format:
[
  {
    "id": "food-id-1",
    "nameTranslated": "translated food name",
    "servingSizeTranslated": "translated serving size"
  },
  {
    "id": "food-id-2",
    "nameTranslated": "translated food name",
    "servingSizeTranslated": "translated serving size"
  }
]

IMPORTANT: 
- Return ONLY valid JSON array, no markdown, no explanations
- Include ALL ${foods.length} foods in the response
- Keep the same order as input`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📝 Raw AI response (first 200 chars):', text.substring(0, 200));

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const translated = JSON.parse(jsonMatch[0]);
    console.log(`✅ Quick foods translation complete: ${translated.length} items`);
    
    return translated;
  } catch (error) {
    console.error('❌ Error translating quick foods:', error);
    throw error;
  }
}


