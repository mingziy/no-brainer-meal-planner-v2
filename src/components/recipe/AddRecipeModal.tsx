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
import { parseRecipeWithGemini, parseRecipeFromImage } from '../../utils/geminiRecipeParser';

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
    console.log('🔵 handleUploadImage clicked');
    console.log('🔵 fileInputRef exists:', !!fileInputRef.current);
    console.log('🔵 isProcessing:', isProcessing);
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
    console.log('🎯 handleImageFileSelected called');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File selected:', file.name, file.type, (file.size / 1024).toFixed(2), 'KB');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      alert('Please select an image file');
      return;
    }

    console.log('✅ Starting image processing...');
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
      
      // Show image selector to let user crop/select the image
      // NOTE: Image selection is now handled in RecipeEditFormV2 as Step 1
      // So we pass the image directly and open the edit form
      setIsProcessing(false);
      setOcrProgress(0);
      
      setSelectedRecipe(null);
      setDraftRecipe(parsedRecipe);
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
      // ⚠️ DEPRECATION WARNING
      // TODO: MIGRATE TO BACKEND - This client-side scraping should be moved to Firebase Functions
      // for better security, reliability, and App Store compliance.
      // See: FRONTEND_SCRAPING_REMOVAL.md
      console.warn('[AddRecipeModal] ⚠️ Using deprecated client-side scraping. Migrate to backend.');
      
      console.log('🌐 Fetching recipe from URL:', pasteUrl);
      
      // Feature flag to disable URL extraction if needed
      const ENABLE_CLIENT_SIDE_EXTRACTION = true; // Set to false when backend is ready
      
      if (!ENABLE_CLIENT_SIDE_EXTRACTION) {
        throw new Error('URL extraction temporarily disabled. Please use manual entry or screenshot.');
      }
      
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
        parsedRecipe = await parseRecipeWithGemini(extractedText, 60000);
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
      parsedRecipe.extractedImages = recipeImages; // Save all extracted images for selection later
      
      // Set the first image as default
      if (recipeImages.length > 0) {
        parsedRecipe.image = recipeImages[0];
      }
      
      setIsProcessing(false);
      
      // Go directly to edit form - Step 1 will show image selector
      setSelectedRecipe(null);
      setDraftRecipe(parsedRecipe);
      handleClose();
      setTimeout(() => {
        setIsRecipeEditFormOpen(true);
      }, 50);
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
    console.log('🖼️ Image selected:', imageUrl.substring(0, 50) + '...');
    console.log('📦 tempParsedRecipe exists:', !!tempParsedRecipe);
    
    if (tempParsedRecipe) {
      tempParsedRecipe.image = imageUrl;
      console.log('✅ Set tempParsedRecipe.image');
      
      setSelectedRecipe(null);
      setDraftRecipe(tempParsedRecipe);
      console.log('✅ Set draft recipe, closing modal');
      
      handleClose();
      setTimeout(() => {
        console.log('✅ Opening RecipeEditFormV2');
        setIsRecipeEditFormOpen(true);
      }, 50);
    } else {
      console.error('❌ tempParsedRecipe is null!');
    }
  };

  const handleSkipImageSelection = () => {
    console.log('⏭️ Skipping image selection');
    
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
    setSelectedRecipe(null);
    setDraftRecipe(null);
    handleClose();
    setTimeout(() => {
      setIsRecipeEditFormOpen(true);
    }, 50);
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
      <DialogContent className="max-w-md">
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
          onChange={(e) => {
            console.log('📥 File input onChange triggered');
            console.log('📥 Files:', e.target.files);
            handleImageFileSelected(e);
          }}
          onClick={(e) => {
            console.log('🖱️ File input clicked');
            // Reset value to allow selecting the same file again
            (e.target as HTMLInputElement).value = '';
          }}
          className="hidden"
        />

        <div className="space-y-3 py-4">
          {/* Option 1: URL (Recommended) */}
          {!showUrlInput ? (
            <button
              onClick={() => setShowUrlInput(true)}
              disabled={isProcessing}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <Link className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    1. URL <span className="text-gray-500 text-sm">(Recommended)</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Paste a recipe link and AI extracts everything
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-4 border-2 border-primary rounded-lg space-y-3 bg-primary/5">
              <div className="flex items-start gap-3">
                <Link className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-2">
                    1. URL <span className="text-primary text-sm">(Recommended)</span>
                  </h3>
                  <input
                    type="url"
                    placeholder="https://example.com/recipe"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isProcessing}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handleFetchUrl}
                      disabled={!pasteUrl.trim() || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        'Extract Recipe'
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
              </div>
            </div>
          )}

          {/* Option 2: Recipe Screenshot */}
          <button
            onClick={handleUploadImage}
            disabled={isProcessing}
            className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
              isProcessing && ocrProgress > 0
                ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <Upload className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isProcessing && ocrProgress > 0 ? 'text-primary' : 'text-gray-700'
              }`} />
              <div>
                <h3 className={`font-semibold text-base mb-1 ${
                  isProcessing && ocrProgress > 0 ? 'text-primary' : ''
                }`}>2. Recipe Screenshot</h3>
                <p className="text-sm text-gray-600">
                  {isProcessing && ocrProgress > 0 
                    ? `AI Processing... ${ocrProgress}%`
                    : 'Upload an image and AI reads the text'}
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: Manual Type */}
          <button
            onClick={handleManualEntry}
            disabled={isProcessing}
            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base mb-1">3. Manual Type</h3>
                <p className="text-sm text-gray-600">
                  Enter recipe details yourself
                </p>
              </div>
            </div>
          </button>
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
        
        {/* Debug Info */}
        <div className="px-6 py-2 bg-yellow-50 border-y border-yellow-200 text-xs font-mono">
          <div>🖼️ Images: {extractedImages.length}</div>
          <div>📦 Recipe data: {tempParsedRecipe ? '✅ Exists' : '❌ Missing'}</div>
          {extractedImages.map((url, i) => (
            <div key={i} className="truncate">
              Image {i + 1}: {url.substring(0, 30)}...
            </div>
          ))}
        </div>
        
        <div 
          className="flex-1 overflow-y-auto px-6 pb-6 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="grid grid-cols-2 gap-4 py-4">
            {extractedImages.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
                onClick={() => {
                  console.log(`🖱️ Clicked image ${index + 1}`);
                  handleImageSelected(imageUrl);
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Recipe option ${index + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    console.error(`❌ Failed to load image ${index + 1}`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log(`✅ Image ${index + 1} loaded successfully`);
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
            <Button variant="outline" onClick={() => {
              console.log('⏭️ Skip button clicked');
              handleSkipImageSelection();
            }}>
              Skip - Use Default
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* AI Error Dialog */}
    <AlertDialog open={showAiErrorDialog} onOpenChange={setShowAiErrorDialog}>
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-lg">AI Parsing Failed</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600 whitespace-pre-wrap break-words">
            {aiErrorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row-reverse">
          <AlertDialogAction onClick={handleRetryAiParsing} className="w-full">
            Try Again
          </AlertDialogAction>
          <AlertDialogCancel onClick={handleProceedManually} className="w-full">
            Proceed with Manual Input
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
}

