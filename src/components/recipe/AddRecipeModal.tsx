import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Upload, FileText, Edit, Loader2, Image as ImageIcon, Link, AlertTriangle } from 'lucide-react';
import { parseRecipeText } from '../../utils/recipeParser';
import { parseRecipeWithGemini, parseRecipeWithBilingualSupport, parseRecipeFromImage } from '../../utils/geminiRecipeParser';

export function AddRecipeModal() {
  const { 
    isAddRecipeModalOpen, 
    setIsAddRecipeModalOpen, 
    setIsRecipeEditFormOpen,
    setDraftRecipe,
    setSelectedRecipe
  } = useApp();
  const [pasteText, setPasteText] = useState('');
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [tempParsedRecipe, setTempParsedRecipe] = useState<any>(null);
  const [showAiErrorDialog, setShowAiErrorDialog] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState('');
  const [failedRecipeData, setFailedRecipeData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isAddRecipeModalOpen) {
      setShowPasteInput(false);
      setPasteText('');
      setShowUrlInput(false);
      setPasteUrl('');
      setExtractedImages([]);
      setShowImageSelector(false);
      setTempParsedRecipe(null);
      setShowAiErrorDialog(false);
      setAiErrorMessage('');
      setFailedRecipeData(null);
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, [isAddRecipeModalOpen]);

  const handleClose = () => {
    setIsAddRecipeModalOpen(false);
    setShowPasteInput(false);
    setPasteText('');
    setShowUrlInput(false);
    setPasteUrl('');
    setExtractedImages([]);
    setShowImageSelector(false);
    setTempParsedRecipe(null);
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  // Helper function to resize image for better OCR performance on mobile
  const resizeImageForOCR = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Limit max dimension to 1600px for better performance
        const maxDimension = 1600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, file.type, 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // Convert image to data URL for display
      const reader = new FileReader();
      const imageDataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      console.log('📸 Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Resize image for better AI processing performance
      const resizedImage = await resizeImageForOCR(file);
      console.log('📸 Resized image size:', (resizedImage.size / 1024 / 1024).toFixed(2), 'MB');

      // Convert resized blob to data URL for Gemini
      const resizedDataUrl = await new Promise<string>((resolve) => {
        const reader2 = new FileReader();
        reader2.onload = (e) => resolve(e.target?.result as string);
        reader2.readAsDataURL(resizedImage);
      });

      // Parse the image directly with Gemini Vision (NO OCR!)
      let parsedRecipe;
      try {
        console.log('📸 Sending image directly to Gemini Vision AI...');
        setOcrProgress(50); // Show some progress
        parsedRecipe = await parseRecipeFromImage(resizedDataUrl);
        console.log('✅ AI image processing successful!');
        console.log('📦 Parsed recipe:', parsedRecipe);
        setOcrProgress(100);
      } catch (error: any) {
        console.error('⚠️ AI image processing failed:', error.message);
        setIsProcessing(false);
        setOcrProgress(0);
        
        // Show error dialog with retry or manual input options
        setAiErrorMessage(`AI failed to extract recipe from image.\n\nError: ${error.message || 'Unknown error'}`);
        setFailedRecipeData({ imageDataUrl, type: 'image' });
        setShowAiErrorDialog(true);
        return; // Stop execution
      }
      
      // Ensure all required fields have default values
      parsedRecipe = {
        ...parsedRecipe,
        servings: parsedRecipe.servings || 0,
        caloriesPerServing: parsedRecipe.caloriesPerServing || 0,
        nutrition: parsedRecipe.nutrition || {
          protein: 0,
          fiber: 0,
          fat: 0,
          carbs: 0,
          iron: 'Moderate',
          calcium: 'Moderate',
        },
        plateComposition: parsedRecipe.plateComposition || {
          protein: 25,
          veggies: 25,
          carbs: 25,
          fats: 25,
        },
        portions: parsedRecipe.portions || {
          adult: '',
          child5: '',
          child2: '',
        },
      };
      
      // Store original image for display
      parsedRecipe.image = imageDataUrl;
      
      // Store original image data for later cropping in the form
      (parsedRecipe as any).originalImageForCropping = imageDataUrl;
      
      setSelectedRecipe(null);
      setDraftRecipe(parsedRecipe);
      
      setIsProcessing(false);
      setOcrProgress(0);
      handleClose();
      
      setTimeout(() => {
        setIsRecipeEditFormOpen(true);
      }, 50);
    } catch (error: any) {
      console.error('❌ Error processing image:', error);
      const errorMessage = error.message || 'Unknown error';
      alert(`Failed to process image: ${errorMessage}\n\nPlease try again or use "Paste Recipe Text" instead.`);
      setIsProcessing(false);
      setOcrProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handlePasteRecipe = async () => {
    if (pasteText.trim()) {
      setIsProcessing(true);
      
      // Parse the recipe text with AI
      let parsedRecipe;
      try {
        console.log('🤖 Attempting AI parsing with Gemini (clean text - 60s timeout)...');
        parsedRecipe = await parseRecipeWithGemini(pasteText, 60000);
        console.log('✅ AI parsing successful!');
      } catch (error: any) {
        console.error('⚠️ AI parsing failed:', error.message);
        setIsProcessing(false);
        
        // Show error dialog with retry or manual input options
        setAiErrorMessage(`AI failed to parse recipe text.\n\nError: ${error.message || 'Unknown error'}`);
        setFailedRecipeData({ text: pasteText, type: 'text' });
        setShowAiErrorDialog(true);
        return; // Stop execution
      }
      
      // IMPORTANT: Add the original text to the parsed recipe
      parsedRecipe.originalText = pasteText;
      
      // Clear any selected recipe first
      setSelectedRecipe(null);
      
      // Store the parsed data as a draft
      setDraftRecipe(parsedRecipe);
      console.log('Draft recipe set, closing modal');
      
      setIsProcessing(false);
      handleClose();
      
      // Open the edit form with pre-filled data
      setTimeout(() => {
        console.log('Opening edit form');
        setIsRecipeEditFormOpen(true);
      }, 50);
    }
  };

  const handleFetchUrl = async () => {
    if (!pasteUrl.trim()) return;
    
    // Validate URL
    try {
      new URL(pasteUrl);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🌐 Fetching recipe from URL:', pasteUrl);
      
      // Try multiple CORS proxies in order
      const corsProxies = [
        `https://corsproxy.io/?${encodeURIComponent(pasteUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(pasteUrl)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(pasteUrl)}`
      ];
      
      let html = '';
      let lastError = null;
      
      for (const proxyUrl of corsProxies) {
        try {
          console.log('Trying proxy:', proxyUrl.split('?')[0]);
          const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          // Check if it's AllOrigins (returns JSON)
          if (proxyUrl.includes('allorigins')) {
            const data = await response.json();
            html = data.contents;
          } else {
            html = await response.text();
          }
          
          if (html && html.length > 100) {
            console.log('✅ Successfully fetched HTML, length:', html.length);
            break;
          }
        } catch (error: any) {
          console.warn('Proxy failed:', error.message);
          lastError = error;
          continue;
        }
      }
      
      if (!html || html.length < 100) {
        throw lastError || new Error('All proxies failed');
      }

      // Extract text and images from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract multiple recipe images for user selection
      const recipeImages: string[] = [];
      
      // Try to get Open Graph image (most reliable for recipe sites)
      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const ogSrc = ogImage.getAttribute('content') || '';
        if (ogSrc) {
          recipeImages.push(ogSrc);
          console.log('📷 Found OG image:', ogSrc);
        }
      }
      
      // Try Twitter image
      const twitterImage = doc.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        const twitterSrc = twitterImage.getAttribute('content') || '';
        if (twitterSrc && !recipeImages.includes(twitterSrc)) {
          recipeImages.push(twitterSrc);
          console.log('📷 Found Twitter image:', twitterSrc);
        }
      }
      
      // Get all images from the content
      const images = doc.querySelectorAll('img');
      for (const img of Array.from(images)) {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
        // Skip small images, icons, ads, and duplicates
        if (src && 
            !src.includes('icon') && 
            !src.includes('logo') && 
            !src.includes('avatar') &&
            !src.includes('button') &&
            !recipeImages.includes(src) &&
            recipeImages.length < 10) { // Limit to 10 images
          recipeImages.push(src);
        }
      }
      
      console.log('📷 Found', recipeImages.length, 'images total');
      
      // Remove unwanted elements
      const unwanted = doc.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ad, .comments');
      unwanted.forEach(el => el.remove());
      
      const extractedText = doc.body.innerText || doc.body.textContent || '';
      console.log('📝 Extracted text from HTML, length:', extractedText.length);

      if (!extractedText.trim() || extractedText.length < 50) {
        throw new Error('No meaningful text found in the URL');
      }

      // Parse the extracted text with AI AND generate Chinese translation
      let parsedRecipe;
      try {
        console.log('🌏 Attempting bilingual AI parsing (English + Chinese)...');
        parsedRecipe = await parseRecipeWithBilingualSupport(extractedText);
        console.log('✅ Bilingual parsing successful! Recipe now has both EN and ZH versions.');
      } catch (error: any) {
        console.error('⚠️ AI parsing failed:', error.message);
        setIsProcessing(false);
        
        // Show error dialog with retry or manual input options
        setAiErrorMessage(`AI failed to parse recipe from URL.\n\nError: ${error.message || 'Unknown error'}`);
        setFailedRecipeData({ text: extractedText, url: pasteUrl, images: recipeImages, type: 'url' });
        setShowAiErrorDialog(true);
        return; // Stop execution
      }

      parsedRecipe.originalText = extractedText;
      parsedRecipe.sourceUrl = pasteUrl; // Save the original URL
      
      setIsProcessing(false);
      
      // If we found images, show image selector
      if (recipeImages.length > 0) {
        setExtractedImages(recipeImages);
        setTempParsedRecipe(parsedRecipe);
        setShowImageSelector(true);
        console.log('🖼️ Showing image selector with', recipeImages.length, 'images');
      } else {
        // No images found, proceed directly
        setSelectedRecipe(null);
        setDraftRecipe(parsedRecipe);
        handleClose();
        setTimeout(() => {
          setIsRecipeEditFormOpen(true);
        }, 50);
      }
    } catch (error: any) {
      console.error('❌ Error fetching URL:', error);
      setIsProcessing(false);
      
      // Provide helpful error message with fallback option
      const message = `Failed to automatically fetch recipe from URL.\n\nError: ${error.message}\n\nWould you like to manually copy the text instead?`;
      
      if (confirm(message)) {
        // Open URL in new tab and switch to paste mode
        window.open(pasteUrl, '_blank');
        setShowUrlInput(false);
        setPasteUrl('');
        setTimeout(() => setShowPasteInput(true), 500);
      }
    }
  };

  const handleImageSelected = (imageUrl: string) => {
    if (tempParsedRecipe) {
      tempParsedRecipe.image = imageUrl;
      setSelectedRecipe(null);
      setDraftRecipe(tempParsedRecipe);
      handleClose();
      setTimeout(() => {
        setIsRecipeEditFormOpen(true);
      }, 50);
    }
  };

  const handleSkipImageSelection = () => {
    if (tempParsedRecipe) {
      setSelectedRecipe(null);
      setDraftRecipe(tempParsedRecipe);
      handleClose();
      setTimeout(() => {
        setIsRecipeEditFormOpen(true);
      }, 50);
    }
  };

  const handleManualEntry = () => {
    handleClose();
    setIsRecipeEditFormOpen(true);
  };
  
  const handleRetryAiParsing = async () => {
    setShowAiErrorDialog(false);
    
    if (!failedRecipeData) return;
    
    if (failedRecipeData.type === 'image') {
      // Retry image parsing
      const file = await fetch(failedRecipeData.imageDataUrl)
        .then(r => r.blob())
        .then(blob => new File([blob], "recipe.jpg", { type: "image/jpeg" }));
      
      const event = {
        target: { files: [file] }
      } as any;
      
      setFailedRecipeData(null);
      handleImageFileSelected(event);
    } else if (failedRecipeData.type === 'text') {
      // Retry text parsing
      setPasteText(failedRecipeData.text);
      setShowPasteInput(true);
      setFailedRecipeData(null);
      handlePasteRecipe();
    } else if (failedRecipeData.type === 'url') {
      // Retry URL parsing
      setPasteUrl(failedRecipeData.url);
      setShowUrlInput(true);
      setFailedRecipeData(null);
      handleFetchUrl();
    }
  };
  
  const handleProceedManually = () => {
    setShowAiErrorDialog(false);
    
    if (!failedRecipeData) {
      handleManualEntry();
      return;
    }
    
    // Create a minimal recipe with available data
    const minimalRecipe: any = {
      name: 'Untitled Recipe',
      ingredients: [{ id: '1', amount: '', unit: '', name: '' }],
      instructions: [''],
      cuisine: '',
      proteinType: '',
      mealType: '',
      servings: 4,
      caloriesPerServing: 0,
      nutrition: {
        protein: 0,
        fiber: 0,
        fat: 0,
        carbs: 0,
        iron: 'Moderate',
        calcium: 'Moderate',
      },
      plateComposition: {
        protein: 25,
        veggies: 25,
        carbs: 25,
        fats: 25,
      },
    };
    
    // Add any available data
    if (failedRecipeData.imageDataUrl) {
      minimalRecipe.image = failedRecipeData.imageDataUrl;
    }
    if (failedRecipeData.text) {
      minimalRecipe.originalText = failedRecipeData.text;
    }
    if (failedRecipeData.url) {
      minimalRecipe.sourceUrl = failedRecipeData.url;
    }
    
    setSelectedRecipe(null);
    setDraftRecipe(minimalRecipe);
    setFailedRecipeData(null);
    handleClose();
    
    setTimeout(() => {
      setIsRecipeEditFormOpen(true);
    }, 50);
  };

  return (
    <>
    <Dialog open={isAddRecipeModalOpen && !showImageSelector} onOpenChange={setIsAddRecipeModalOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a New Recipe</DialogTitle>
                <DialogDescription>
                  Choose how you'd like to add your recipe
                </DialogDescription>
              </DialogHeader>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelected}
                className="hidden"
              />

              <div className="space-y-4 py-4">
          {/* Option 1: AI Extraction */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">
              Option 1: AI Extraction (Primary)
            </h3>
            <p className="text-sm text-gray-600">
              Upload a recipe screenshot, paste a URL, or paste text - AI extracts everything instantly.
            </p>

            {/* Upload Screenshot Button */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleUploadImage}
              disabled={isProcessing}
            >
              {isProcessing && ocrProgress > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Processing... {ocrProgress}%
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Recipe Screenshot
                </>
              )}
            </Button>

            {/* Paste URL */}
            {!showUrlInput ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowUrlInput(true)}
                disabled={isProcessing}
              >
                <Link className="mr-2 h-4 w-4" />
                Import from URL
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  🌐 Enter a recipe URL and we'll automatically extract the recipe
                </p>
                <input
                  type="url"
                  placeholder="https://example.com/recipe"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleFetchUrl}
                    disabled={!pasteUrl.trim() || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting Recipe...
                      </>
                    ) : (
                      'Fetch Recipe'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUrlInput(false);
                      setPasteUrl('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Paste Recipe Text */}
            {!showPasteInput ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowPasteInput(true)}
                disabled={isProcessing}
              >
                <FileText className="mr-2 h-4 w-4" />
                Paste Recipe Text
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste recipe text here (e.g., from a website or cookbook)..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={8}
                  className="resize-none font-mono text-sm"
                  disabled={isProcessing}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handlePasteRecipe}
                    disabled={!pasteText.trim() || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing with AI...
                      </>
                    ) : (
                      'Process with AI'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasteInput(false);
                      setPasteText('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Option 2: Manual Entry */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">
              Option 2: Manual Entry
            </h3>
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={handleManualEntry}
            >
              <Edit className="mr-2 h-4 w-4" />
              Enter Manually
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Image Selector Dialog */}
    <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
      <DialogContent 
        className="max-w-md overflow-hidden flex flex-col p-0 gap-0"
        style={{ maxHeight: '85vh', height: 'auto' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <DialogTitle>Select Recipe Image</DialogTitle>
          <DialogDescription>
            Choose an image to use as the recipe card display picture
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className="flex-1 overflow-y-auto px-6 pb-6 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="grid grid-cols-2 gap-4 py-4">
            {extractedImages.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
                onClick={() => handleImageSelected(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`Recipe option ${index + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Hide broken images
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
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleSkipImageSelection}>
              Skip - Use Default
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* AI Error Dialog */}
    <AlertDialog open={showAiErrorDialog} onOpenChange={setShowAiErrorDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-lg">AI Parsing Failed</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600 whitespace-pre-line">
            {aiErrorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleProceedManually} className="w-full sm:w-auto">
            Proceed with Manual Input
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRetryAiParsing} className="w-full sm:w-auto">
            Try Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
}

