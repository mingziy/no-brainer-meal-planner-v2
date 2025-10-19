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
import { Upload, FileText, Edit } from 'lucide-react';

export function AddRecipeModal() {
  const { isAddRecipeModalOpen, setIsAddRecipeModalOpen, setIsRecipeEditFormOpen } = useApp();
  const [pasteText, setPasteText] = useState('');
  const [showPasteInput, setShowPasteInput] = useState(false);

  const handleClose = () => {
    setIsAddRecipeModalOpen(false);
    setShowPasteInput(false);
    setPasteText('');
  };

  const handleUploadImage = () => {
    // In a real app, this would open the device's image picker
    alert('Upload image functionality - would open device image picker');
    // For now, we'll just open the edit form
    handleClose();
    setIsRecipeEditFormOpen(true);
  };

  const handlePasteRecipe = () => {
    if (pasteText.trim()) {
      // In a real app, this would send to AI for processing
      alert('AI Processing would happen here. For demo, opening edit form.');
      handleClose();
      setIsRecipeEditFormOpen(true);
    }
  };

  const handleManualEntry = () => {
    handleClose();
    setIsRecipeEditFormOpen(true);
  };

  return (
    <Dialog open={isAddRecipeModalOpen} onOpenChange={setIsAddRecipeModalOpen}>
      <DialogContent className="sm:max-w-md">
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
              >
                <FileText className="mr-2 h-4 w-4" />
                Paste Recipe Text
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste recipe URL or text here..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handlePasteRecipe}
                    disabled={!pasteText.trim()}
                    className="flex-1"
                  >
                    Process with AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasteInput(false);
                      setPasteText('');
                    }}
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

