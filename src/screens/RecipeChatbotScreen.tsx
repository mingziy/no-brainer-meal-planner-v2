import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, CheckSquare, Square, ExternalLink, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';

// Types
type ChatbotState = 'idle' | 'brainstorming' | 'selecting' | 'searching' | 'showing_options' | 'extracting';

interface RecipeIdea {
  name: string;
  selected: boolean;
}

interface RecipeCard {
  title: string;
  image: string;
  description: string;
  url: string;
  siteName: string;
}

interface ScrapedData {
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

interface Message {
  role: 'user' | 'bot';
  content: string;
  ideas?: RecipeIdea[];
}

export function RecipeChatbotScreen() {
  const { setDraftRecipe, setIsRecipeEditFormOpen } = useApp();
  const [state, setState] = useState<ChatbotState>('idle');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: 'Hi! I\'m your recipe assistant. Tell me what you\'d like to cook, and I\'ll help you find great recipes! 🍳',
    },
  ]);
  const [input, setInput] = useState('');
  const [ideas, setIdeas] = useState<RecipeIdea[]>([]);
  const [recipeCards, setRecipeCards] = useState<RecipeCard[]>([]);
  const [currentSearchTerms, setCurrentSearchTerms] = useState<string[]>([]); // Track current search terms for refresh
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [showScrapedModal, setShowScrapedModal] = useState(false);
  const [aiProcessedRecipe, setAiProcessedRecipe] = useState<any>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRecipeContext, setLastRecipeContext] = useState<string>(''); // Track what user last asked for
  const aiProcessedRecipeRef = useRef<any>(null); // Use ref for polling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recipeCards]);

  // Helper: Get a random greeting response
  const getGreetingResponse = () => {
    const greetings = [
      "Hello! 👋 I'd love to help you find some delicious recipes. What are you in the mood for today?",
      "Hi there! 😊 Ready to discover some amazing dishes? Tell me what you're craving!",
      "Hey! 🍳 I'm here to help you cook something wonderful. What type of food interests you?",
      "Hello! 🌟 Let's find you the perfect recipe. Any preferences or dietary needs?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Helper: Get a random off-topic redirect
  const getOffTopicResponse = () => {
    const redirects = [
      "I specialize in recipes! 🍽️ Tell me what you'd like to cook and I'll find you some great options.",
      "Let's talk food! 🥘 What kind of dish are you interested in making?",
      "I'm your recipe assistant! 👨‍🍳 Share what you're craving and I'll suggest some recipes.",
      "I'm best at helping with cooking! 🍕 What type of meal are you looking to prepare?",
      "My expertise is recipes! 🥗 Tell me about your favorite ingredients or cuisines.",
    ];
    return redirects[Math.floor(Math.random() * redirects.length)];
  };

  // Helper: Check if user wants more of the same vs new search
  const isRequestingMoreIdeas = (userMessage: string) => {
    const morePatterns = [
      /\b(more|another|other|different|else)\b.*\b(idea|option|recipe|suggestion)\b/i,
      /\bshow me (more|another|other|different)\b/i,
      /\b(any|got) (more|other|else)\b/i,
      /\bwhat else\b/i,
      /\bgive me (more|another)\b/i,
    ];
    return morePatterns.some(pattern => pattern.test(userMessage));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    
    // Add user message to state FIRST, then clear input
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    
    // Clear input AFTER adding to messages
    setInput('');
    setLoading(true);
    setState('brainstorming');

    try {
      // Check if user wants more of the same
      const wantsMoreIdeas = isRequestingMoreIdeas(userMessage) && lastRecipeContext;
      const queryToSend = wantsMoreIdeas ? lastRecipeContext : userMessage;

      // Call brainstorm function
      const brainstorm = httpsCallable(functions, 'chatbotBrainstormIdeas');
      const result: any = await brainstorm({ query: queryToSend });
      const responseType = result.data.type || 'recipes';
      const recipeNames = result.data.ideas || [];

      console.log('[RecipeChatbot] Response type:', responseType, 'Ideas:', recipeNames, 'WantsMore:', wantsMoreIdeas);

      // Handle different response types
      if (responseType === 'greeting') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            content: getGreetingResponse(),
          },
        ]);
        setState('idle');
        setLoading(false);
        return;
      }

      if (responseType === 'off_topic') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            content: getOffTopicResponse(),
          },
        ]);
        setState('idle');
        setLoading(false);
        return;
      }

      // Handle recipe ideas
      if (responseType === 'recipes' && recipeNames.length > 0) {
        const ideaObjects: RecipeIdea[] = recipeNames.map((name: string) => ({
          name,
          selected: false,
        }));

        // If requesting more ideas, ADD to existing list instead of replacing
        if (wantsMoreIdeas) {
          setIdeas((prev) => [...prev, ...ideaObjects]);
          setMessages((prev) => {
            // Update the last message with ideas
            const lastMsgWithIdeas = [...prev].reverse().find(m => m.ideas);
            if (lastMsgWithIdeas) {
              return prev.map(m => 
                m === lastMsgWithIdeas 
                  ? { ...m, ideas: [...(m.ideas || []), ...ideaObjects] }
                  : m
              );
            }
            // If no previous ideas message, add new one
            return [
              ...prev,
              {
                role: 'bot',
                content: `Here are ${ideaObjects.length} more ideas:\n\n👉 Select the ones you like and click "Confirm", or ask for even more!`,
                ideas: [...ideas, ...ideaObjects],
              },
            ];
          });
        } else {
          // New search - replace ideas and save context
          setIdeas(ideaObjects);
          setLastRecipeContext(userMessage); // Save what user asked for
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              content: 'Great! Here are some recipe ideas:\n\n👉 Select the ones you like and click "Confirm", or ask me for more ideas!',
              ideas: ideaObjects,
            },
          ]);
        }
        setState('idle'); // Keep input active
      } else {
        // Fallback for empty recipe list
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            content: "Hmm, I couldn't come up with recipe ideas for that. 🤔\n\nTry being more specific! For example:\n• \"chicken recipes for dinner\"\n• \"quick vegetarian meals\"\n• \"desserts with berries\"",
          },
        ]);
        setState('idle');
      }
    } catch (error: any) {
      console.error('Error brainstorming:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: `Oops, something went wrong! 😅 Please try again.` },
      ]);
      setState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIdea = (index: number) => {
    setIdeas((prev) =>
      prev.map((idea, i) => (i === index ? { ...idea, selected: !idea.selected } : idea))
    );
  };

  const handleConfirmSelection = async () => {
    const selectedIdeas = ideas.filter((idea) => idea.selected);
    if (selectedIdeas.length === 0) {
      alert('Please select at least one recipe idea');
      return;
    }

    setLoading(true);
    setState('searching');
    setMessages((prev) => [
      ...prev,
      {
        role: 'bot',
        content: `Searching for recipes: ${selectedIdeas.map((i) => i.name).join(', ')}...`,
      },
    ]);

    try {
      const fetchPreviews = httpsCallable(functions, 'chatbotFetchPreviews');
      const result: any = await fetchPreviews({
        recipeNames: selectedIdeas.map((i) => i.name),
      });

      const cards: RecipeCard[] = result.data.recipes || [];
      const failedRecipes: string[] = result.data.failedRecipes || [];
      
      console.log('[RecipeChatbot] Fetched recipe cards:', cards);
      console.log('[RecipeChatbot] Failed recipes:', failedRecipes);

      setRecipeCards(cards);
      // Store the search terms for refresh functionality
      setCurrentSearchTerms(selectedIdeas.map((i) => i.name));
      
      // Build message based on results
      let message = '';
      if (cards.length > 0 && failedRecipes.length === 0) {
        // All recipes found
        message = `✅ Found ${cards.length} matching recipe${cards.length > 1 ? 's' : ''}! 

Click on any card to view details or ask me for more ideas!`;
      } else if (cards.length > 0 && failedRecipes.length > 0) {
        // Some recipes found, some failed
        message = `Found ${cards.length} matching recipe${cards.length > 1 ? 's' : ''}! 

However, I couldn't find good matches for: ${failedRecipes.map(r => `"${r}"`).join(', ')}. 

💡 Try selecting other recipe ideas from the list above or ask me for different options!`;
      } else {
        // No recipes found
        message = `❌ Sorry, I couldn't find good matching recipes for your selections.

Failed to match: ${failedRecipes.map(r => `"${r}"`).join(', ')}

💡 Please try:
• Selecting other recipe ideas from the list above
• Asking me for different recipe types (e.g., "show me simple chicken recipes")
• Trying a different cuisine or meal type`;
      }
      
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: message },
      ]);
      
      setState('idle'); // Always return to idle to allow continued conversation
    } catch (error: any) {
      console.error('Error fetching previews:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: `Error: ${error.message || 'Failed to fetch recipes'}. Please try again or select different recipe ideas.` },
      ]);
      setState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (card: RecipeCard) => {
    window.open(card.url, '_blank');
  };

  const handleExportToRecipe = async (card: RecipeCard) => {
    console.log('[RecipeChatbot] Export to Recipe clicked for:', card.title);
    setLoading(true);
    setState('extracting');
    setAiProcessedRecipe(null); // Reset previous AI result
    aiProcessedRecipeRef.current = null; // Reset ref
    setAiProcessing(false);

    try {
      // Step 1: Scrape the recipe
      console.log('[RecipeChatbot] Scraping recipe...');
      const scrapeOnly = httpsCallable(functions, 'chatbotScrapeOnly');
      const scrapeResult: any = await scrapeOnly({ url: card.url });
      const scrapedData: ScrapedData = scrapeResult.data;

      console.log('[RecipeChatbot] Scraped data received:', scrapedData);

      // Step 2: Show preview modal immediately
      setScrapedData(scrapedData);
      setShowScrapedModal(true);
      setLoading(false);
      setState('idle'); // Keep input active

      // Step 3: Start AI processing in the background (parallel)
      console.log('[RecipeChatbot] Starting AI processing in background...');
      setAiProcessing(true);
      
      const cleanAndSave = httpsCallable(functions, 'chatbotCleanAndSave');
      cleanAndSave({ scrapedData })
        .then((result: any) => {
          const processedRecipe = result.data.recipe;
          console.log('[RecipeChatbot] Background AI processing complete:', processedRecipe);
          setAiProcessedRecipe(processedRecipe);
          aiProcessedRecipeRef.current = processedRecipe; // Store in ref for polling
          setAiProcessing(false);
        })
        .catch((error: any) => {
          console.error('[RecipeChatbot] Background AI processing failed:', error);
          setAiProcessing(false);
          // Don't show error - user can still confirm and it will retry
        });

    } catch (error: any) {
      console.error('Error scraping recipe:', error);
      alert(`Failed to scrape recipe: ${error.message}`);
      setState('idle');
      setLoading(false);
    }
  };

  const handleRefreshAllCards = async () => {
    console.log('[RecipeChatbot] Refreshing all recipe cards');
    setLoading(true);
    
    try {
      // Use the stored current search terms instead of old ideas state
      if (currentSearchTerms.length === 0) {
        console.log('[RecipeChatbot] No current search terms to refresh');
        return;
      }

      console.log('[RecipeChatbot] Refreshing with terms:', currentSearchTerms);

      // Call the fetch previews function again with the current search terms
      const fetchPreviews = httpsCallable(functions, 'chatbotFetchPreviews');
      const result: any = await fetchPreviews({ recipeNames: currentSearchTerms });
      
      const newRecipes: RecipeCard[] = result.data.recipes || [];
      const failedRecipes: string[] = result.data.failedRecipes || [];

      // Update recipe cards with new results
      setRecipeCards(newRecipes);

      // Show message about failed recipes if any
      if (failedRecipes.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            content: `⚠️ Couldn't find good matches for: ${failedRecipes.join(', ')}. Try other recipe ideas or be more specific.`,
          },
        ]);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: `✨ Refreshed ${newRecipes.length} recipe${newRecipes.length !== 1 ? 's' : ''}! These are new options from different sources.`,
        },
      ]);

    } catch (error: any) {
      console.error('Error refreshing recipes:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: `❌ Failed to refresh recipes: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExtract = async () => {
    if (!scrapedData) return;

    console.log('[RecipeChatbot] Confirm Extract clicked');
    setLoading(true);

    try {
      let processedRecipe = aiProcessedRecipe;

      // If AI processing already finished, use cached result
      if (processedRecipe) {
        console.log('[RecipeChatbot] Using cached AI result (already processed in background)');
      } else if (aiProcessing) {
        // AI is still processing, wait for it
        console.log('[RecipeChatbot] AI still processing, waiting...');
        
        // Wait for AI to finish (poll every 500ms, max 30 seconds)
        const maxWait = 30000; // 30 seconds
        const pollInterval = 500;
        let waited = 0;
        
        while (!aiProcessedRecipeRef.current && waited < maxWait) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          waited += pollInterval;
          
          // Check if aiProcessedRecipe was updated by the background promise
          if (aiProcessedRecipeRef.current) {
            processedRecipe = aiProcessedRecipeRef.current;
            break;
          }
        }
        
        // If still not ready, call AI again
        if (!processedRecipe) {
          console.log('[RecipeChatbot] Timeout waiting for background AI, calling again...');
          const cleanAndSave = httpsCallable(functions, 'chatbotCleanAndSave');
          const result: any = await cleanAndSave({ scrapedData });
          processedRecipe = result.data.recipe;
        }
      } else {
        // AI hasn't been called yet (shouldn't happen, but fallback)
        console.log('[RecipeChatbot] AI not started, calling now...');
        const cleanAndSave = httpsCallable(functions, 'chatbotCleanAndSave');
        const result: any = await cleanAndSave({ scrapedData });
        processedRecipe = result.data.recipe;
      }

      console.log('[RecipeChatbot] AI-processed recipe received:', processedRecipe);

      setShowScrapedModal(false);

      // Map the AI-cleaned data to draftRecipe format
      const draftRecipe = {
        id: '',
        name: processedRecipe.name || scrapedData.title || 'Untitled Recipe',
        image: processedRecipe.image || scrapedData.image || '',
        prepTime: processedRecipe.prepTime || scrapedData.prepTime || '',
        cookTime: processedRecipe.cookTime || scrapedData.cookTime || '',
        totalTime: processedRecipe.totalTime || scrapedData.totalTime || '',
        servings: typeof processedRecipe.servings === 'number' ? processedRecipe.servings : parseInt(processedRecipe.servings || scrapedData.servings || '4'),
        caloriesPerServing: processedRecipe.caloriesPerServing || processedRecipe.nutrition?.calories || 0,
        
        ingredients: processedRecipe.ingredients || [],
        instructions: processedRecipe.instructions || [],
        
        nutrition: {
          calories: processedRecipe.nutrition?.calories || processedRecipe.caloriesPerServing || 0,
          protein: processedRecipe.nutrition?.protein || 0,
          carbs: processedRecipe.nutrition?.carbs || 0,
          fat: processedRecipe.nutrition?.fat || 0,
          fiber: processedRecipe.nutrition?.fiber || 0,
        },
        
        cuisine: processedRecipe.cuisine || '',
        cuisines: processedRecipe.cuisines || (processedRecipe.cuisine ? [processedRecipe.cuisine] : []),
        proteinType: processedRecipe.proteinType || '',
        proteinTypes: processedRecipe.proteinTypes || (processedRecipe.proteinType ? [processedRecipe.proteinType] : []),
        mealType: processedRecipe.mealType || '',
        mealTypes: processedRecipe.mealTypes || (processedRecipe.mealType ? [processedRecipe.mealType] : []),
        categories: processedRecipe.categories || (processedRecipe.category ? [processedRecipe.category] : []),
        tags: processedRecipe.tags || [],
        
        sourceUrl: scrapedData.url,
        extractedImages: processedRecipe.extractedImages || (processedRecipe.image ? [processedRecipe.image] : []),
        nutritionCalculationReasoning: processedRecipe.nutritionCalculationReasoning || '',
      };

      console.log('[RecipeChatbot] Draft recipe for form:', draftRecipe);

      // Use AppContext to open the form
      setDraftRecipe(draftRecipe);
      setIsRecipeEditFormOpen(true);
      setScrapedData(null);
      setAiProcessedRecipe(null); // Clear cache
      aiProcessedRecipeRef.current = null; // Clear ref

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: `✅ Recipe "${draftRecipe.name}" ready! Opening edit form...` },
      ]);
    } catch (error: any) {
      console.error('Error processing recipe:', error);
      alert(`Failed to process recipe: ${error.message}`);
    } finally {
      setLoading(false);
      setAiProcessing(false);
    }
  };


  return (
    <>
      {/* Main Chat Container */}
      <div className="min-h-screen bg-gray-50">
        {/* Header - Fixed */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="font-semibold text-lg">Recipe Assistant</h1>
          </div>
        </div>

        {/* Chat Messages - Scrollable content with padding for fixed header, input, and nav */}
        <div 
          className="px-4 py-4 max-w-md mx-auto"
          style={{ 
            paddingTop: '72px', // Header height (56px) + extra (16px)
            paddingBottom: '136px' // Input (56px) + nav (48px) + extra (32px)
          }}
        >
          <div className="space-y-4 w-full">
          {messages.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}-${msg.content?.substring(0, 10)}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
                marginBottom: '12px'
              }}
            >
              <div
                className={`px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gray-200 text-gray-900 rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                }`}
                style={{
                  maxWidth: '85%',
                  backgroundColor: msg.role === 'user' ? '#e5e7eb' : '#ffffff',
                  color: '#111827'
                }}
              >
                <div className="whitespace-pre-wrap text-sm sm:text-base">
                  {msg.content}
                </div>
                {msg.ideas && msg.ideas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {ideas.map((idea, i) => (
                      <button
                        key={i}
                        onClick={() => handleToggleIdea(i)}
                        className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-100 transition text-sm"
                      >
                        {idea.selected ? (
                          <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span>{idea.name}</span>
                      </button>
                    ))}
                    <Button
                      onClick={handleConfirmSelection}
                      disabled={loading || ideas.filter((i) => i.selected).length === 0}
                      className="w-full mt-2"
                    >
                      Confirm Selection
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Recipe Cards */}
          {recipeCards.length > 0 && (
            <div className="grid grid-cols-1 gap-4 mt-4 w-full">
              {recipeCards.map((card, idx) => (
                <Card key={idx} className="p-4 space-y-3">
                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-48 sm:h-56 object-cover rounded"
                    />
                  )}
                  <h3 className="font-semibold text-base sm:text-lg">{card.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{card.description}</p>
                  <p className="text-xs text-gray-500">Source: {card.siteName}</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleViewDetails(card)}
                      variant="outline"
                      className="w-full text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleExportToRecipe(card)}
                      disabled={loading}
                      variant="outline"
                      className="w-full text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to Recipe
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Refresh Results Button */}
          {recipeCards.length > 0 && (
            <div className="mt-4 w-full">
              <Button
                onClick={handleRefreshAllCards}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh All Results
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed above BottomNav */}
        <div 
          className="fixed left-0 right-0 bg-white border-t z-40"
          style={{ bottom: '48px' }} // h-12 = 48px (height of BottomNav)
        >
          <div className="max-w-md mx-auto px-4 py-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="What would you like to cook?"
              disabled={loading}
              className="flex-1 text-base"
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
            <Button onClick={handleSend} disabled={loading} className="flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Bottom Navigation - Fixed at bottom */}
        <BottomNav />
      </div>

      {/* Scraped Data Preview Modal */}
      <Dialog open={showScrapedModal} onOpenChange={setShowScrapedModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Quick Preview</DialogTitle>
            <DialogDescription>
              Here's what we found from the recipe. It might look a bit messy right now, but don't worry - we'll clean it up and organize everything nicely once you confirm!
            </DialogDescription>
          </DialogHeader>
          <div
            style={{ maxHeight: '50vh', overflowY: 'auto' }}
            className="space-y-4 pr-2 flex-1"
          >
            {scrapedData && (
              <>
                {scrapedData.image && (
                  <img
                    src={scrapedData.image}
                    alt={scrapedData.title}
                    className="w-full h-40 sm:h-48 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">{scrapedData.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{scrapedData.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Source: {scrapedData.siteName}</p>
                  <a
                    href={scrapedData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    {scrapedData.url}
                  </a>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">⏱️ Times & Servings</h4>
                  <p className="text-xs sm:text-sm">
                    Prep: {scrapedData.prepTime || "We'll figure this out"} | 
                    Cook: {scrapedData.cookTime || "We'll figure this out"} |
                    Total: {scrapedData.totalTime || "We'll figure this out"}
                  </p>
                  <p className="text-xs sm:text-sm">Servings: {scrapedData.servings || "We'll estimate this"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">🥕 Ingredients ({scrapedData.ingredients?.length || 0} found)</h4>
                  <ul className="text-xs sm:text-sm space-y-1 list-disc pl-5">
                    {scrapedData.ingredients?.slice(0, 15).map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                    {scrapedData.ingredients?.length > 15 && (
                      <li className="text-gray-500">...and {scrapedData.ingredients.length - 15} more</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">👨‍🍳 Cooking Steps ({scrapedData.instructions?.length || 0} steps)</h4>
                  <ol className="text-xs sm:text-sm space-y-2 list-decimal pl-5">
                    {scrapedData.instructions?.slice(0, 10).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                    {scrapedData.instructions?.length > 10 && (
                      <li className="text-gray-500">...and {scrapedData.instructions.length - 10} more steps</li>
                    )}
                  </ol>
                </div>
                {scrapedData.nutrition && Object.keys(scrapedData.nutrition).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">📊 Nutrition Info</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(scrapedData.nutrition, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="bg-blue-50 p-3 rounded text-xs sm:text-sm">
                  <p className="font-semibold mb-1">✨ What happens next?</p>
                  <p className="mb-2">If this looks roughly right, we'll clean everything up for you:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Organize ingredients with proper measurements</li>
                    <li>Format the cooking steps clearly</li>
                    <li>Fill in any missing timing or nutrition details</li>
                    <li>Add helpful tags (cuisine type, protein, meal category)</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          
          {/* Buttons - Always visible at bottom */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t flex-shrink-0">
            <Button 
              onClick={handleConfirmExtract} 
              disabled={loading} 
              className="flex-1 bg-black hover:bg-gray-800 text-white text-base font-semibold py-3"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Opening recipe form...
                </>
              ) : aiProcessedRecipe ? (
                "✓ Looks Good - Open Form!"
              ) : aiProcessing ? (
                "✓ Looks Good - Clean It Up!"
              ) : (
                "✓ Looks Good - Clean It Up!"
              )}
            </Button>
            <Button
              onClick={() => {
                setShowScrapedModal(false);
                setScrapedData(null);
                setAiProcessedRecipe(null);
                setAiProcessing(false);
              }}
              variant="outline"
              disabled={loading}
              className="flex-1 text-base py-3"
            >
              Cancel
            </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}

