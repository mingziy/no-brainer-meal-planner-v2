// Formal JSON schemas for AI responses

export interface RecipeExtractionResponse {
  success: boolean;
  recipe: {
    name: string;
    image: string;
    ingredients: Array<{
      amount: string;
      unit: string;
      name: string;
    }>;
    instructions: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    prepTime: number;
    cookTime: number;
    totalTime: number;
    servings: number;
    cuisine: string;
    category: string;
    tags: string[];
  };
  error?: string;
}

export interface BrainstormResponse {
  type: 'greeting' | 'off_topic' | 'recipes';
  ideas: string[];
  error?: string;
}

export interface RecipePreview {
  title: string;
  image: string;
  description: string;
  url: string;
  siteName: string;
}

export interface ScrapedRecipeData {
  url: string;
  title: string;
  image: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutrition: any;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  siteName: string;
}

// Validation helpers
export function validateRecipeResponse(data: any): RecipeExtractionResponse {
  // TODO: Add zod validation
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid recipe response: not an object');
  }
  
  if (!data.recipe || typeof data.recipe !== 'object') {
    throw new Error('Invalid recipe response: missing recipe object');
  }
  
  return data as RecipeExtractionResponse;
}

export function validateBrainstormResponse(data: any): BrainstormResponse {
  // TODO: Add zod validation
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid brainstorm response: not an object');
  }
  
  if (!Array.isArray(data.ideas)) {
    throw new Error('Invalid brainstorm response: ideas must be an array');
  }
  
  return data as BrainstormResponse;
}

