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
import { Edit, Clock, Heart, FileText, ExternalLink, Calculator } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface RecipeDetailsModalProps {
  recipe?: any; // Optional prop, if not provided, use context
  onClose?: () => void; // Optional close handler
}

export function RecipeDetailsModal({ recipe: recipeProp, onClose: onCloseProp }: RecipeDetailsModalProps = {}) {
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
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  if (!selectedRecipe) return null;
  
  const displayName = selectedRecipe.name;
  const displayIngredients = selectedRecipe.ingredients;
  const displayInstructions = selectedRecipe.instructions;

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

  const toggleIngredient = (ingredientId: string) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const toggleStep = (stepIndex: number) => {
    setCheckedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      return newSet;
    });
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
                Edit Recipe
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
              {selectedRecipe.nutritionCalculationReasoning && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNutritionReasoning(true)}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  View Nutrition Calculation
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
                      Source
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
                <span>Prep Time: {selectedRecipe.prepTime} min</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>Cook Time: {selectedRecipe.cookTime} min</span>
              </div>
            </div>

            {/* Nutrition Card */}
            <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-primary">Nutrition Info</h3>
              
              {/* Servings and Calories - Top Row */}
              {selectedRecipe.servings > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-primary/20">
                  <div className="text-center bg-background/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Servings</p>
                    <p className="text-5xl font-bold text-primary">{selectedRecipe.servings}</p>
                  </div>
                  {selectedRecipe.caloriesPerServing > 0 && (
                    <div className="text-center bg-background/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Calories</p>
                      <p className="text-5xl font-bold text-primary">{selectedRecipe.caloriesPerServing}</p>
                      <p className="text-xs text-gray-500">per serving</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Macros and Nutrients - Two Column Layout with Proper Spacing */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                {/* Left Column */}
                <div className="space-y-2 pr-4">
                  {/* Protein */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                    <span className="text-gray-700 font-semibold flex-shrink-0">Protein</span>
                    <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                      <span className="font-bold text-primary">{selectedRecipe.nutrition.protein}g</span>
                      {selectedRecipe.nutrition.proteinDV && (
                        <span className="text-xs text-gray-500">({selectedRecipe.nutrition.proteinDV}%)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Fats */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                    <span className="text-gray-700 font-semibold flex-shrink-0">Fats</span>
                    <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                      <span className="font-bold text-primary">{selectedRecipe.nutrition.fat}g</span>
                      {selectedRecipe.nutrition.fatDV && (
                        <span className="text-xs text-gray-500">({selectedRecipe.nutrition.fatDV}%)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Iron */}
                  <div className="flex items-center justify-between py-2" style={{ gap: '12px' }}>
                    <span className="text-gray-700 font-semibold flex-shrink-0">Iron</span>
                    <span className="font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">{selectedRecipe.nutrition.iron}</span>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-2 pl-4">
                  {/* Carbs */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                    <span className="text-gray-700 font-semibold flex-shrink-0">Carbs</span>
                    <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                      <span className="font-bold text-primary">{selectedRecipe.nutrition.carbs}g</span>
                      {selectedRecipe.nutrition.carbsDV && (
                        <span className="text-xs text-gray-500">({selectedRecipe.nutrition.carbsDV}%)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Fiber */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-200" style={{ gap: '12px' }}>
                    <span className="text-gray-700 font-semibold flex-shrink-0">Fiber</span>
                    <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0">
                      <span className="font-bold text-primary">{selectedRecipe.nutrition.fiber}g</span>
                      {selectedRecipe.nutrition.fiberDV && (
                        <span className="text-xs text-gray-500">({selectedRecipe.nutrition.fiberDV}%)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Calcium */}
                  <div className="flex items-center justify-between py-2" style={{ gap: '12px' }}>
                    <span className="text-gray-700 font-semibold flex-shrink-0">Calcium</span>
                    <span className="font-semibold text-gray-700 whitespace-nowrap flex-shrink-0">{selectedRecipe.nutrition.calcium}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {displayIngredients.map((ingredient) => {
                  const isChecked = checkedIngredients.has(ingredient.id);
                  return (
                    <li 
                      key={ingredient.id} 
                      className="text-sm flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                      onClick={() => toggleIngredient(ingredient.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleIngredient(ingredient.id)}
                        className="mt-0.5 w-4 h-4 cursor-pointer accent-green-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`break-words ${isChecked ? 'line-through text-gray-400' : ''}`}>
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Instructions */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Instructions</h3>
              <ol className="space-y-3">
                {displayInstructions.map((instruction, index) => {
                  const isChecked = checkedSteps.has(index);
                  return (
                    <li 
                      key={index} 
                      className="text-sm flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                      onClick={() => toggleStep(index)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStep(index)}
                        className="mt-0.5 w-4 h-4 cursor-pointer accent-green-600 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-semibold text-primary shrink-0">
                        {index + 1}.
                      </span>
                      <span className={`break-words ${isChecked ? 'line-through text-gray-400' : ''}`}>
                        {instruction}
                      </span>
                    </li>
                  );
                })}
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

