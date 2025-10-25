import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Loader2, Sparkles, ChevronRight, Check, X } from 'lucide-react';
import { generateRecipeIdeas, searchRecipeUrl, parseRecipeWithBilingualSupport } from '../../utils/geminiRecipeParser';

type WizardStep = 'query' | 'suggestions' | 'processing' | 'next-action';

interface RecipeSuggestion {
  name: string;
  selected: boolean;
}

export function RecipeIdeaWizard() {
  const { setDraftRecipe, setIsRecipeEditFormOpen, setSelectedRecipe, addRecipe } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>('query');
  const [query, setQuery] = useState('');
  const [suggestionCount, setSuggestionCount] = useState(5);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Processing state
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [tempParsedRecipe, setTempParsedRecipe] = useState<any>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const handleOpen = () => {
    setIsOpen(true);
    resetWizard();
  };

  const handleClose = () => {
    setIsOpen(false);
    resetWizard();
  };

  const resetWizard = () => {
    setStep('query');
    setQuery('');
    setSuggestionCount(5);
    setSuggestions([]);
    setIsLoading(false);
    setCurrentProcessingIndex(0);
    setExtractedImages([]);
    setTempParsedRecipe(null);
    setShowImageSelector(false);
    setProcessedCount(0);
    setTotalToProcess(0);
  };

  const handleGenerateIdeas = async () => {
    if (!query.trim()) {
      alert('Please enter what kind of recipe you want');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Generating ${suggestionCount} recipe ideas...`);

    try {
      const ideas = await generateRecipeIdeas(query, suggestionCount);
      setSuggestions(ideas.map(name => ({ name, selected: false })));
      setStep('suggestions');
    } catch (error: any) {
      console.error('Failed to generate ideas:', error);
      alert(`Failed to generate ideas: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleToggleSuggestion = (index: number) => {
    setSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleGenerateRecipes = async () => {
    const selected = suggestions.filter(s => s.selected);
    
    if (selected.length === 0) {
      alert('Please select at least one recipe to generate');
      return;
    }

    setTotalToProcess(selected.length);
    setProcessedCount(0);
    setCurrentProcessingIndex(0);
    setStep('processing');

    // Process first recipe
    await processNextRecipe(selected, 0);
  };

  const processNextRecipe = async (selected: RecipeSuggestion[], index: number) => {
    if (index >= selected.length) {
      // All done, show next action
      setStep('next-action');
      return;
    }

    const dishName = selected[index].name;
    setLoadingMessage(`Finding recipe for ${dishName}...`);
    setIsLoading(true);

    try {
      // Try multiple recipe sources automatically
      const potentialUrls = generateRecipeUrls(dishName);
      
      let parsedRecipe = null;
      let workingUrl = null;
      let recipeImages: string[] = [];
      
      for (const searchUrl of potentialUrls) {
        try {
          console.log(`🔍 Trying search: ${searchUrl}`);
          setLoadingMessage(`Searching ${new URL(searchUrl).hostname}...`);
          
          // Step 1: Fetch search results page
          const searchHtml = await fetchRecipeFromUrl(searchUrl);
          const searchDoc = new DOMParser().parseFromString(searchHtml, 'text/html');
          
          // Step 2: Extract first recipe link from search results
          const recipeLink = findFirstRecipeLink(searchDoc, searchUrl);
          
          if (!recipeLink) {
            console.log('No recipe links found in search results');
            continue;
          }
          
          console.log(`📄 Found recipe link: ${recipeLink}`);
          setLoadingMessage(`Fetching recipe details...`);
          
          // Step 3: Fetch the actual recipe page
          const html = await fetchRecipeFromUrl(recipeLink);
          
          // Extract text and images
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          recipeImages = extractImagesFromDoc(doc);
          
          // Remove unwanted elements
          const unwanted = doc.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ad, .comments');
          unwanted.forEach(el => el.remove());
          
          const extractedText = doc.body.innerText || doc.body.textContent || '';
          
          // If we got substantial text, try parsing
          if (extractedText.length > 200) {
            setLoadingMessage(`Extracting recipe details with AI...`);
            parsedRecipe = await parseRecipeWithBilingualSupport(extractedText);
            parsedRecipe.originalText = extractedText;
            parsedRecipe.sourceUrl = recipeLink;
            workingUrl = recipeLink;
            console.log('✅ Successfully fetched and parsed recipe!');
            break; // Success!
          }
        } catch (error) {
          console.log(`❌ Failed to fetch from search:`, error);
          continue; // Try next URL
        }
      }
      
      if (!parsedRecipe) {
        // All URLs failed, offer manual option
        setIsLoading(false);
        const userChoice = confirm(
          `Couldn't automatically find a recipe for "${dishName}".\n\n` +
          `Would you like to:\n` +
          `• Click OK to manually paste a recipe URL\n` +
          `• Click Cancel to skip this recipe`
        );
        
        if (userChoice) {
          // User wants to paste URL manually
          const searchQuery = encodeURIComponent(`${dishName} recipe`);
          window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
          
          const manualUrl = prompt(`Paste recipe URL for "${dishName}":`);
          if (manualUrl) {
            setLoadingMessage(`Fetching recipe...`);
            setIsLoading(true);
            const html = await fetchRecipeFromUrl(manualUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            recipeImages = extractImagesFromDoc(doc);
            const unwanted = doc.querySelectorAll('script, style, nav, header, footer, aside');
            unwanted.forEach(el => el.remove());
            const extractedText = doc.body.innerText || '';
            parsedRecipe = await parseRecipeWithBilingualSupport(extractedText);
            parsedRecipe.originalText = extractedText;
            parsedRecipe.sourceUrl = manualUrl;
          } else {
            moveToNextRecipe(selected, index);
            return;
          }
        } else {
          // Skip this recipe
          moveToNextRecipe(selected, index);
          return;
        }
      }
      
      // Show image selector or edit form for approval
      setTempParsedRecipe(parsedRecipe);
      setExtractedImages(recipeImages);
      setIsLoading(false);
      
      if (recipeImages.length > 0) {
        setShowImageSelector(true);
      } else {
        showRecipeForApproval(parsedRecipe, selected, index);
      }
      
    } catch (error: any) {
      console.error('Failed to process recipe:', error);
      setIsLoading(false);
      const retry = confirm(`Error: ${error.message}\n\nTry again?`);
      if (retry) {
        processNextRecipe(selected, index);
      } else {
        moveToNextRecipe(selected, index);
      }
    }
  };

  const generateRecipeUrls = (dishName: string): string[] => {
    const cleanName = dishName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    const searchName = encodeURIComponent(dishName);
    
    // Generate multiple potential URLs
    return [
      `https://www.allrecipes.com/search?q=${searchName}`,
      `https://www.simplyrecipes.com/search?q=${searchName}`,
      `https://www.foodnetwork.com/search/${searchName}`,
      `https://www.seriouseats.com/search?q=${searchName}`,
      `https://www.bonappetit.com/search?q=${searchName}`,
    ];
  };

  const findFirstRecipeLink = (doc: Document, baseUrl: string): string | null => {
    const links = Array.from(doc.querySelectorAll('a[href]'));
    const baseDomain = new URL(baseUrl).hostname;
    
    // Look for recipe-like URLs
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      let fullUrl = href;
      
      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        fullUrl = `https://${baseDomain}${href}`;
      } else if (!href.startsWith('http')) {
        continue;
      }
      
      // Check if it looks like a recipe page (not search, not homepage)
      if (fullUrl.includes(baseDomain) &&
          fullUrl.includes('recipe') &&
          !fullUrl.includes('search') &&
          !fullUrl.includes('collection') &&
          fullUrl.length > baseUrl.length + 10) {
        return fullUrl;
      }
    }
    
    return null;
  };

  const fetchRecipeFromUrl = async (url: string): Promise<string> => {
    const corsProxies = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];
    
    let html = '';
    let lastError = null;
    
    for (const proxyUrl of corsProxies) {
      try {
        const response = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (proxyUrl.includes('allorigins')) {
          const data = await response.json();
          html = data.contents;
        } else {
          html = await response.text();
        }
        
        if (html && html.length > 100) {
          return html;
        }
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }
    
    throw lastError || new Error('All proxies failed');
  };

  const extractImagesFromDoc = (doc: Document): string[] => {
    const images: string[] = [];
    
    // Try Open Graph image
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const src = ogImage.getAttribute('content') || '';
      if (src) images.push(src);
    }
    
    // Try Twitter image
    const twitterImage = doc.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      const src = twitterImage.getAttribute('content') || '';
      if (src && !images.includes(src)) images.push(src);
    }
    
    // Get content images
    const imgElements = doc.querySelectorAll('img');
    for (const img of Array.from(imgElements)) {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
      if (src && 
          !src.includes('icon') && 
          !src.includes('logo') && 
          !src.includes('avatar') &&
          !src.includes('button') &&
          !images.includes(src) &&
          images.length < 10) {
        images.push(src);
      }
    }
    
    return images;
  };

  const showRecipeForApproval = async (parsedRecipe: any, selected: RecipeSuggestion[], index: number) => {
    // Save recipe directly
    try {
      await addRecipe(parsedRecipe);
      console.log('✅ Recipe saved successfully');
      // Move to next recipe
      moveToNextRecipe(selected, index);
    } catch (error: any) {
      console.error('Failed to save recipe:', error);
      alert(`Failed to save recipe: ${error.message}`);
      moveToNextRecipe(selected, index);
    }
  };

  const handleImageSelected = async (imageUrl: string) => {
    if (tempParsedRecipe) {
      tempParsedRecipe.image = imageUrl;
      
      // Save recipe directly
      const selected = suggestions.filter(s => s.selected);
      await showRecipeForApproval(tempParsedRecipe, selected, currentProcessingIndex);
    }
  };

  const handleSkipImageSelection = async () => {
    if (tempParsedRecipe) {
      // Save recipe without custom image
      const selected = suggestions.filter(s => s.selected);
      await showRecipeForApproval(tempParsedRecipe, selected, currentProcessingIndex);
    }
  };

  const moveToNextRecipe = (selected: RecipeSuggestion[], currentIndex: number) => {
    setShowImageSelector(false);
    setTempParsedRecipe(null);
    setExtractedImages([]);
    setProcessedCount(prev => prev + 1);
    
    const nextIndex = currentIndex + 1;
    setCurrentProcessingIndex(nextIndex);
    
    // Process next recipe
    processNextRecipe(selected, nextIndex);
  };

  const handleMoreIdeas = async () => {
    setStep('suggestions');
    setIsLoading(true);
    setLoadingMessage(`Generating more recipe ideas...`);

    try {
      const ideas = await generateRecipeIdeas(query, suggestionCount);
      setSuggestions(ideas.map(name => ({ name, selected: false })));
    } catch (error: any) {
      alert(`Failed to generate more ideas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    resetWizard();
  };

  const handleDone = () => {
    handleClose();
  };

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={handleOpen} className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        AI Recipe Ideas
      </Button>

      {/* Main Wizard Dialog */}
      <Dialog open={isOpen && !showImageSelector} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Recipe Discovery
            </DialogTitle>
            <DialogDescription>
              {step === 'query' && 'Describe what you want to cook'}
              {step === 'suggestions' && 'Select recipes to generate'}
              {step === 'processing' && `Processing ${processedCount + 1} of ${totalToProcess}...`}
              {step === 'next-action' && 'What would you like to do next?'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Query Input */}
          {step === 'query' && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What kind of recipe do you want? (English or Chinese)
                </label>
                <Textarea
                  placeholder="e.g., healthy chicken dinner for kids
或者：快速简单的午餐食谱"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  How many suggestions?
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={suggestionCount}
                  onChange={(e) => setSuggestionCount(parseInt(e.target.value) || 5)}
                  className="w-32"
                />
              </div>

              <Button
                onClick={handleGenerateIdeas}
                disabled={isLoading || !query.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Recipe Ideas
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Suggestions */}
          {step === 'suggestions' && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-600 mb-4">
                Select the recipes you want to create:
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      suggestion.selected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleToggleSuggestion(index)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      suggestion.selected
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {suggestion.selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="flex-1">{suggestion.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('query')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerateRecipes}
                  disabled={suggestions.filter(s => s.selected).length === 0}
                  className="flex-1"
                >
                  Generate Selected Recipes
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
              <div className="text-lg font-medium">{loadingMessage}</div>
              <div className="text-sm text-gray-600">
                Progress: {processedCount} of {totalToProcess} completed
              </div>
            </div>
          )}

          {/* Step 4: Next Action */}
          {step === 'next-action' && (
            <div className="space-y-4 py-4">
              <div className="text-center text-lg font-medium text-green-600 mb-4">
                ✅ All recipes generated successfully!
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                What would you like to do next?
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleMoreIdeas}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isLoading}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  More recipes for "{query}"
                </Button>

                <Button
                  onClick={handleStartOver}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Start new search
                </Button>

                <Button
                  onClick={handleDone}
                  className="w-full"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Selector Dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Recipe Image</DialogTitle>
            <DialogDescription>
              Choose the best image for {tempParsedRecipe?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {extractedImages.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all"
                onClick={() => handleImageSelected(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`Option ${index + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">
                    Select
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSkipImageSelection}>
              Skip - Use Default
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

