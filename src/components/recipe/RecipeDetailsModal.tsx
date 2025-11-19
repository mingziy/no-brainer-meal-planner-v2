import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
import { Edit, Clock, Heart, FileText, ExternalLink, Calculator, Languages } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { translateRecipe } from '../../utils/geminiRecipeParser';

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
    setSelectedRecipe,
  } = useApp();

  // Use prop if provided, otherwise use context
  const selectedRecipe = recipeProp || contextRecipe;
  const isOpen = recipeProp ? true : isRecipeDetailsModalOpen;
  
  // Save preferred display language when closing
  const handleClose = async () => {
    if (displayRecipe && displayRecipe.id) {
      try {
        // Update preferred display language in Firestore
        const recipeRef = doc(db, 'recipes', displayRecipe.id);
        await updateDoc(recipeRef, {
          preferredDisplayLanguage: showingTranslated ? 'translated' : 'original'
        });
        console.log('✅ Saved preferred display language:', showingTranslated ? 'translated' : 'original');
      } catch (error) {
        console.error('❌ Failed to save preferred display language:', error);
      }
    }
    
    // Call the original close handler
    if (onCloseProp) {
      onCloseProp();
    } else {
      setIsRecipeDetailsModalOpen(false);
    }
  };

  const [showOriginalText, setShowOriginalText] = useState(false);
  const [showNutritionReasoning, setShowNutritionReasoning] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showingTranslated, setShowingTranslated] = useState(false);
  
  // Local copy of recipe to update immediately after translation
  const [localRecipe, setLocalRecipe] = useState(selectedRecipe);
  
  // Update localRecipe when selectedRecipe changes (new recipe opened)
  useEffect(() => {
    if (selectedRecipe) {
      setLocalRecipe(selectedRecipe);
      // Set initial view based on user's last preference
      const hasTranslation = !!(selectedRecipe.nameTranslated && selectedRecipe.ingredientsTranslated);
      const shouldShowTranslated = hasTranslation && selectedRecipe.preferredDisplayLanguage === 'translated';
      setShowingTranslated(shouldShowTranslated);
      console.log('🔄 Recipe opened:', selectedRecipe.name, 'preferredDisplayLanguage:', selectedRecipe.preferredDisplayLanguage, 'showingTranslated:', shouldShowTranslated);
    }
  }, [selectedRecipe?.id]); // Only update when recipe ID changes
  
  // Use localRecipe for display (updated after translation)
  const displayRecipe = localRecipe || selectedRecipe;

  if (!displayRecipe) return null;
  
  // NEW Language System: Use translated version if available and user wants it
  const originalLanguage = displayRecipe.originalLanguage || 'en';
  const hasTranslation = !!(displayRecipe.nameTranslated && displayRecipe.ingredientsTranslated && displayRecipe.instructionsTranslated);
  const targetLanguage: 'en' | 'zh' = originalLanguage === 'en' ? 'zh' : 'en';
  
  // Determine what to display
  const displayName = (showingTranslated && hasTranslation) ? displayRecipe.nameTranslated : displayRecipe.name;
  const displayIngredients = (showingTranslated && hasTranslation && displayRecipe.ingredientsTranslated) 
    ? displayRecipe.ingredientsTranslated 
    : (displayRecipe.ingredients || []);
  const displayInstructions = (showingTranslated && hasTranslation && displayRecipe.instructionsTranslated) 
    ? displayRecipe.instructionsTranslated 
    : (displayRecipe.instructions || []);
  
  console.log('🔍 Recipe Details Display:', {
    originalLanguage,
    hasTranslation,
    showingTranslated,
    displayingName: displayName,
    hasIngredients: displayRecipe.ingredients?.length,
    hasInstructions: displayRecipe.instructions?.length,
    displayIngredientsLength: displayIngredients?.length,
    displayInstructionsLength: displayInstructions?.length,
    fullRecipe: displayRecipe,
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

  const handleTranslate = async () => {
    if (isTranslating) return;
    
    // If translation exists, just toggle display
    if (hasTranslation) {
      setShowingTranslated(!showingTranslated);
      return;
    }
    
    // Otherwise, translate the recipe
    try {
      setIsTranslating(true);
      console.log(`🌐 Translating recipe from ${originalLanguage} to ${targetLanguage}...`);
      
      const translated = await translateRecipe(
        {
          name: displayRecipe.name,
          ingredients: displayRecipe.ingredients,
          instructions: displayRecipe.instructions,
          cuisine: displayRecipe.cuisine,
          proteinType: displayRecipe.proteinType,
          mealType: displayRecipe.mealType,
        },
        originalLanguage,
        targetLanguage
      );
      
      // Update recipe in Firestore
      const recipeRef = doc(db, 'recipes', displayRecipe.id);
      await updateDoc(recipeRef, {
        nameTranslated: translated.nameTranslated,
        ingredientsTranslated: translated.ingredientsTranslated,
        instructionsTranslated: translated.instructionsTranslated,
        cuisineTranslated: translated.cuisineTranslated || '',
        proteinTypeTranslated: translated.proteinTypeTranslated || '',
        mealTypeTranslated: translated.mealTypeTranslated || '',
        translatedTo: targetLanguage,
        lastTranslated: new Date(),
        preferredDisplayLanguage: 'translated', // User wants to see translated version
      });
      
      console.log('✅ Recipe translated and saved (including tags)');
      
      // Update local state with translated version
      const updatedRecipe = {
        ...displayRecipe,
        nameTranslated: translated.nameTranslated,
        ingredientsTranslated: translated.ingredientsTranslated,
        instructionsTranslated: translated.instructionsTranslated,
        cuisineTranslated: translated.cuisineTranslated || '',
        proteinTypeTranslated: translated.proteinTypeTranslated || '',
        mealTypeTranslated: translated.mealTypeTranslated || '',
        translatedTo: targetLanguage,
        lastTranslated: new Date(),
        preferredDisplayLanguage: 'translated' as 'original' | 'translated',
      };
      
      setLocalRecipe(updatedRecipe);
      setSelectedRecipe(updatedRecipe); // Also update context
      setShowingTranslated(true); // Show the translated version
      
      console.log('✅ Local state updated with translation');
    } catch (error) {
      console.error('❌ Translation failed:', error);
      alert(t('details.translationFailed'));
    } finally {
      setIsTranslating(false);
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
                    displayRecipe.isFavorite
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
          <div className="flex gap-2 mt-3 flex-wrap">
            {/* Translation Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating}
              className={hasTranslation && showingTranslated ? 'border-orange-500 bg-orange-50' : ''}
            >
              <Languages className="w-4 h-4 mr-2" />
              {isTranslating
                ? t('details.translating')
                : hasTranslation && showingTranslated
                ? t('details.showOriginalButton')
                : t('details.translateButton')}
            </Button>

            {(displayRecipe.originalText || displayRecipe.sourceUrl || displayRecipe.nutritionCalculationReasoning) && (
              <>
                {displayRecipe.originalText && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowOriginalText(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('details.viewExtractedText')}
                  </Button>
                )}
                {displayRecipe.sourceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={displayRecipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('details.openOriginalWebsite')}
                    </a>
                  </Button>
                )}
                {displayRecipe.nutritionCalculationReasoning && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNutritionReasoning(true)}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('details.viewNutritionCalculation')}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Recipe Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <ImageWithFallback
                src={displayRecipe.image}
                alt={displayRecipe.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {/* Cuisines */}
              {(displayRecipe.cuisines || [displayRecipe.cuisine]).filter(Boolean).map((cuisine, idx) => (
                <Badge key={`cuisine-${idx}`} variant="default" style={{ backgroundColor: '#e9d5ff', color: '#1f2937' }}>
                  {cuisine}
                </Badge>
              ))}
              {/* Protein Types */}
              {(displayRecipe.proteinTypes || [displayRecipe.proteinType]).filter(Boolean).map((protein, idx) => (
                <Badge key={`protein-${idx}`} variant="default" style={{ backgroundColor: '#fed7aa', color: '#1f2937' }}>
                  {protein}
                </Badge>
              ))}
              {/* Meal Types */}
              {(displayRecipe.mealTypes || [displayRecipe.mealType]).filter(Boolean).map((meal, idx) => (
                <Badge key={`meal-${idx}`} variant="default" style={{ backgroundColor: '#bfdbfe', color: '#1f2937' }}>
                  {meal}
                </Badge>
              ))}
            </div>

            {/* Source URL */}
            {displayRecipe.sourceUrl && (
              <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 px-4 py-3 rounded">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      {t('details.source')}
                    </p>
                    <a
                      href={displayRecipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-words"
                    >
                      {displayRecipe.sourceUrl}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{t('library.prepTime')}: {displayRecipe.prepTime} min</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{t('library.cookTime')}: {displayRecipe.cookTime} min</span>
              </div>
            </div>

            {/* Nutrition Card */}
            {displayRecipe.nutrition && (
              <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                <h3 className="font-semibold text-lg mb-4 text-primary">{t('details.nutritionInfo')}</h3>
                
                {/* Servings and Calories - Top Row */}
                {displayRecipe.servings > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-primary/20">
                    <div className="text-center bg-background/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">{t('details.servings')}</p>
                      <p className="text-5xl font-bold text-primary">{displayRecipe.servings}</p>
                    </div>
                    {displayRecipe.caloriesPerServing > 0 && (
                      <div className="text-center bg-background/60 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">{t('details.calories')}</p>
                        <p className="text-5xl font-bold text-primary">{displayRecipe.caloriesPerServing}</p>
                        <p className="text-xs text-gray-500">{t('details.perServing')}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Macros and Nutrients - Two Column Layout with Proper Spacing */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  {/* Left Column */}
                  <div className="space-y-2 pr-4">
                    {/* Protein */}
                    {displayRecipe.nutrition.protein && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                        <span className="text-gray-700 font-semibold flex-shrink-0">{t('details.protein')}</span>
                        <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                          <span className="font-bold text-primary">{displayRecipe.nutrition.protein}g</span>
                          {displayRecipe.nutrition.proteinDV && (
                            <span className="text-xs text-gray-500">({displayRecipe.nutrition.proteinDV}%)</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Fats */}
                    {displayRecipe.nutrition.fat && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                        <span className="text-gray-700 font-semibold flex-shrink-0">{t('details.fats')}</span>
                        <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                          <span className="font-bold text-primary">{displayRecipe.nutrition.fat}g</span>
                          {displayRecipe.nutrition.fatDV && (
                            <span className="text-xs text-gray-500">({displayRecipe.nutrition.fatDV}%)</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Iron */}
                    {displayRecipe.nutrition.iron && (
                      <div className="flex items-center justify-between py-2" style={{ gap: '12px' }}>
                        <span className="text-gray-700 font-semibold flex-shrink-0">{t('details.iron')}</span>
                        <span className="font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">{displayRecipe.nutrition.iron}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-2 pl-4">
                    {/* Carbs */}
                    {displayRecipe.nutrition.carbs && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                        <span className="text-gray-700 font-semibold flex-shrink-0">{t('details.carbs')}</span>
                        <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                          <span className="font-bold text-primary">{displayRecipe.nutrition.carbs}g</span>
                          {displayRecipe.nutrition.carbsDV && (
                            <span className="text-xs text-gray-500">({displayRecipe.nutrition.carbsDV}%)</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Fiber */}
                    {displayRecipe.nutrition.fiber && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                        <span className="text-gray-700 font-semibold flex-shrink-0">{t('details.fiber')}</span>
                        <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                          <span className="font-bold text-primary">{displayRecipe.nutrition.fiber}g</span>
                          {displayRecipe.nutrition.fiberDV && (
                            <span className="text-xs text-gray-500">({displayRecipe.nutrition.fiberDV}%)</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Calcium */}
                    {displayRecipe.nutrition.calcium && (
                      <div className="flex items-center justify-between py-2" style={{ gap: '12px' }}>
                        <span className="text-gray-700 font-semibold flex-shrink-0">{t('details.calcium')}</span>
                        <span className="font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">{displayRecipe.nutrition.calcium}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
{displayRecipe.originalText}</pre>
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
              {displayRecipe.nutritionCalculationReasoning}
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

