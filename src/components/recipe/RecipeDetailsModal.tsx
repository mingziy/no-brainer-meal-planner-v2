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
import { Edit, Clock, Heart, FileText, ExternalLink, Calculator } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface RecipeDetailsModalProps {
  recipe?: any; // Optional prop, if not provided, use context
  onClose?: () => void; // Optional close handler
}

export function RecipeDetailsModal({ recipe: recipeProp, onClose: onCloseProp }: RecipeDetailsModalProps = {}) {
  const { t, i18n } = useTranslation('recipe');
  const {
    selectedRecipe: contextRecipe,
    isRecipeDetailsModalOpen,
    setIsRecipeDetailsModalOpen,
    setIsRecipeEditFormOpen,
    toggleFavorite,
  } = useApp();

  // Use prop if provided, otherwise use context
  const selectedRecipe = recipeProp || contextRecipe;
  const isOpen = recipeProp ? true : isRecipeDetailsModalOpen;
  const handleClose = onCloseProp || (() => setIsRecipeDetailsModalOpen(false));

  const [showOriginalText, setShowOriginalText] = useState(false);
  const [showNutritionReasoning, setShowNutritionReasoning] = useState(false);

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
          {(selectedRecipe.originalText || selectedRecipe.sourceUrl || selectedRecipe.nutritionCalculationReasoning) && (
            <div className="flex gap-2 mt-3 flex-wrap">
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
              {selectedRecipe.nutritionCalculationReasoning && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNutritionReasoning(true)}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {t('details.viewNutritionCalculation')}
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

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {/* Cuisines */}
              {(selectedRecipe.cuisines || [selectedRecipe.cuisine]).filter(Boolean).map((cuisine, idx) => (
                <Badge key={`cuisine-${idx}`} variant="default" style={{ backgroundColor: '#e9d5ff', color: '#1f2937' }}>
                  {cuisine}
                </Badge>
              ))}
              {/* Protein Types */}
              {(selectedRecipe.proteinTypes || [selectedRecipe.proteinType]).filter(Boolean).map((protein, idx) => (
                <Badge key={`protein-${idx}`} variant="default" style={{ backgroundColor: '#fed7aa', color: '#1f2937' }}>
                  {protein}
                </Badge>
              ))}
              {/* Meal Types */}
              {(selectedRecipe.mealTypes || [selectedRecipe.mealType]).filter(Boolean).map((meal, idx) => (
                <Badge key={`meal-${idx}`} variant="default" style={{ backgroundColor: '#bfdbfe', color: '#1f2937' }}>
                  {meal}
                </Badge>
              ))}
            </div>

            {/* Source URL */}
            {selectedRecipe.sourceUrl && (
              <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 px-4 py-3 rounded">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      {t('details.source')}
                    </p>
                    <a
                      href={selectedRecipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-words"
                    >
                      {selectedRecipe.sourceUrl}
                    </a>
                  </div>
                </div>
              </div>
            )}

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

            {/* Nutrition Card */}
            <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-primary">{t('details.nutritionInfo')}</h3>
              
              {/* Servings and Calories - Top Row */}
              {selectedRecipe.servings > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-primary/20">
                  <div className="text-center bg-background/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">{t('details.servings')}</p>
                    <p className="text-5xl font-bold text-primary">{selectedRecipe.servings}</p>
                  </div>
                  {selectedRecipe.caloriesPerServing > 0 && (
                    <div className="text-center bg-background/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">{t('details.calories')}</p>
                      <p className="text-5xl font-bold text-primary">{selectedRecipe.caloriesPerServing}</p>
                      <p className="text-xs text-gray-500">{t('details.perServing')}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Macros and Nutrients */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-bold">{t('details.protein')}</span>
                  <span className="font-bold text-primary">
                    {selectedRecipe.nutrition.protein}g
                    {selectedRecipe.nutrition.proteinDV && (
                      <span className="text-xs ml-1">({selectedRecipe.nutrition.proteinDV}%)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-bold">{t('details.carbs')}</span>
                  <span className="font-bold text-primary">
                    {selectedRecipe.nutrition.carbs}g
                    {selectedRecipe.nutrition.carbsDV && (
                      <span className="text-xs ml-1">({selectedRecipe.nutrition.carbsDV}%)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-bold">{t('details.fats')}</span>
                  <span className="font-bold text-primary">
                    {selectedRecipe.nutrition.fat}g
                    {selectedRecipe.nutrition.fatDV && (
                      <span className="text-xs ml-1">({selectedRecipe.nutrition.fatDV}%)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-bold">{t('details.fiber')}</span>
                  <span className="font-bold text-primary">
                    {selectedRecipe.nutrition.fiber}g
                    {selectedRecipe.nutrition.fiberDV && (
                      <span className="text-xs ml-1">({selectedRecipe.nutrition.fiberDV}%)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-bold">{t('details.iron')}</span>
                  <span className="font-semibold text-gray-700">{selectedRecipe.nutrition.iron}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-bold">{t('details.calcium')}</span>
                  <span className="font-semibold text-gray-700">{selectedRecipe.nutrition.calcium}</span>
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

    {/* Nutrition Calculation Reasoning Dialog */}
    <Dialog open={showNutritionReasoning} onOpenChange={setShowNutritionReasoning}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="nutrition-reasoning-description">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <DialogTitle>AI Calculation Logic</DialogTitle>
          </div>
          <DialogDescription id="nutrition-reasoning-description">
            AI explanation of how serving size, calories, and nutrition values were calculated.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-[60vh] overflow-y-auto overflow-x-hidden w-full">
            <pre 
              className="text-xs font-mono text-gray-800 dark:text-gray-200 w-full" 
              style={{ 
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word', 
                wordBreak: 'break-word',
                maxWidth: '100%',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {selectedRecipe.nutritionCalculationReasoning}
            </pre>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>This calculation is AI-generated and may not be 100% accurate. Always consult nutrition labels or professional guidance for precise dietary needs.</span>
            </p>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end">
          <Button variant="outline" onClick={() => setShowNutritionReasoning(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

