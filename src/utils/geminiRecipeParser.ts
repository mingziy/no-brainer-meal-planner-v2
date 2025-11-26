/**
 * ========================================
 * GEMINI RECIPE PARSER - LEGACY WRAPPER
 * ========================================
 * 
 * This file now acts as a wrapper/compatibility layer.
 * All actual AI logic has been moved to src/services/aiClient.ts
 * 
 * This file will be removed in Phase 8 (Remove Unused Code).
 * For now, it re-exports functions from aiClient for backward compatibility.
 */

import {
  cleanIngredientNames as aiCleanIngredients,
  parseRecipeFromText as aiParseText,
  parseRecipeFromImage as aiParseImage,
  generateRecipeIdeas as aiGenerateIdeas,
  searchRecipeUrl as aiSearchUrl,
} from '../services/aiClient';

/**
 * @deprecated Use aiClient.cleanIngredientNames() instead
 */
export const cleanIngredientNames = aiCleanIngredients;

/**
 * @deprecated Use aiClient.parseRecipeFromText() instead
 */
export const parseRecipeWithGemini = aiParseText;

/**
 * @deprecated Use aiClient.parseRecipeFromImage() instead
 */
export const parseRecipeFromImage = aiParseImage;

/**
 * @deprecated Use aiClient.generateRecipeIdeas() instead
 */
export const generateRecipeIdeas = aiGenerateIdeas;

/**
 * @deprecated Use aiClient.searchRecipeUrl() instead
 */
export const searchRecipeUrl = aiSearchUrl;
