import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Upload, FileText, Edit, Loader2, Image as ImageIcon, Link } from 'lucide-react';
import { parseRecipeText } from '../../utils/recipeParser';
import { parseRecipeWithGemini, parseRecipeWithBilingualSupport } from '../../utils/geminiRecipeParser';
import Tesseract from 'tesseract.js';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  

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
      
      // Resize image for better OCR performance on mobile
      const resizedImage = await resizeImageForOCR(file);
      console.log('📸 Resized image size:', (resizedImage.size / 1024 / 1024).toFixed(2), 'MB');

      // Extract text from image with timeout
      console.log('🔍 Starting OCR text extraction...');
      const ocrTimeout = 90000; // 90 seconds timeout for mobile
      
      const ocrPromise = Tesseract.recognize(
        resizedImage,
        'eng+chi_sim',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
            console.log('OCR progress:', m.status, m.progress);
          }
        }
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR timeout - image processing took too long. Please try a smaller or clearer image.')), ocrTimeout);
      });

      const result = await Promise.race([ocrPromise, timeoutPromise]) as Tesseract.RecognizeResult;

      const extractedText = result.data.text;
      console.log('✅ Extracted text from image:', extractedText.substring(0, 200));

      if (!extractedText.trim()) {
        alert('No text found in the image. Please try a clearer image or paste the recipe text manually.');
        setIsProcessing(false);
        setOcrProgress(0);
        return;
      }

      // Parse the extracted text with AI (fallback to local parser if fails)
      let parsedRecipe;
      try {
        console.log('🤖 Attempting AI parsing with Gemini...');
        console.log('📝 Text length:', extractedText.length, 'characters');
        parsedRecipe = await parseRecipeWithGemini(extractedText);
        console.log('✅ AI parsing successful!');
      } catch (error: any) {
        console.warn('⚠️ AI parsing failed, using local parser:', error.message);
        console.error('Full error:', error);
        parsedRecipe = parseRecipeText(extractedText);
      }
      
      parsedRecipe.originalText = extractedText;
      parsedRecipe.image = imageDataUrl; // Store full image temporarily
      
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
      alert(`Failed to extract text from image: ${errorMessage}\n\nPlease try again or paste the text manually.`);
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
      
      // Parse the recipe text with AI (fallback to local parser if fails)
      let parsedRecipe;
      try {
        console.log('🤖 Attempting AI parsing with Gemini...');
        parsedRecipe = await parseRecipeWithGemini(pasteText);
        console.log('✅ AI parsing successful!');
      } catch (error: any) {
        console.warn('⚠️ AI parsing failed, using local parser:', error.message);
        parsedRecipe = parseRecipeText(pasteText);
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
      // Make sure to open it after state is updated
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
        console.warn('⚠️ AI parsing failed, using local parser:', error.message);
        parsedRecipe = parseRecipeText(extractedText);
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
              Upload a screenshot, paste a URL, or paste text, and our AI will extract the recipe.
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
                  Extracting text... {ocrProgress}%
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Screenshot/Image
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Recipe Image</DialogTitle>
          <DialogDescription>
            Choose an image to use as the recipe card display picture
          </DialogDescription>
        </DialogHeader>
        
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

