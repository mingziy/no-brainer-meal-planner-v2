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
import { Textarea } from '../ui/textarea';
import { Upload, FileText, Edit, Loader2 } from 'lucide-react';
import { parseRecipeText } from '../../utils/recipeParser';

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

  const handleClose = () => {
    setIsAddRecipeModalOpen(false);
    setShowPasteInput(false);
    setPasteText('');
  };

  const handleUploadImage = () => {
    // In a real app, this would open the device's image picker
    alert('Upload image functionality - would open device image picker in a real app.\n\nFor now, try "Paste Recipe Text" to see the simulated AI extraction!');
  };

  const handlePasteRecipe = async () => {
    if (pasteText.trim()) {
      setIsProcessing(true);
      
      // Simulate AI processing delay (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Parse the recipe text using our simulated AI
      const parsedRecipe = parseRecipeText(pasteText);
      console.log('Parsed recipe data:', parsedRecipe);
      
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
    <Dialog open={isAddRecipeModalOpen} onOpenChange={setIsAddRecipeModalOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a New Recipe</DialogTitle>
          <DialogDescription>
            Choose how you'd like to add your recipe
          </DialogDescription>
        </DialogHeader>

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
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Screenshot/Image
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
  );
}

