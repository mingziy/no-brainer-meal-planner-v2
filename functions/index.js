const {onCall} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize AI clients (using environment variables for v2)
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
  }
  return new OpenAI({ apiKey });
};

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
  }
  return new GoogleGenerativeAI(apiKey);
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = 1 - (distance / maxLength);
  return similarity;
}

/**
 * Check if recipe title matches search term
 * Uses both fuzzy matching and key word matching
 */
function isRecipeRelevant(searchTerm, recipeTitle) {
  const stopWords = ['and', 'with', 'for', 'the', 'a', 'an', 'or', 'in', 'on', 'to', 'of'];
  
  // Calculate fuzzy similarity
  const similarity = calculateSimilarity(searchTerm, recipeTitle);
  
  // Extract meaningful words from search term
  const searchWords = searchTerm.toLowerCase()
    .split(' ')
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  const titleLower = recipeTitle.toLowerCase();
  
  // Count how many search words appear in title
  const matchCount = searchWords.filter(word => titleLower.includes(word)).length;
  const matchPercent = searchWords.length > 0 ? matchCount / searchWords.length : 0;
  
  console.log(`  📊 Relevance check:`);
  console.log(`     Search: "${searchTerm}"`);
  console.log(`     Title:  "${recipeTitle}"`);
  console.log(`     Fuzzy similarity: ${Math.round(similarity * 100)}%`);
  console.log(`     Word matches: ${matchCount}/${searchWords.length} (${Math.round(matchPercent * 100)}%)`);
  
  // Recipe is relevant if:
  // - Fuzzy similarity > 40% OR
  // - At least 50% of key words match OR
  // - For simple queries (1-2 words), at least 1 word matches AND similarity > 25%
  const isRelevant = 
    similarity > 0.4 || 
    matchPercent >= 0.5 || 
    (searchWords.length <= 2 && matchCount >= 1 && similarity > 0.25);
  
  console.log(`     Result: ${isRelevant ? '✅ MATCH' : '❌ NO MATCH'}`);
  
  return isRelevant;
}

// ==================== CHATBOT FUNCTIONS ====================

/**
 * Stage 1: Brainstorm Recipe Ideas
 * Input: { query: string }
 * Output: { ideas: string[] }
 */
/**
 * Stage 1: Brainstorm Recipe Ideas with Natural Conversation Detection
 * Input: { query: string }
 * Output: { type: 'greeting' | 'off_topic' | 'recipes', ideas: string[] }
 */
exports.chatbotBrainstormIdeas = onCall({
  memory: '256MiB',
  timeoutSeconds: 60,
}, async (request) => {
  const { query } = request.data;
  
  console.log('[chatbotBrainstormIdeas] Query:', query);
  
  try {
    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly recipe assistant. Analyze the user's message:

1. If the message is about food, recipes, cooking, meals, or ingredients:
   - Return 4-6 specific recipe names that match their request
   - Format: One recipe name per line, no numbers or bullet points
   - Example output:
     Grilled Honey Lemon Chicken
     Baked Salmon with Dill
     Vegetarian Stir Fry

2. If the message is a greeting (hello, hi, hey, etc.):
   - Return exactly: "GREETING"

3. If the message is NOT about food/recipes (e.g., "how are you", "what's the weather", random topics):
   - Return exactly: "OFF_TOPIC"

Be strict: Only generate recipe ideas if the query is clearly food-related.`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    const rawContent = response.choices[0].message.content.trim();
    
    console.log('[chatbotBrainstormIdeas] AI response:', rawContent);
    
    // Check for special responses
    if (rawContent === 'GREETING') {
      return { type: 'greeting', ideas: [] };
    }
    
    if (rawContent === 'OFF_TOPIC') {
      return { type: 'off_topic', ideas: [] };
    }
    
    // Parse recipe ideas
    const ideas = rawContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[\d\-\.\)]\s*/, '').trim());
    
    console.log('[chatbotBrainstormIdeas] Generated ideas:', ideas);
    
    return { type: 'recipes', ideas };
  } catch (error) {
    console.error('[chatbotBrainstormIdeas] Error:', error);
    throw new Error(error.message || 'Failed to brainstorm ideas');
  }
});

/**
 * Stage 2: Fetch Recipe Previews with relevance checking
 * Input: { recipeNames: string[] }
 * Output: { recipes: RecipeCard[], failedRecipes: string[] }
 */
exports.chatbotFetchPreviews = onCall({
  memory: '512MiB',
  timeoutSeconds: 120,
}, async (request) => {
  const { recipeNames } = request.data;
    
    console.log('[chatbotFetchPreviews] Fetching previews for:', recipeNames);
    
    try {
      const recipes = [];
      const failedRecipes = [];
      
      // Process recipes in parallel for faster results
      // For each recipe name, potentially fetch multiple variations if using broader term
      const promises = recipeNames.map(async (recipeName) => {
        try {
          console.log(`[chatbotFetchPreviews] Starting search for: ${recipeName}`);
          const recipe = await searchAndScrapeRecipe(recipeName);
          if (recipe) {
            console.log(`[chatbotFetchPreviews] ✅ Found recipe for: ${recipeName}`);
            return { success: true, recipes: [recipe] };
          } else {
            // No matching recipe found
            console.log(`[chatbotFetchPreviews] ❌ No match for: ${recipeName}`);
            return { success: false, recipeName };
          }
        } catch (error) {
          console.error(`[chatbotFetchPreviews] Error fetching ${recipeName}:`, error.message);
          return { success: false, recipeName };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Separate successes from failures
      for (const result of results) {
        if (result.success) {
          recipes.push(...result.recipes);
        } else {
          failedRecipes.push(result.recipeName);
        }
      }
      
      console.log('[chatbotFetchPreviews] Successfully fetched', recipes.length, 'recipes');
      console.log('[chatbotFetchPreviews] Failed to match', failedRecipes.length, 'recipes:', failedRecipes);
      
      return { 
        recipes,
        failedRecipes // Return list of recipes that didn't match
      };
    } catch (error) {
      console.error('[chatbotFetchPreviews] Error:', error);
      throw new Error(error.message || 'Failed to fetch recipe previews');
    }
  });

/**
 * Helper: Extract broader search term by removing specific modifiers
 * Examples: 
 *   "Mashed Sweet Potato with Marshmallow" -> "Mashed Sweet Potato"
 *   "Grilled Chicken with Lemon Herb Sauce" -> "Grilled Chicken"
 *   "Chocolate Chip Cookies with Walnuts" -> "Chocolate Chip Cookies"
 */
function getBroaderSearchTerm(recipeName) {
  // Remove common modifiers after "with", "topped with", "and", "in", "on"
  const patterns = [
    / with .+$/i,
    / topped with .+$/i,
    / and .+$/i,
    / in .+$/i,
    / on .+$/i,
    / \(.+\)$/,  // Remove anything in parentheses
  ];
  
  let broader = recipeName;
  for (const pattern of patterns) {
    broader = broader.replace(pattern, '');
  }
  
  return broader.trim();
}

/**
 * Helper: Search and scrape a single recipe with relevance checking
 * Now supports 7 recipe websites with randomized order
 * Includes fallback to broader search term if specific search fails
 */
async function searchAndScrapeRecipe(recipeName) {
  console.log(`[searchAndScrapeRecipe] Searching for: ${recipeName}`);
  
  // Define all recipe websites with their search patterns
  const websites = [
    {
      name: 'Allrecipes',
      searchUrl: (query) => `https://www.allrecipes.com/search?q=${encodeURIComponent(query)}`,
      linkSelector: 'a[href*="/recipe/"]',
      domain: 'allrecipes.com'
    },
    {
      name: 'The Kitchn',
      searchUrl: (query) => `https://www.thekitchn.com/search?q=${encodeURIComponent(query)}`,
      linkSelector: 'a[href*="/recipe/"]',
      domain: 'thekitchn.com'
    },
    {
      name: 'Simply Recipes',
      searchUrl: (query) => `https://www.simplyrecipes.com/?s=${encodeURIComponent(query)}`,
      linkSelector: 'a[href*="/recipes/"]',
      domain: 'simplyrecipes.com'
    }
  ];
  
  // Randomize the order of websites for variety
  const shuffled = [...websites].sort(() => Math.random() - 0.5);
  
  // Try all 3 websites until we find a match
  for (const site of shuffled) {
    try {
      console.log(`[searchAndScrapeRecipe] Trying ${site.name}...`);
      const searchUrl = site.searchUrl(recipeName);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000 // Reduced timeout for faster failure
      });
      
      const $ = cheerio.load(response.data);
      
      // Get top 3 recipe links to check (reduced from 5 for speed)
      const recipeLinks = $(site.linkSelector).slice(0, 3);
      console.log(`[searchAndScrapeRecipe] Found ${recipeLinks.length} recipe links on ${site.name}`);
      
      if (recipeLinks.length === 0) {
        console.log(`[searchAndScrapeRecipe] No results on ${site.name}, trying next site...`);
        continue;
      }
      
      // Try each result until we find a match
      for (let i = 0; i < recipeLinks.length; i++) {
        const link = recipeLinks.eq(i);
        const url = link.attr('href');
        const fullUrl = url.startsWith('http') ? url : `https://www.${site.domain}${url}`;
        
        try {
          // Scrape this recipe page
          const recipeResponse = await axios.get(fullUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 8000 // Reduced timeout
          });
          
          const $recipe = cheerio.load(recipeResponse.data);
          
          // Extract recipe title
          const title = $recipe('meta[property="og:title"]').attr('content') || 
                       $recipe('h1').first().text().trim() ||
                       '';
          
          if (!title) {
            continue;
          }
          
          // Check if this recipe matches the search term
          if (isRecipeRelevant(recipeName, title)) {
            // ✅ Found a match!
            console.log(`✅ MATCH FOUND on ${site.name}: "${title}"`);
            
            const image = $recipe('meta[property="og:image"]').attr('content') || '';
            const description = $recipe('meta[property="og:description"]').attr('content') || 
                               $recipe('meta[name="description"]').attr('content') || '';
            
            return {
              title,
              image,
              description,
              url: fullUrl,
              siteName: site.name
            };
          }
        } catch (err) {
          console.error(`  ⚠️ Error scraping result on ${site.name}:`, err.message);
          continue;
        }
      }
      
      console.log(`[searchAndScrapeRecipe] No match found on ${site.name}, trying next site...`);
      
    } catch (error) {
      console.error(`[searchAndScrapeRecipe] ${site.name} search failed:`, error.message);
      continue; // Try next site
    }
  }
  
  // ❌ No good match found with specific search term
  console.log(`❌ NO MATCHING RECIPE FOUND for "${recipeName}" on any site`);
  
  // 🔄 FALLBACK: Try broader search term
  const broaderTerm = getBroaderSearchTerm(recipeName);
  
  // Only retry if broader term is different from original
  if (broaderTerm !== recipeName && broaderTerm.length > 0) {
    console.log(`🔄 FALLBACK: Trying broader search term: "${broaderTerm}"`);
    
    // Try again with broader term (limit to first 2 sites for speed)
    const fallbackSites = shuffled.slice(0, 2);
    
    for (const site of fallbackSites) {
      try {
        console.log(`[searchAndScrapeRecipe] Fallback search on ${site.name}...`);
        const searchUrl = site.searchUrl(broaderTerm);
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000
        });
        
        const $ = cheerio.load(response.data);
        
        // Get top 3 recipe links
        const recipeLinks = $(site.linkSelector).slice(0, 3);
        
        if (recipeLinks.length === 0) {
          continue;
        }
        
        // Try each result
        for (let i = 0; i < recipeLinks.length; i++) {
          const link = recipeLinks.eq(i);
          const url = link.attr('href');
          const fullUrl = url.startsWith('http') ? url : `https://www.${site.domain}${url}`;
          
          try {
            const recipeResponse = await axios.get(fullUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              timeout: 8000
            });
            
            const $recipe = cheerio.load(recipeResponse.data);
            
            const title = $recipe('meta[property="og:title"]').attr('content') || 
                         $recipe('h1').first().text().trim() ||
                         '';
            
            if (!title) {
              continue;
            }
            
            // For fallback, use looser matching - just check if broader term is in title
            if (isRecipeRelevant(broaderTerm, title)) {
              console.log(`✅ FALLBACK SUCCESS on ${site.name}: "${title}"`);
              
              const image = $recipe('meta[property="og:image"]').attr('content') || '';
              const description = $recipe('meta[property="og:description"]').attr('content') || 
                                 $recipe('meta[name="description"]').attr('content') || '';
              
              return {
                title,
                image,
                description,
                url: fullUrl,
                siteName: site.name
              };
            }
          } catch (err) {
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log(`❌ FALLBACK FAILED: No match for broader term "${broaderTerm}"`);
  }
  
  return null;
}

/**
 * Stage 3: Scrape Only (No AI)
 * Input: { url: string }
 * Output: { ScrapedData }
 */
exports.chatbotScrapeOnly = onCall({
  memory: '512MiB',
  timeoutSeconds: 60,
}, async (request) => {
  const { url } = request.data;
    
    console.log('[chatbotScrapeOnly] Scraping URL:', url);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract basic info
      const title = $('meta[property="og:title"]').attr('content') || 
                   $('h1').first().text().trim() ||
                   'Untitled Recipe';
      const image = $('meta[property="og:image"]').attr('content') || '';
      const description = $('meta[property="og:description"]').attr('content') || '';
      const siteName = $('meta[property="og:site_name"]').attr('content') || 
                      new URL(url).hostname.replace('www.', '');
      
      // Initialize variables
      let ingredients = [];
      let instructions = [];
      let nutrition = {};
      let prepTime = '';
      let cookTime = '';
      let totalTime = '';
      let servings = '';
      
      // ========== STEP 1: Try JSON-LD Recipe Schema ==========
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          const recipe = Array.isArray(json) ? json.find(item => item['@type'] === 'Recipe') : 
                        json['@type'] === 'Recipe' ? json : null;
          
          if (recipe) {
            console.log('[chatbotScrapeOnly] Found JSON-LD Recipe schema');
            console.log('[chatbotScrapeOnly] Raw JSON-LD times:', {
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              totalTime: recipe.totalTime,
              yield: recipe.recipeYield,
              hasNutrition: !!recipe.nutrition
            });
            
            // Extract ingredients
            ingredients = recipe.recipeIngredient || [];
            
            // Extract instructions
            if (recipe.recipeInstructions) {
              instructions = recipe.recipeInstructions.map(step => {
                if (typeof step === 'string') return step;
                if (step.text) return step.text;
                if (step.name) return step.name;
                if (step['@type'] === 'HowToStep') return step.text || step.name || '';
                return '';
              }).filter(s => s.length > 0);
            }
            
            // Extract times - handle ISO 8601 duration format
            prepTime = recipe.prepTime || '';
            cookTime = recipe.cookTime || '';
            totalTime = recipe.totalTime || '';
            
            // Convert ISO 8601 duration to readable format
            prepTime = convertDuration(prepTime);
            cookTime = convertDuration(cookTime);
            totalTime = convertDuration(totalTime);
            
            // Extract servings
            servings = recipe.recipeYield || recipe.yield || '';
            if (Array.isArray(servings)) servings = servings[0];
            servings = String(servings).replace(/servings?/i, '').trim();
            
            // Extract nutrition
            if (recipe.nutrition) {
              nutrition = {
                calories: extractNumber(recipe.nutrition.calories),
                protein: extractNumber(recipe.nutrition.proteinContent),
                carbs: extractNumber(recipe.nutrition.carbohydrateContent),
                fat: extractNumber(recipe.nutrition.fatContent),
                fiber: extractNumber(recipe.nutrition.fiberContent),
                sugar: extractNumber(recipe.nutrition.sugarContent),
                sodium: extractNumber(recipe.nutrition.sodiumContent)
              };
            }
          }
        } catch (e) {
          console.error('[chatbotScrapeOnly] JSON-LD parse error:', e.message);
        }
      });
      
      // ========== STEP 2: Try microdata/itemprop attributes ==========
      if (ingredients.length === 0) {
        $('[itemprop="recipeIngredient"]').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text && text.length > 2) {
            ingredients.push(text);
          }
        });
      }
      
      if (instructions.length === 0) {
        $('[itemprop="recipeInstructions"]').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text && text.length > 10) {
            instructions.push(text);
          }
        });
      }
      
      // Extract time from itemprop
      if (!prepTime) {
        prepTime = $('[itemprop="prepTime"]').attr('content') || $('[itemprop="prepTime"]').text().trim();
        prepTime = convertDuration(prepTime);
      }
      if (!cookTime) {
        cookTime = $('[itemprop="cookTime"]').attr('content') || $('[itemprop="cookTime"]').text().trim();
        cookTime = convertDuration(cookTime);
      }
      if (!totalTime) {
        totalTime = $('[itemprop="totalTime"]').attr('content') || $('[itemprop="totalTime"]').text().trim();
        totalTime = convertDuration(totalTime);
      }
      
      // Extract servings from itemprop
      if (!servings) {
        servings = $('[itemprop="recipeYield"]').text().trim() || $('[itemprop="yield"]').text().trim();
        servings = String(servings).replace(/servings?/i, '').trim();
      }
      
      // ========== STEP 3: Manual DOM extraction with common patterns ==========
      
      // Ingredients - try common class/id patterns
      if (ingredients.length === 0) {
        const selectors = [
          'li.ingredient',
          '.ingredients li',
          '[class*="ingredient"] li',
          '[class*="Ingredient"] li',
          '.recipe-ingredients li',
          '#ingredients li',
          '[data-ingredient]'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 2 && !text.match(/ingredients/i)) {
              ingredients.push(text);
            }
          });
          if (ingredients.length > 0) break;
        }
      }
      
      // Instructions - try common patterns
      if (instructions.length === 0) {
        const selectors = [
          'li.instruction',
          '.instructions li',
          '[class*="instruction"] li',
          '[class*="Instruction"] li',
          '.recipe-steps li',
          '[class*="step"] li',
          '[class*="Step"] li',
          '[class*="direction"] li',
          '[class*="Direction"] li',
          '#instructions li',
          '.directions li'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 10 && !text.match(/instructions|directions/i)) {
              instructions.push(text);
            }
          });
          if (instructions.length > 0) break;
        }
      }
      
      // Times - try common patterns
      if (!prepTime || !cookTime || !totalTime) {
        const timePatterns = [
          { selector: '[class*="prep-time"], [class*="prepTime"], [id*="prep"]', type: 'prep' },
          { selector: '[class*="cook-time"], [class*="cookTime"], [id*="cook"]', type: 'cook' },
          { selector: '[class*="total-time"], [class*="totalTime"], [id*="total"]', type: 'total' }
        ];
        
        for (const pattern of timePatterns) {
          const elem = $(pattern.selector).first();
          if (elem.length) {
            const text = elem.text().trim();
            const converted = convertDuration(text) || text;
            if (pattern.type === 'prep' && !prepTime) prepTime = converted;
            if (pattern.type === 'cook' && !cookTime) cookTime = converted;
            if (pattern.type === 'total' && !totalTime) totalTime = converted;
          }
        }
      }
      
      // Servings - try common patterns
      if (!servings) {
        const servingSelectors = [
          '[class*="serving"]',
          '[class*="yield"]',
          '[id*="serving"]',
          '[id*="yield"]'
        ];
        
        for (const selector of servingSelectors) {
          const elem = $(selector).first();
          if (elem.length) {
            const text = elem.text().trim();
            const match = text.match(/(\d+)\s*(servings?|yields?|people|portions?)?/i);
            if (match) {
              servings = match[1];
              break;
            }
          }
        }
      }
      
      // Nutrition - try common patterns
      if (!nutrition.calories) {
        const nutritionSelectors = [
          '.nutrition-info',
          '[class*="nutrition"]',
          '[class*="Nutrition"]',
          '#nutrition'
        ];
        
        for (const selector of nutritionSelectors) {
          const elem = $(selector).first();
          if (elem.length) {
            const text = elem.text();
            
            // Extract calories
            const calMatch = text.match(/calories?[:\s]+(\d+)/i);
            if (calMatch) nutrition.calories = parseInt(calMatch[1]);
            
            // Extract protein
            const proteinMatch = text.match(/protein[:\s]+(\d+)\s*g/i);
            if (proteinMatch) nutrition.protein = parseInt(proteinMatch[1]);
            
            // Extract carbs
            const carbsMatch = text.match(/carb(?:ohydrate)?s?[:\s]+(\d+)\s*g/i);
            if (carbsMatch) nutrition.carbs = parseInt(carbsMatch[1]);
            
            // Extract fat
            const fatMatch = text.match(/fat[:\s]+(\d+)\s*g/i);
            if (fatMatch) nutrition.fat = parseInt(fatMatch[1]);
            
            // Extract fiber
            const fiberMatch = text.match(/fiber[:\s]+(\d+)\s*g/i);
            if (fiberMatch) nutrition.fiber = parseInt(fiberMatch[1]);
            
            if (nutrition.calories) break;
          }
        }
      }
      
      // ========== STEP 4: TEXT-BASED REGEX FALLBACKS (for Allrecipes and similar sites) ==========
      console.log('[chatbotScrapeOnly] Tier 3 results - checking if fallbacks needed:', {
        prepTime: !!prepTime,
        cookTime: !!cookTime,
        totalTime: !!totalTime,
        servings: !!servings,
        hasNutrition: !!nutrition.calories
      });
      
      const bodyText = $('body').text();
      
      // Extract times by searching for "Prep Time: XX mins" pattern
      if (!prepTime) {
        const prepMatch = bodyText.match(/Prep\s+Time:\s*(\d+\s*(?:hrs?|mins?|hours?|minutes?))/i);
        if (prepMatch) {
          prepTime = convertDuration(prepMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted prepTime from text:', prepTime);
        }
      }
      
      if (!cookTime) {
        const cookMatch = bodyText.match(/Cook\s+Time:\s*(\d+\s*(?:hrs?|mins?|hours?|minutes?))/i);
        if (cookMatch) {
          cookTime = convertDuration(cookMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted cookTime from text:', cookTime);
        }
      }
      
      if (!totalTime) {
        const totalMatch = bodyText.match(/Total\s+Time:\s*(\d+\s*(?:hrs?|mins?|hours?|minutes?))/i);
        if (totalMatch) {
          totalTime = convertDuration(totalMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted totalTime from text:', totalTime);
        }
      }
      
      // Extract servings by searching for "Servings: X" or "Yield: X servings"
      if (!servings) {
        const servingsMatch = bodyText.match(/(?:Servings?|Yields?):\s*(\d+)/i);
        if (servingsMatch) {
          servings = servingsMatch[1];
          console.log('[chatbotScrapeOnly] ✅ Extracted servings from text:', servings);
        }
      }
      
      // Extract nutrition by searching for "XXX Calories", "XXg Protein", etc.
      if (!nutrition.calories) {
        const calMatch = bodyText.match(/(\d+)\s*Calories/i);
        if (calMatch) {
          nutrition.calories = parseInt(calMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted calories from text:', nutrition.calories);
        }
      }
      
      if (!nutrition.protein) {
        const proteinMatch = bodyText.match(/(\d+)\s*g\s*Protein/i);
        if (proteinMatch) {
          nutrition.protein = parseInt(proteinMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted protein from text:', nutrition.protein);
        }
      }
      
      if (!nutrition.carbs) {
        const carbsMatch = bodyText.match(/(\d+)\s*g\s*Carbs?/i);
        if (carbsMatch) {
          nutrition.carbs = parseInt(carbsMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted carbs from text:', nutrition.carbs);
        }
      }
      
      if (!nutrition.fat) {
        const fatMatch = bodyText.match(/(\d+)\s*g\s*Fat/i);
        if (fatMatch) {
          nutrition.fat = parseInt(fatMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted fat from text:', nutrition.fat);
        }
      }
      
      // Try to get more detailed nutrition from "Total Fat17g" format (Allrecipes specific)
      if (!nutrition.fat) {
        const totalFatMatch = bodyText.match(/Total\s+Fat\s*(\d+)\s*g/i);
        if (totalFatMatch) {
          nutrition.fat = parseInt(totalFatMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted total fat from detailed table:', nutrition.fat);
        }
      }
      
      if (!nutrition.carbs) {
        const totalCarbsMatch = bodyText.match(/Total\s+Carbohydrate\s*(\d+)\s*g/i);
        if (totalCarbsMatch) {
          nutrition.carbs = parseInt(totalCarbsMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted total carbs from detailed table:', nutrition.carbs);
        }
      }
      
      // Extract fiber if available
      if (!nutrition.fiber) {
        const fiberMatch = bodyText.match(/(?:Dietary\s+)?Fiber\s*(\d+)\s*g/i);
        if (fiberMatch) {
          nutrition.fiber = parseInt(fiberMatch[1]);
          console.log('[chatbotScrapeOnly] ✅ Extracted fiber from text:', nutrition.fiber);
        }
      }
      
      console.log('[chatbotScrapeOnly] Extraction summary:', {
        title,
        ingredientsCount: ingredients.length,
        instructionsCount: instructions.length,
        prepTime,
        cookTime,
        totalTime,
        servings,
        hasNutrition: !!nutrition.calories
      });
      
      return {
        url,
        title,
        image,
        description,
        ingredients,
        instructions,
        nutrition,
        prepTime,
        cookTime,
        totalTime,
        servings,
        siteName
      };
    } catch (error) {
      console.error('[chatbotScrapeOnly] Error:', error);
      throw new Error(error.message || 'Internal error');
    }
  });

// Helper function to convert ISO 8601 duration to readable format
function convertDuration(duration) {
  if (!duration) return '';
  
  // If already in readable format, return as-is
  if (duration.match(/^\d+\s*(min|hour|hr)/i)) return duration;
  
  // Parse ISO 8601 duration (e.g., "PT15M", "PT1H30M")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    
    if (hours && minutes) return `${hours} hr ${minutes} min`;
    if (hours) return `${hours} hr`;
    if (minutes) return `${minutes} min`;
  }
  
  // Try to extract numbers and units
  const numMatch = duration.match(/(\d+)\s*(h|hr|hour|m|min|minute)/i);
  if (numMatch) {
    const num = numMatch[1];
    const unit = numMatch[2].toLowerCase();
    if (unit.startsWith('h')) return `${num} hr`;
    if (unit.startsWith('m')) return `${num} min`;
  }
  
  return duration;
}

// Helper function to extract number from string
function extractNumber(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const match = String(value).match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Stage 4: Clean and Save Recipe (Always uses AI)
 * Input: { scrapedData: ScrapedData }
 * Output: { recipe: CleanedRecipe }
 */
exports.chatbotCleanAndSave = onCall({
  memory: '1GiB',
  timeoutSeconds: 120,
}, async (request) => {
  const { scrapedData } = request.data;
    
    console.log('[chatbotCleanAndSave] Processing recipe:', scrapedData.title);
    
    try {
      const openai = getOpenAI();
      
      // Prepare comprehensive prompt for AI
      const prompt = `You are an expert recipe interpreter and data formatter. Analyze the following scraped recipe data and convert it into a perfectly structured format for a recipe app.

**SCRAPED DATA:**

Recipe Title: ${scrapedData.title}
Recipe URL: ${scrapedData.url}
Source Website: ${scrapedData.siteName}
Description: ${scrapedData.description}
Image URL: ${scrapedData.image}

**RAW INGREDIENTS (${scrapedData.ingredients?.length || 0} items):**
${scrapedData.ingredients?.map((ing, i) => `${i + 1}. ${ing}`).join('\n') || 'No ingredients found'}

**RAW INSTRUCTIONS (${scrapedData.instructions?.length || 0} steps):**
${scrapedData.instructions?.map((inst, i) => `${i + 1}. ${inst}`).join('\n') || 'No instructions found'}

**TIMING INFO (may be empty):**
- Prep Time: ${scrapedData.prepTime || 'NOT PROVIDED - MUST ESTIMATE'}
- Cook Time: ${scrapedData.cookTime || 'NOT PROVIDED - MUST ESTIMATE'}
- Total Time: ${scrapedData.totalTime || 'NOT PROVIDED - MUST ESTIMATE'}
- Servings: ${scrapedData.servings || 'NOT PROVIDED - MUST ESTIMATE'}

**NUTRITION (may be empty):**
${JSON.stringify(scrapedData.nutrition, null, 2) || 'NOT PROVIDED - MUST ESTIMATE'}

---

**YOUR CRITICAL TASK:**

⚠️ **IMPORTANT:** The scraped data is often INCOMPLETE. You MUST estimate missing values intelligently!

**1. ESTIMATE TIMES (if not provided):**
   - Analyze the ingredients and instructions to estimate realistic times
   - Prep Time: Time to gather and prepare ingredients (washing, chopping, measuring)
     - Simple recipes: 10-15 min
     - Medium complexity: 15-30 min
     - Complex: 30-60 min
   - Cook Time: Time for actual cooking (baking, sautéing, simmering)
     - Look for cooking instructions: "bake for 30 minutes", "simmer for 20 minutes"
     - If unclear, estimate based on recipe type
   - Total Time: Prep + Cook time
   - Format: "15 min", "1 hr", "45 min", "1 hr 30 min"

**2. ESTIMATE SERVINGS (if not provided):**
   - Look at ingredient quantities to estimate
   - Default ranges:
     - Main dishes: 4-6 servings
     - Desserts/baked goods: 8-12 servings
     - Appetizers: 6-8 servings
     - Large batch (soup/stew): 6-8 servings
   - Return a single number (e.g., 4, not "4-6")

**3. CALCULATE NUTRITION PER SERVING:**
   - **MUST provide calories per serving** (this is critical!)
   - If nutrition data exists in scraped data, use it and divide by servings
   - If NO nutrition data, estimate based on ingredients:
     
     **Estimation Guidelines:**
     - Identify main ingredients and their typical calories
     - Common ingredients:
       * 1 cup flour ≈ 400 cal
       * 1 cup sugar ≈ 770 cal
       * 1 egg ≈ 70 cal
       * 1 tbsp butter ≈ 100 cal
       * 1 lb chicken breast ≈ 500 cal
       * 1 lb beef ≈ 1000-1200 cal
       * 1 cup rice (cooked) ≈ 200 cal
       * 1 tbsp oil ≈ 120 cal
     
     - Add up approximate calories for all ingredients
     - Divide by number of servings
     - Round to nearest 10
     
     - Also estimate:
       * Protein: 0-50g per serving (meat-heavy = higher)
       * Carbs: 20-60g per serving (pasta/rice = higher)
       * Fat: 5-30g per serving (fried/creamy = higher)
       * Fiber: 2-10g per serving (whole grains/veggies = higher)
   
   - **ALL nutrition values MUST be numbers**, never 0 unless it's truly zero

**4. PARSE INGREDIENTS:**
   - Break down each ingredient into:
     * \`amount\`: quantity (e.g., "2", "1/2", "1.5") - use "" if no amount
     * \`unit\`: measurement (e.g., "cups", "tbsp", "tsp", "oz", "g", "lb", "whole") - use "" if no unit
     * \`name\`: ingredient name (e.g., "flour", "chicken breast", "salt")
     * \`category\`: "protein", "vegetables", "grains", "dairy", "fruits", "spices", "condiments", "other"
     * \`id\`: unique string ID ("1", "2", "3"...)

**5. CLEAN INSTRUCTIONS:**
   - Convert to clear, numbered steps
   - Remove HTML, ads, irrelevant text
   - Each step = complete sentence
   - Return as array of strings (plain text)

**6. DETECT CUISINE & TAGS:**
   - Cuisine: Italian, Chinese, Mexican, American, Indian, Japanese, Mediterranean, Thai, French, Other
   - Protein Type: Poultry, Beef, Pork, Fish, Seafood, Tofu, Beans, Eggs, None
     * Use "Poultry" for chicken, turkey, duck, quail, and other fowl
   - Meal Type: Breakfast, Lunch, Dinner, Snack, Dessert
   - Category: Breakfast, Lunch, Dinner, Snack, Dessert, Appetizer
   - Tags: 2-3 relevant tags (easy, quick, healthy, family-friendly, vegetarian, low-carb, etc.)

---

**RETURN THIS EXACT JSON STRUCTURE:**

{
  "name": "Recipe Title",
  "image": "${scrapedData.image || ''}",
  "extractedImages": ["${scrapedData.image || ''}"],
  "ingredients": [
    {
      "id": "1",
      "amount": "2",
      "unit": "cups",
      "name": "all-purpose flour",
      "category": "grains"
    }
  ],
  "instructions": [
    "Preheat oven to 350°F and grease a baking pan.",
    "Mix flour and sugar in a large bowl."
  ],
  "servings": 4,
  "caloriesPerServing": 350,
  "nutrition": {
    "calories": 350,
    "protein": 12,
    "carbs": 45,
    "fat": 8,
    "fiber": 3
  },
  "prepTime": "15 min",
  "cookTime": "30 min",
  "totalTime": "45 min",
  "cuisine": "Italian",
  "cuisines": ["Italian"],
  "proteinType": "Poultry",
  "proteinTypes": ["Poultry"],
  "mealType": "Dinner",
  "mealTypes": ["Dinner"],
  "category": "Dinner",
  "categories": ["Dinner"],
  "tags": ["easy", "family-friendly", "healthy"],
  "sourceUrl": "${scrapedData.url}",
  "nutritionCalculationReasoning": "Estimated calories based on ingredient analysis: chicken breast (~300 cal), rice (~200 cal), vegetables (~50 cal), oil (~150 cal) = ~700 cal total, divided by 4 servings = 175 cal per serving. Times estimated based on recipe complexity and cooking methods."
}

**CRITICAL REQUIREMENTS:**
- ✅ ALWAYS provide estimated values if scraped data is missing
- ✅ \`servings\` MUST be a number (e.g., 4, not "4 servings")
- ✅ \`caloriesPerServing\` MUST be a number greater than 0
- ✅ \`nutrition.calories\` MUST equal \`caloriesPerServing\`
- ✅ All nutrition values MUST be numbers (never 0 unless truly zero)
- ✅ \`instructions\` MUST be array of strings (NOT objects) WITHOUT "Step 1:", "Step 2:" prefixes - the app adds numbering automatically
- ✅ \`ingredients\` MUST have id, amount, unit, name, category
- ✅ Times MUST be in format "XX min" or "X hr" or "X hr XX min"
- ✅ Include \`extractedImages\` array
- ✅ \`nutritionCalculationReasoning\` should explain your estimates
- ✅ Return ONLY valid JSON, no markdown, no explanations

**REMEMBER:** It's better to provide a reasonable estimate than to return 0 or empty values!`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a recipe data interpreter. Parse scraped recipe data and return ONLY valid JSON with perfect structure. No markdown, no explanations, just JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3000
      });
      
      let recipeData = response.choices[0].message.content.trim();
      
      console.log('[chatbotCleanAndSave] Raw AI response:', recipeData.substring(0, 200));
      
      // Remove markdown code blocks if present
      recipeData = recipeData.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const recipe = JSON.parse(recipeData);
      
      console.log('[chatbotCleanAndSave] AI processed recipe:', {
        name: recipe.name,
        ingredientsCount: recipe.ingredients?.length,
        instructionsCount: recipe.instructions?.length,
        servings: recipe.servings,
        caloriesPerServing: recipe.caloriesPerServing,
        hasImage: !!recipe.image
      });
      
      return { recipe };
    } catch (error) {
      console.error('[chatbotCleanAndSave] Error:', error);
      throw new Error(error.message || 'Internal error');
    }
  });

/**
 * Get Another Recipe
 * Input: { recipeName: string }
 * Output: { recipe: RecipeCard }
 */
exports.chatbotGetAnotherRecipe = onCall({
  memory: '512MiB',
  timeoutSeconds: 60,
}, async (request) => {
  const { recipeName } = request.data;
    
    console.log('[chatbotGetAnotherRecipe] Getting alternative for:', recipeName);
    
    try {
      const recipe = await searchAndScrapeRecipe(recipeName);
      
      return { recipe };
    } catch (error) {
      console.error('[chatbotGetAnotherRecipe] Error:', error);
      throw new Error(error.message || 'Internal error');
    }
  });

// ==================== OTHER AI FUNCTIONS ====================

/**
 * AI Recipe Chat (legacy function)
 */
exports.aiRecipeChat = onCall({
  memory: '512MiB',
  timeoutSeconds: 60,
}, async (request) => {
  const { message } = request.data;
    
    console.log('[aiRecipeChat] Message:', message);
    
    try {
      const openai = getOpenAI();
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful cooking assistant. Provide recipe suggestions and cooking advice.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      return { reply: response.choices[0].message.content };
    } catch (error) {
      console.error('[aiRecipeChat] Error:', error);
      throw new Error(error.message || 'Internal error');
    }
  });

console.log('✅ Firebase Cloud Functions loaded successfully');

