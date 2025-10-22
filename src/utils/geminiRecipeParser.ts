import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';

/**
 * Parse recipe text using Google Gemini AI
 * Falls back to local parser if AI fails
 */
export async function parseRecipeWithGemini(text: string): Promise<Partial<Recipe>> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️ Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  // Retry logic for API overload errors
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Create timeout promise (60 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout after 60 seconds')), 60000);
    });

    try {
      console.log(`📡 Sending request to Gemini API (attempt ${attempt}/3)...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash for improved parsing
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a recipe parsing assistant. Extract recipe information from the text below and return ONLY valid JSON (no markdown, no explanations).

Required JSON structure:
{
  "name": "Recipe name (string)",
  "cuisine": "One of: Korean, Chinese, Italian, American, Mexican, Japanese, Other",
  "categories": ["Array of: Breakfast, Lunch, Dinner, Snack, Kid-Friendly, Batch-Cook Friendly"],
  "prepTime": 15,
  "cookTime": 30,
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
  "portions": {
    "adult": "1 cup",
    "child5": "3/4 cup",
    "child2": "1/2 cup"
  }
}

IMPORTANT Rules:
- **PRESERVE THE ORIGINAL LANGUAGE**: If the recipe is in Chinese, output Chinese text for name, ingredients, and instructions. If in English, use English.
- If cuisine is unclear, use "Other"
- Extract all ingredients with amounts/units
- Number each ingredient starting from "1"
- Break instructions into clear steps
- If portions aren't specified, use reasonable defaults
- Times are in minutes
- Return ONLY the JSON object, nothing else

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
    
    // Add default image
    parsed.image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
    
    // Add default nutrition and plate composition
    parsed.nutrition = {
      protein: 0,
      fiber: 0,
      fat: 0,
      carbs: 0,
      iron: 'Moderate',
      calcium: 'Moderate',
    };
    
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

