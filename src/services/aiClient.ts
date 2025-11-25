/**
 * Centralized AI Client Service
 * 
 * All AI operations go through this service for:
 * - Consistent error handling
 * - Model selection logic
 * - Compliance tracking (placeholders)
 * - Feature flags
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';
import { RecipeExtractionResponse, BrainstormResponse, validateRecipeResponse, validateBrainstormResponse } from '../types/schemas';

// ========================================================
// CONFIGURATION
// ========================================================

const MODEL_CONFIG = {
  gemini: {
    flash: 'gemini-2.5-flash',
    pro: 'gemini-1.5-pro',
  },
  openai: {
    gpt4o: 'gpt-4o',
    gpt4oMini: 'gpt-4o-mini',
    gpt5: 'gpt-5.1',
  },
};

const AI_ENABLED = {
  extraction: true,
  cleaning: true,
  brainstorming: true,
  chatbot: true,
};

// ========================================================
// HELPER FUNCTIONS
// ========================================================

function getApiKey(provider: 'gemini' | 'openai'): string {
  const key = provider === 'gemini' 
    ? import.meta.env.VITE_GEMINI_API_KEY 
    : import.meta.env.VITE_OPENAI_API_KEY;
    
  if (!key || key === 'your_api_key_here') {
    throw new Error(`${provider.toUpperCase()}_API_KEY_NOT_CONFIGURED`);
  }
  
  return key;
}

function selectModel(task: 'extraction' | 'cleaning' | 'brainstorming' | 'chatbot'): { provider: 'gemini' | 'openai'; model: string } {
  // For now, use Gemini for most tasks (can be changed based on requirements)
  switch (task) {
    case 'extraction':
      return { provider: 'gemini', model: MODEL_CONFIG.gemini.flash };
    case 'cleaning':
      return { provider: 'gemini', model: MODEL_CONFIG.gemini.flash };
    case 'brainstorming':
      return { provider: 'gemini', model: MODEL_CONFIG.gemini.flash };
    case 'chatbot':
      return { provider: 'gemini', model: MODEL_CONFIG.gemini.flash };
    default:
      return { provider: 'gemini', model: MODEL_CONFIG.gemini.flash };
  }
}

async function callGemini(model: string, prompt: string): Promise<string> {
  const apiKey = getApiKey('gemini');
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });
  
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

function logAIUsage(task: string, inputSize: number, outputSize: number): void {
  // TODO: Implement actual logging for compliance
  console.log(`[AI Log] Task: ${task}, Input: ${inputSize} chars, Output: ${outputSize} chars`);
}

function requestUserConsentForAI(): boolean {
  // TODO: Implement actual consent check
  // For now, assume consent is granted
  return true;
}

// ========================================================
// PUBLIC API
// ========================================================

/**
 * Extract recipe from URL (currently client-side, will move to backend)
 * @deprecated Use backend extraction instead for compliance
 */
export async function extractRecipeFromUrl(url: string): Promise<Recipe> {
  if (!AI_ENABLED.extraction) {
    throw new Error('AI_EXTRACTION_DISABLED');
  }
  
  if (!requestUserConsentForAI()) {
    throw new Error('AI_CONSENT_REQUIRED');
  }
  
  // TODO: This should call backend API, not process directly
  console.warn('[aiClient] extractRecipeFromUrl should use backend API');
  throw new Error('NOT_IMPLEMENTED_USE_BACKEND');
}

/**
 * Extract recipe from screenshot/image
 * @deprecated Use backend extraction instead for compliance
 */
export async function extractRecipeFromScreenshot(imageBlob: Blob): Promise<Recipe> {
  if (!AI_ENABLED.extraction) {
    throw new Error('AI_EXTRACTION_DISABLED');
  }
  
  if (!requestUserConsentForAI()) {
    throw new Error('AI_CONSENT_REQUIRED');
  }
  
  // TODO: This should call backend API, not process directly
  console.warn('[aiClient] extractRecipeFromScreenshot should use backend API');
  throw new Error('NOT_IMPLEMENTED_USE_BACKEND');
}

/**
 * Clean and normalize ingredient names
 */
export async function cleanIngredientNames(ingredientNames: string[]): Promise<Array<{ name: string; category: string }>> {
  if (!AI_ENABLED.cleaning) {
    console.warn('[aiClient] AI cleaning disabled, returning original names');
    return ingredientNames.map(name => ({ name, category: 'pantry' }));
  }
  
  if (!requestUserConsentForAI()) {
    throw new Error('AI_CONSENT_REQUIRED');
  }
  
  try {
    const { model } = selectModel('cleaning');
    const prompt = `Clean and categorize these ingredient names. Return ONLY valid JSON.

Ingredients:
${ingredientNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

Return JSON array:
[
  {"name": "cleaned name", "category": "produce|dairy|meat|pantry|bakery|frozen|beverages"}
]

Rules:
- Remove quantities, units, processing details
- Convert plurals to singular
- Standardize names (e.g., "tomato" not "tomatos")
- Assign appropriate category`;

    const responseText = await callGemini(model, prompt);
    let cleaned = responseText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) cleaned = jsonMatch[0];
    
    const result = JSON.parse(cleaned);
    logAIUsage('cleanIngredients', prompt.length, responseText.length);
    
    return result;
  } catch (error) {
    console.error('[aiClient] Error cleaning ingredients:', error);
    return ingredientNames.map(name => ({ name, category: 'pantry' }));
  }
}

/**
 * Generate grocery list from ingredients
 */
export async function generateGroceryList(ingredients: string[]): Promise<string[]> {
  if (!AI_ENABLED.cleaning) {
    return ingredients;
  }
  
  // For now, delegate to cleanIngredientNames
  const cleaned = await cleanIngredientNames(ingredients);
  return cleaned.map(item => item.name);
}

/**
 * Extract and parse recipe from raw HTML content
 * This is currently a placeholder - actual extraction happens in Firebase Functions
 */
export async function parseRecipeFromHTML(html: string, url: string): Promise<Partial<Recipe>> {
  if (!AI_ENABLED.extraction) {
    throw new Error('AI_EXTRACTION_DISABLED');
  }
  
  console.warn('[aiClient] parseRecipeFromHTML should use backend Firebase Functions');
  throw new Error('NOT_IMPLEMENTED_USE_BACKEND');
}

// ========================================================
// EXPORTS
// ========================================================

export const aiClient = {
  extractRecipeFromUrl,
  extractRecipeFromScreenshot,
  cleanIngredientNames,
  generateGroceryList,
  parseRecipeFromHTML,
  
  // Configuration
  isEnabled: (feature: keyof typeof AI_ENABLED) => AI_ENABLED[feature],
  getModelConfig: () => MODEL_CONFIG,
};

export default aiClient;

