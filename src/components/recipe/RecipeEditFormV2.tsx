import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Recipe, Ingredient } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { ArrowLeft, ArrowRight, Plus, Trash2, Camera, Loader2 } from 'lucide-react';
import { useRecipes } from '../../hooks/useRecipes';
import { toast } from 'sonner';

type Step = 'recipe' | 'calories' | 'tags';

export function RecipeEditFormV2() {
  const { 
    isRecipeEditFormOpen, 
    setIsRecipeEditFormOpen,
    draftRecipe,
    setDraftRecipe,
    selectedRecipe,
    setSelectedRecipe,
    user,
    pendingTodayMealSelection
  } = useApp();
  
  const { addRecipe, updateRecipe } = useRecipes(user?.uid || null);
  
  const [currentStep, setCurrentStep] = useState<Step>('recipe');
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1: Recipe data
  const [recipeName, setRecipeName] = useState('');
  const [recipeImage, setRecipeImage] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  
  // Step 2: Calorie data
  const [servings, setServings] = useState(4);
  const [caloriesPerServing, setCaloriesPerServing] = useState(0);
  const [calculationReasoning, setCalculationReasoning] = useState('');
  
  // Step 3: Tags (now support multiple selections)
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [proteinTypes, setProteinTypes] = useState<string[]>([]);
  const [mealTypes, setMealTypes] = useState<string[]>([]);
  const [cuisineInput, setCuisineInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [mealTypeInput, setMealTypeInput] = useState('');
  
  // Get AI-suggested tags from the recipe (ONLY AI-extracted tags)
  const getAiSuggestedCuisines = () => {
    const recipe = draftRecipe || selectedRecipe;
    return recipe?.cuisine ? [recipe.cuisine] : [];
  };
  
  const getAiSuggestedProteins = () => {
    const recipe = draftRecipe || selectedRecipe;
    return recipe?.proteinType ? [recipe.proteinType] : [];
  };
  
  const getAiSuggestedMealTypes = () => {
    const recipe = draftRecipe || selectedRecipe;
    return recipe?.mealType ? [recipe.mealType] : [];
  };
  
  const cuisineSuggestions = getAiSuggestedCuisines();
  const proteinSuggestions = getAiSuggestedProteins();
  const mealTypeSuggestions = getAiSuggestedMealTypes();
  
  // Initialize form with draft or selected recipe
  useEffect(() => {
    if (isRecipeEditFormOpen) {
      const recipe = draftRecipe || selectedRecipe;
      if (recipe) {
        console.log('🏷️ Recipe data:', { 
          cuisine: recipe.cuisine, 
          proteinType: recipe.proteinType, 
          mealType: recipe.mealType 
        });
        
        setRecipeName(recipe.name || '');
        setRecipeImage(recipe.image || '');
        setIngredients(recipe.ingredients || [{ id: '1', amount: '', unit: '', name: '' }]);
        setInstructions(recipe.instructions || ['']);
        setServings(recipe.servings || 4);
        setCaloriesPerServing(recipe.caloriesPerServing || 0);
        setCalculationReasoning(recipe.nutritionCalculationReasoning || '');
        
        // Don't auto-select - let AI tags appear as suggestions only
        setCuisines([]);
        setProteinTypes([]);
        setMealTypes([]);
        setCuisineInput('');
        setProteinInput('');
        setMealTypeInput('');
      }
      setCurrentStep('recipe');
    }
  }, [isRecipeEditFormOpen, draftRecipe, selectedRecipe]);
  
  const handleClose = () => {
    console.log('🔴 RecipeEditFormV2: handleClose called');
    setIsRecipeEditFormOpen(false);
    setDraftRecipe(null);
    setSelectedRecipe(null);
    setCurrentStep('recipe');
    console.log('🔴 RecipeEditFormV2: Closed, isRecipeEditFormOpen set to false');
  };
  
  const handleNextStep = () => {
    if (currentStep === 'recipe') {
      setCurrentStep('calories');
    } else if (currentStep === 'calories') {
      setCurrentStep('tags');
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep === 'calories') {
      setCurrentStep('recipe');
    } else if (currentStep === 'tags') {
      setCurrentStep('calories');
    }
  };
  
  const addIngredient = () => {
    const newId = String(ingredients.length + 1);
    setIngredients([...ingredients, { id: newId, amount: '', unit: '', name: '' }]);
  };
  
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };
  
  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };
  
  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };
  
  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };
  
  const updateInstruction = (index: number, value: string) => {
    setInstructions(instructions.map((inst, i) => i === index ? value : inst));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRecipeImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Tag management functions
  const addCuisineTag = (tag: string) => {
    console.log('🏷️ addCuisineTag called with:', tag);
    const trimmed = tag.trim();
    console.log('🏷️ trimmed:', trimmed);
    console.log('🏷️ current cuisines:', cuisines);
    console.log('🏷️ already includes?', cuisines.includes(trimmed));
    if (trimmed && !cuisines.includes(trimmed)) {
      const newCuisines = [...cuisines, trimmed];
      console.log('🏷️ Setting new cuisines:', newCuisines);
      setCuisines(newCuisines);
      setCuisineInput('');
    } else {
      console.log('🏷️ Tag NOT added - either empty or duplicate');
    }
  };
  
  const removeCuisineTag = (tag: string) => {
    setCuisines(cuisines.filter(t => t !== tag));
  };
  
  const addProteinTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !proteinTypes.includes(trimmed)) {
      setProteinTypes([...proteinTypes, trimmed]);
      setProteinInput('');
    }
  };
  
  const removeProteinTag = (tag: string) => {
    setProteinTypes(proteinTypes.filter(t => t !== tag));
  };
  
  const addMealTypeTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !mealTypes.includes(trimmed)) {
      setMealTypes([...mealTypes, trimmed]);
      setMealTypeInput('');
    }
  };
  
  const removeMealTypeTag = (tag: string) => {
    setMealTypes(mealTypes.filter(t => t !== tag));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, addFn: (tag: string) => void, value: string) => {
    if ((e.key === ' ' || e.key === 'Enter') && value.trim()) {
      e.preventDefault();
      addFn(value);
    }
  };
  
  const handleSaveRecipe = async () => {
    // Validation
    if (!recipeName.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }
    if (cuisines.length === 0 || proteinTypes.length === 0 || mealTypes.length === 0) {
      toast.error('Please add at least one tag for each category');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const recipe = draftRecipe || selectedRecipe;
      const recipeData: Partial<Recipe> = {
        name: recipeName,
        image: recipeImage || 'https://via.placeholder.com/400x300?text=No+Image',
        // Store first tag as primary for backwards compatibility
        cuisine: cuisines[0] || '',
        proteinType: proteinTypes[0] || '',
        mealType: mealTypes[0] || '',
        // Store all tags
        cuisines: cuisines,
        proteinTypes: proteinTypes,
        mealTypes: mealTypes,
        servings,
        caloriesPerServing,
        ingredients: ingredients.filter(ing => ing.name.trim()),
        instructions: instructions.filter(inst => inst.trim()),
        nutritionCalculationReasoning: calculationReasoning,
        nutrition: recipe?.nutrition || {
          protein: 0,
          fiber: 0,
          fat: 0,
          carbs: 0,
          iron: 'Moderate',
          calcium: 'Moderate',
        },
        plateComposition: recipe?.plateComposition || {
          protein: 25,
          veggies: 25,
          carbs: 25,
          fats: 25,
        },
        isFavorite: recipe?.isFavorite || false,
        originalText: recipe?.originalText,
        sourceUrl: recipe?.sourceUrl,
        nameZh: recipe?.nameZh,
        ingredientsZh: recipe?.ingredientsZh,
        instructionsZh: recipe?.instructionsZh,
      };
      
      if (selectedRecipe?.id) {
        // Update existing recipe
        await updateRecipe(selectedRecipe.id, recipeData);
        toast.success('Recipe updated!');
      } else {
        // Create new recipe
        await addRecipe(recipeData as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Recipe saved!');
      }
      
      handleClose();
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      const errorMessage = error?.message || 'Failed to save recipe';
      toast.error(`Error saving recipe: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderStepIndicator = () => {
    const steps: { key: Step; label: string; number: number }[] = [
      { key: 'recipe', label: 'Recipe', number: 1 },
      { key: 'calories', label: 'Calories', number: 2 },
      { key: 'tags', label: 'Tags', number: 3 },
    ];
    
    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-2 ${currentStep === step.key ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                currentStep === step.key ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {step.number}
              </div>
              <span className="text-sm hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-muted" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return (
    <Dialog open={isRecipeEditFormOpen} onOpenChange={setIsRecipeEditFormOpen}>
      <DialogContent className="max-w-md p-6 gap-4" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'recipe' && 'Confirm Recipe'}
            {currentStep === 'calories' && 'Confirm Calories'}
            {currentStep === 'tags' && 'Add Tags'}
          </DialogTitle>
        </DialogHeader>
        
        {renderStepIndicator()}
        
        <div style={{ 
          overflowY: 'scroll', 
          WebkitOverflowScrolling: 'touch',
          flex: 1,
          minHeight: 0
        }}>
          {/* STEP 1: Recipe Confirmation */}
          {currentStep === 'recipe' && (
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Image</label>
                {recipeImage ? (
                  <div className="relative">
                    <img src={recipeImage} alt="Recipe" className="w-full h-48 object-cover rounded-lg" />
                    <label htmlFor="image-upload" className="absolute bottom-2 right-2 bg-white/90 p-2 rounded-full cursor-pointer hover:bg-white shadow-lg">
                      <Camera className="w-5 h-5" />
                    </label>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload image</span>
                  </label>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              
              {/* Recipe Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Name</label>
                <Input
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Enter recipe name"
                />
              </div>
              
              {/* Ingredients */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ingredients</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addIngredient}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ing, index) => (
                    <div key={ing.id} className="flex gap-2 items-start">
                      <Input
                        placeholder="Amount"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(ing.id, 'amount', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Ingredient"
                        value={ing.name}
                        onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      {ingredients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(ing.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Cooking Steps</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addInstruction}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {instructions.map((inst, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="text-sm text-muted-foreground mt-2">{index + 1}.</span>
                      <Textarea
                        placeholder="Step description"
                        value={inst}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      {instructions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* STEP 2: Calorie Confirmation */}
          {currentStep === 'calories' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <span className="text-4xl">🍽️</span>
                <h3 className="font-semibold mt-2">Servings & Calories</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Servings</label>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  min={1}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Calories per Serving</label>
                <Input
                  type="number"
                  value={caloriesPerServing}
                  onChange={(e) => setCaloriesPerServing(Number(e.target.value))}
                  min={0}
                />
              </div>
              
              {calculationReasoning && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">🤖 AI Calculation Logic</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">{calculationReasoning}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* STEP 3: Tagging */}
          {currentStep === 'tags' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-4xl">🏷️</span>
                <h3 className="font-semibold mt-2">Add Tags</h3>
                <p className="text-xs text-gray-500 mt-1">You can select multiple tags for each category</p>
              </div>
              
              {/* Cuisine */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Cuisine</label>
                {console.log('🎨 Rendering cuisines:', cuisines)}
                
                {/* Input Field with Selected Tags Inside */}
                <div className="min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Selected Tags */}
                    {cuisines.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#e9d5ff', color: '#1f2937' }}
                      >
                        {tag}
                        <button
                          onClick={() => removeCuisineTag(tag)}
                          className="text-gray-600 hover:text-gray-900 text-base leading-none ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {/* Input */}
                    <input
                      type="text"
                      value={cuisineInput}
                      onChange={(e) => setCuisineInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, addCuisineTag, cuisineInput)}
                      placeholder={cuisines.length === 0 ? "Type to search or add cuisine..." : ""}
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-700 placeholder:text-gray-400 text-sm"
                    />
                  </div>
                </div>
                
                {/* Suggested Cuisines */}
                {cuisineSuggestions.filter(s => !cuisines.includes(s)).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Suggested cuisines:</p>
                    <div className="flex flex-wrap gap-2">
                      {cuisineSuggestions.filter(s => !cuisines.includes(s)).map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => addCuisineTag(suggestion)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
                          style={{ backgroundColor: '#e9d5ff', color: '#1f2937' }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Protein Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Protein Type</label>
                
                {/* Input Field with Selected Tags Inside */}
                <div className="min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Selected Tags */}
                    {proteinTypes.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#fed7aa', color: '#1f2937' }}
                      >
                        {tag}
                        <button
                          onClick={() => removeProteinTag(tag)}
                          className="text-gray-600 hover:text-gray-900 text-base leading-none ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {/* Input */}
                    <input
                      type="text"
                      value={proteinInput}
                      onChange={(e) => setProteinInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, addProteinTag, proteinInput)}
                      placeholder={proteinTypes.length === 0 ? "Type to search or add protein..." : ""}
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-700 placeholder:text-gray-400 text-sm"
                    />
                  </div>
                </div>
                
                {/* Suggested Proteins */}
                {proteinSuggestions.filter(s => !proteinTypes.includes(s)).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Suggested proteins:</p>
                    <div className="flex flex-wrap gap-2">
                      {proteinSuggestions.filter(s => !proteinTypes.includes(s)).map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => addProteinTag(suggestion)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
                          style={{ backgroundColor: '#fed7aa', color: '#1f2937' }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Meal Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Meal Type</label>
                
                {/* Input Field with Selected Tags Inside */}
                <div className="min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Selected Tags */}
                    {mealTypes.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#bfdbfe', color: '#1f2937' }}
                      >
                        {tag}
                        <button
                          onClick={() => removeMealTypeTag(tag)}
                          className="text-gray-600 hover:text-gray-900 text-base leading-none ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {/* Input */}
                    <input
                      type="text"
                      value={mealTypeInput}
                      onChange={(e) => setMealTypeInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, addMealTypeTag, mealTypeInput)}
                      placeholder={mealTypes.length === 0 ? "Type to search or add meal type..." : ""}
                      className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-700 placeholder:text-gray-400 text-sm"
                    />
                  </div>
                </div>
                
                {/* Suggested Meal Types */}
                {mealTypeSuggestions.filter(s => !mealTypes.includes(s)).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Suggested meal types:</p>
                    <div className="flex flex-wrap gap-2">
                      {mealTypeSuggestions.filter(s => !mealTypes.includes(s)).map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => addMealTypeTag(suggestion)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
                          style={{ backgroundColor: '#bfdbfe', color: '#1f2937' }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {currentStep !== 'recipe' && (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep !== 'tags' ? (
            <Button
              onClick={handleNextStep}
              className="flex-1"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSaveRecipe}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                '✓ Save Recipe'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

