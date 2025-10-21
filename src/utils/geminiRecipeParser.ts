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

  // Create timeout promise (60 seconds)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI request timeout after 60 seconds')), 60000);
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for faster and more cost-effective parsing
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
    console.error('❌ Gemini parsing failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...error
    });
    
    if (error.message === 'API_KEY_NOT_CONFIGURED') {
      throw error;
    }
    
    // If AI fails, throw error to trigger fallback
    throw new Error(`AI parsing failed: ${error.message}`);
  }
}

