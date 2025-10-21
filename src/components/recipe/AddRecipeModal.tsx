import { useState, useRef } from 'react';
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
import { Upload, FileText, Edit, Loader2, Image as ImageIcon } from 'lucide-react';
import { parseRecipeText } from '../../utils/recipeParser';
import { parseRecipeWithGemini } from '../../utils/geminiRecipeParser';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  const handleClose = () => {
    setIsAddRecipeModalOpen(false);
    setShowPasteInput(false);
    setPasteText('');
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      // Convert image to data URL
      const reader = new FileReader();
      const imageDataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // Extract text from image
      const result = await Tesseract.recognize(
        file,
        'eng+chi_sim',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const extractedText = result.data.text;
      console.log('Extracted text from image:', extractedText);

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
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to extract text from image. Please try again or paste the text manually.');
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

  const handleManualEntry = () => {
    handleClose();
    setIsRecipeEditFormOpen(true);
  };

  return (
    <>
    <Dialog open={isAddRecipeModalOpen} onOpenChange={setIsAddRecipeModalOpen}>
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
                onChange={handleImageSelected}
                className="hidden"
              />

              <div className="space-y-4 py-4">
          {/* Option 1: AI Extraction */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">
              Option 1: AI Extraction (Primary)
            </h3>
            <p className="text-sm text-gray-600">
              Upload a screenshot or paste a link/text, and our AI will do the rest.
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

    </>
  );
}

