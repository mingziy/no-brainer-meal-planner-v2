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
import { Badge } from '../ui/badge';
import { Edit, Clock, Heart, FileText, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function RecipeDetailsModal() {
  const {
    selectedRecipe,
    isRecipeDetailsModalOpen,
    setIsRecipeDetailsModalOpen,
    setIsRecipeEditFormOpen,
    toggleFavorite,
  } = useApp();

  const [showOriginalText, setShowOriginalText] = useState(false);

  if (!selectedRecipe) return null;

  const handleEdit = () => {
    setIsRecipeDetailsModalOpen(false);
    setIsRecipeEditFormOpen(true);
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(selectedRecipe.id, selectedRecipe.isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <>
    <Dialog open={isRecipeDetailsModalOpen} onOpenChange={setIsRecipeDetailsModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="recipe-details-description">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl pr-8">{selectedRecipe.name}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="shrink-0"
              >
                <Heart
                  className={`w-5 h-5 ${
                    selectedRecipe.isFavorite
                      ? 'text-red-500 fill-red-500'
                      : 'text-gray-400'
                  }`}
                />
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
          <DialogDescription id="recipe-details-description" className="sr-only">
            View detailed recipe information including ingredients, instructions, and nutrition facts.
          </DialogDescription>
          
          {/* Action Buttons - Below Title */}
          {(selectedRecipe.originalText || selectedRecipe.sourceUrl) && (
            <div className="flex gap-2 mt-3">
              {selectedRecipe.originalText && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowOriginalText(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Extracted Text
                </Button>
              )}
              {selectedRecipe.sourceUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={selectedRecipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Original Website
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Recipe Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <ImageWithFallback
                src={selectedRecipe.image}
                alt={selectedRecipe.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Cuisine and Categories */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{selectedRecipe.cuisine}</Badge>
              {selectedRecipe.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>

            {/* Time */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>Prep: {selectedRecipe.prepTime} min</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>Cook: {selectedRecipe.cookTime} min</span>
              </div>
            </div>

            {/* Visual Plate Composition */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Plate Composition</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-orange-500"
                    style={{ width: `${selectedRecipe.plateComposition.protein}%` }}
                  />
                  <div
                    className="bg-green-500"
                    style={{ width: `${selectedRecipe.plateComposition.veggies}%` }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${selectedRecipe.plateComposition.carbs}%` }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${selectedRecipe.plateComposition.fats}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded" />
                  <span>Protein: {selectedRecipe.plateComposition.protein}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Veggies: {selectedRecipe.plateComposition.veggies}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span>Carbs: {selectedRecipe.plateComposition.carbs}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>Fats: {selectedRecipe.plateComposition.fats}%</span>
                </div>
              </div>
            </div>

            {/* Nutrition Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Nutrition per Serving</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Protein:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.protein}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.fat}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.carbs}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Fiber:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.fiber}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Iron:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.iron}</span>
                </div>
                <div>
                  <span className="text-gray-600">Calcium:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.calcium}</span>
                </div>
              </div>
            </div>

            {/* Portion Guidance */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Portion Guidance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Adult:</span>
                  <span className="font-medium">{selectedRecipe.portions.adult}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Child (5 years):</span>
                  <span className="font-medium">{selectedRecipe.portions.child5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Child (2 years):</span>
                  <span className="font-medium">{selectedRecipe.portions.child2}</span>
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Instructions</h3>
              <ol className="space-y-3">
                {selectedRecipe.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm flex gap-3">
                    <span className="font-semibold text-primary shrink-0">
                      {index + 1}.
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Original Recipe Text Dialog */}
    <Dialog open={showOriginalText} onOpenChange={setShowOriginalText}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="original-text-description">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle>Original Recipe Text</DialogTitle>
          <DialogDescription id="original-text-description">
            The raw text extracted from your uploaded image or pasted content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-md border font-mono">
{selectedRecipe.originalText}</pre>
        </div>
        
        <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end">
          <Button variant="outline" onClick={() => setShowOriginalText(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

