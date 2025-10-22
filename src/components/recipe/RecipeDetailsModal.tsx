import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation('recipe');
  const {
    selectedRecipe,
    isRecipeDetailsModalOpen,
    setIsRecipeDetailsModalOpen,
    setIsRecipeEditFormOpen,
    toggleFavorite,
  } = useApp();

  const [showOriginalText, setShowOriginalText] = useState(false);

  if (!selectedRecipe) return null;
  
  // Bilingual support: use Chinese version if available and current language is Chinese
  const isChineseMode = i18n.language === 'zh';
  const displayName = (isChineseMode && selectedRecipe.nameZh) ? selectedRecipe.nameZh : selectedRecipe.name;
  const displayIngredients = (isChineseMode && selectedRecipe.ingredientsZh) ? selectedRecipe.ingredientsZh : selectedRecipe.ingredients;
  const displayInstructions = (isChineseMode && selectedRecipe.instructionsZh) ? selectedRecipe.instructionsZh : selectedRecipe.instructions;
  
  console.log('🔍 Recipe Details Display:', {
    currentLanguage: i18n.language,
    isChineseMode,
    hasChineseName: !!selectedRecipe.nameZh,
    displayingName: displayName,
    englishName: selectedRecipe.name,
    chineseName: selectedRecipe.nameZh
  });

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
            <DialogTitle className="text-2xl pr-8">{displayName}</DialogTitle>
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
                {t('details.editButton')}
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
                  {t('details.viewExtractedText')}
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
                    {t('details.openOriginalWebsite')}
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
                <span>{t('library.prepTime')}: {selectedRecipe.prepTime} min</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{t('library.cookTime')}: {selectedRecipe.cookTime} min</span>
              </div>
            </div>

            {/* Visual Plate Composition */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t('details.plateComposition')}</h3>
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
                  <span>{t('details.protein')}: {selectedRecipe.plateComposition.protein}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>{t('details.veggies')}: {selectedRecipe.plateComposition.veggies}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span>{t('details.carbs')}: {selectedRecipe.plateComposition.carbs}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>{t('details.fats')}: {selectedRecipe.plateComposition.fats}%</span>
                </div>
              </div>
            </div>

            {/* Nutrition Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t('details.nutritionPerServing')}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">{t('details.protein')}:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.protein}g</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('details.fats')}:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.fat}g</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('details.carbs')}:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.carbs}g</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('details.fiber')}:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.fiber}g</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('details.iron')}:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.iron}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('details.calcium')}:</span>{' '}
                  <span className="font-medium">{selectedRecipe.nutrition.calcium}</span>
                </div>
              </div>
            </div>

            {/* Portion Guidance */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t('details.portionGuidance')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('details.adult')}:</span>
                  <span className="font-medium">{selectedRecipe.portions.adult}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('details.child5')}:</span>
                  <span className="font-medium">{selectedRecipe.portions.child5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('details.child2')}:</span>
                  <span className="font-medium">{selectedRecipe.portions.child2}</span>
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t('details.ingredients')}</h3>
              <ul className="space-y-2">
                {displayIngredients.map((ingredient) => (
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
              <h3 className="font-semibold mb-3">{t('details.instructions')}</h3>
              <ol className="space-y-3">
                {displayInstructions.map((instruction, index) => (
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
          <DialogTitle>{t('details.originalRecipeText')}</DialogTitle>
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
            {t('details.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

