import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, ArrowRight, Plus, Trash2, Camera, Loader2, Sparkles } from 'lucide-react';
import { useRecipes } from '../../hooks/useRecipes';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Step = 'image' | 'recipe' | 'calories' | 'tags';

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
  
  const [currentStep, setCurrentStep] = useState<Step>('image');
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 0: Image selection
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [imageExtractionFailed, setImageExtractionFailed] = useState(false);
  const [failedImageCount, setFailedImageCount] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  // Step 1: Recipe data
  const [recipeName, setRecipeName] = useState('');
  const [recipeImage, setRecipeImage] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  
  // Step 2: Calorie data
  const [servings, setServings] = useState(4);
  const [caloriesPerServing, setCaloriesPerServing] = useState(0);
  const [calculationReasoning, setCalculationReasoning] = useState('');
  const [isCalculatingCalories, setIsCalculatingCalories] = useState(false);
  const [calculatedNutrition, setCalculatedNutrition] = useState<any>(null);
  
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
    if (!isRecipeEditFormOpen) {
      // Modal is closed, don't populate anything
      return;
    }
    
    const recipe = draftRecipe || selectedRecipe;
    if (recipe) {
      
      setRecipeName(recipe.name || '');
      setRecipeImage(recipe.image || '');
      
      // Check if this is from URL extraction with multiple images
      const isFromUrlExtraction = (recipe as any).sourceUrl;
      const extractedImages = (recipe as any).extractedImages || [];
      
      console.log('🎨 RecipeEditFormV2 - Recipe data:', {
        hasSourceUrl: !!isFromUrlExtraction,
        extractedImagesCount: extractedImages.length,
        recipeImage: recipe.image,
        extractedImages: extractedImages
      });
      
      // Set available images for selection
      const images = [];
      if (isFromUrlExtraction && extractedImages.length > 0) {
        // URL extraction: use all extracted images
        images.push(...extractedImages);
        console.log('🌐 URL extraction detected, using', extractedImages.length, 'images');
        setImageExtractionFailed(false);
      } else if ((recipe as any).originalImageForCropping) {
        // Screenshot upload: use the uploaded image for cropping
        images.push((recipe as any).originalImageForCropping);
        console.log('📸 Screenshot upload detected');
        setImageExtractionFailed(false);
      } else if (recipe.image) {
        images.push(recipe.image);
        console.log('🖼️ Single image detected');
        setImageExtractionFailed(false);
      } else if (isFromUrlExtraction) {
        // URL extraction attempted but no images found
        console.warn('⚠️ URL extraction failed - no images extracted');
        setImageExtractionFailed(true);
      }
      setAvailableImages(images);
      
      // Set imageToCrop based on extraction method
      if (isFromUrlExtraction && recipe.image) {
        // URL extraction: set to selected image (for display in grid)
        setImageToCrop(recipe.image);
        setShowCropper(false); // Don't show cropper for URL extraction
      } else if (images.length > 0) {
        // Screenshot/Manual: Auto-open cropper if we have an image
        setImageToCrop(images[0]);
        setShowCropper(true);
      }
      
      setIngredients(recipe.ingredients || [{ id: '1', amount: '', unit: '', name: '' }]);
      setInstructions(recipe.instructions || ['']);
      setServings(recipe.servings || 4);
      setCaloriesPerServing(recipe.caloriesPerServing || 0);
      setCalculationReasoning(recipe.nutritionCalculationReasoning || '');
      
      setCuisines(recipe.cuisine ? [recipe.cuisine] : []);
      // Use proteinTypesArray if available (multiple proteins), otherwise use single proteinType
      const proteinTypesToLoad = (recipe as any).proteinTypesArray || (recipe.proteinType ? [recipe.proteinType] : []);
      setProteinTypes(proteinTypesToLoad);
      setMealTypes(recipe.mealType ? [recipe.mealType] : []);
      setCuisineInput('');
      setProteinInput('');
      setMealTypeInput('');
      
      // Always start at image step - let user select/confirm image
      setCurrentStep('image');
    } else {
      // No recipe data - this is a fresh manual upload - reset to empty state
      setAvailableImages([]);
      setImageToCrop('');
      setRecipeName('');
      setRecipeImage('');
      setIngredients([{ id: '1', amount: '', unit: '', name: '' }]);
      setInstructions(['']);
      setServings(4);
      setCaloriesPerServing(0);
      setCalculationReasoning('');
      setCuisines([]);
      setProteinTypes([]);
      setMealTypes([]);
      setCurrentStep('image');
    }
  }, [isRecipeEditFormOpen, draftRecipe, selectedRecipe]);
  
  const handleClose = () => {
    // Clear draft/selected recipe FIRST to prevent useEffect from repopulating
    setDraftRecipe(null);
    setSelectedRecipe(null);
    
    // Reset all form state
    setAvailableImages([]);
    setImageExtractionFailed(false);
    setFailedImageCount(0);
    setShowCropper(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    
    setRecipeName('');
    setRecipeImage('');
    setIngredients([{ id: '1', amount: '', unit: '', name: '' }]);
    setInstructions(['']);
    
    setServings(4);
    setCaloriesPerServing(0);
    setCalculationReasoning('');
    setCalculatedNutrition(null);
    
    setCuisines([]);
    setProteinTypes([]);
    setMealTypes([]);
    setCuisineInput('');
    setProteinInput('');
    setMealTypeInput('');
    
    setCurrentStep('image');
    setIsRecipeEditFormOpen(false);
  };
  
  const handleNextStep = async () => {
    // If on image step, save the crop before proceeding
    if (currentStep === 'image') {
      // Check if image is from URL (external) or data URL (uploaded)
      const isExternalUrl = imageToCrop && (imageToCrop.startsWith('http://') || imageToCrop.startsWith('https://'));
      
      if (isExternalUrl) {
        // For external URLs (from recipe URL extraction), skip cropping and use directly
        console.log('📸 Using external URL image directly (skipping crop):', imageToCrop);
        setRecipeImage(imageToCrop);
        setCurrentStep('recipe');
      } else if (imageToCrop && croppedAreaPixels) {
        // For uploaded images (data URLs), crop them
        try {
          console.log('✂️ Cropping uploaded image...');
          const croppedImage = await createCroppedImage(imageToCrop, croppedAreaPixels);
          setRecipeImage(croppedImage);
          toast.success('Image cropped!');
          setCurrentStep('recipe');
        } catch (error) {
          console.error('Error cropping image:', error);
          toast.error('Failed to crop image. Please try uploading again.');
          return; // Don't proceed if crop fails
        }
      } else if (!imageToCrop) {
        // No image selected, proceed anyway
        console.log('⚠️ No image selected, proceeding anyway');
        setCurrentStep('recipe');
      } else {
        // Has image but no crop area yet
        toast.error('Please adjust the crop area before continuing');
        return;
      }
    } else if (currentStep === 'recipe') {
      setCurrentStep('calories');
    } else if (currentStep === 'calories') {
      setCurrentStep('tags');
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep === 'recipe') {
      setCurrentStep('image');
    } else if (currentStep === 'calories') {
      setCurrentStep('recipe');
    } else if (currentStep === 'tags') {
      setCurrentStep('calories');
    }
  };
  
  // Cropping functions
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Enable CORS for external images
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(new Error('Failed to load image'));
      image.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleCropImage = (imageUrl: string) => {
    setImageToCrop(imageUrl);
    setShowCropper(true);
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    try {
      const croppedImage = await createCroppedImage(imageToCrop, croppedAreaPixels);
      setRecipeImage(croppedImage);
      setShowCropper(false);
      setImageToCrop('');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      toast.success('Image cropped successfully!');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
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

  const handleCalculateCaloriesWithAI = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      toast.error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
      return;
    }

    // Validate that we have recipe data
    if (!recipeName || ingredients.length === 0) {
      toast.error('Please add recipe name and ingredients first');
      return;
    }

    setIsCalculatingCalories(true);
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Format ingredients and instructions for AI
      const ingredientsText = ingredients
        .filter(ing => ing.name.trim())
        .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`.trim())
        .join('\n');
      
      const instructionsText = instructions
        .filter(inst => inst.trim())
        .map((inst, idx) => `${idx + 1}. ${inst}`)
        .join('\n');

      const prompt = `Calculate the complete nutrition information for this recipe. Return ONLY valid JSON (no markdown, no explanations).

Recipe: ${recipeName}
Servings: ${servings}

Ingredients:
${ingredientsText}

${instructionsText ? `Instructions:\n${instructionsText}` : ''}

Required JSON structure:
{
  "caloriesPerServing": 350,
  "nutrition": {
    "protein": 30,
    "carbs": 40,
    "fat": 15,
    "fiber": 5,
    "iron": "Moderate",
    "calcium": "Moderate"
  },
  "nutritionCalculationReasoning": "Detailed explanation of your calculation including: 1) How you determined serving size, 2) How you calculated calories and macros per serving with specific values for each major ingredient, 3) Sources or reasoning (cite USDA data, nutrition databases, or standard values)"
}

IMPORTANT:
- protein, carbs, fat, fiber: provide values in GRAMS per serving
- iron, calcium: provide as "Low", "Moderate", or "High"
- nutritionCalculationReasoning: explain your calculation methodology

Return ONLY the JSON, no other text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Parse JSON response
      let jsonText = text;
      if (text.includes('```json')) {
        jsonText = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        jsonText = text.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonText);
      
      // Update calorie data
      setCaloriesPerServing(parsed.caloriesPerServing || 0);
      setCalculationReasoning(parsed.nutritionCalculationReasoning || '');
      
      // Store nutrition data
      if (parsed.nutrition) {
        const nutritionData = {
          protein: parsed.nutrition.protein || 0,
          carbs: parsed.nutrition.carbs || 0,
          fat: parsed.nutrition.fat || 0,
          fiber: parsed.nutrition.fiber || 0,
          iron: parsed.nutrition.iron || 'Moderate',
          calcium: parsed.nutrition.calcium || 'Moderate',
        };
        setCalculatedNutrition(nutritionData);
        // DO NOT update draftRecipe in manual entry mode
        // The nutrition will be saved from calculatedNutrition state when user saves
      }
      
      toast.success('Calories and nutrition calculated successfully!');
    } catch (error) {
      console.error('❌ Error calculating calories with AI:', error);
      toast.error('Failed to calculate nutrition. Please enter manually.');
    } finally {
      setIsCalculatingCalories(false);
    }
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
    console.log('🚀 ========== SAVE RECIPE STARTED ==========');
    console.log('📝 Recipe name:', recipeName);
    console.log('🖼️ Recipe image:', recipeImage ? 'Set (' + recipeImage.substring(0, 50) + '...)' : 'Not set');
    console.log('🥘 Ingredients count:', ingredients.length);
    console.log('📋 Instructions count:', instructions.length);
    console.log('🍽️ Servings:', servings);
    console.log('🔥 Calories per serving:', caloriesPerServing);
    console.log('🏷️ Cuisines:', cuisines);
    console.log('🥩 Protein types:', proteinTypes);
    console.log('🍴 Meal types:', mealTypes);
    console.log('👤 User:', user ? user.uid : 'NO USER');
    
    // Validation
    if (!recipeName.trim()) {
      console.error('❌ Validation failed: No recipe name');
      toast.error('Please enter a recipe name');
      return;
    }
    
    console.log('✅ Validation passed');
    setIsSaving(true);
    console.log('⏳ isSaving set to true');
    
    try {
      const recipe = draftRecipe || selectedRecipe;
      console.log('📦 Base recipe:', recipe);
      
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
        nutrition: calculatedNutrition || recipe?.nutrition || {
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
      };
      
      // Only add optional fields if they exist (Firestore doesn't accept undefined)
      if (calculationReasoning) {
        recipeData.nutritionCalculationReasoning = calculationReasoning;
      }
      if (recipe?.originalText) {
        recipeData.originalText = recipe.originalText;
      }
      if (recipe?.sourceUrl) {
        recipeData.sourceUrl = recipe.sourceUrl;
      }
      if (recipe?.nameZh) {
        recipeData.nameZh = recipe.nameZh;
      }
      if (recipe?.ingredientsZh && recipe.ingredientsZh.length > 0) {
        recipeData.ingredientsZh = recipe.ingredientsZh;
      }
      if (recipe?.instructionsZh && recipe.instructionsZh.length > 0) {
        recipeData.instructionsZh = recipe.instructionsZh;
      }
      
      console.log('💾 Recipe data prepared:', JSON.stringify(recipeData, null, 2));
      
      // Check if recipe is in Chinese and translate to create bilingual version
      const containsChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
      const hasChineseContent = containsChinese(recipeName) || 
                                ingredients.some(ing => containsChinese(ing.name)) ||
                                instructions.some(inst => containsChinese(inst));
      
      if (hasChineseContent && !recipe?.nameZh) {
        // Recipe is in Chinese but doesn't have English translation yet
        console.log('🌐 Detected Chinese recipe, creating bilingual version...');
        try {
          const { translateRecipeToEnglish } = await import('../../utils/geminiRecipeParser');
          const translation = await translateRecipeToEnglish(
            ingredients.filter(ing => ing.name.trim()),
            instructions.filter(inst => inst.trim()),
            recipeName
          );
          
          // Store Chinese as the "Zh" version
          recipeData.nameZh = recipeName;
          recipeData.ingredientsZh = ingredients.filter(ing => ing.name.trim());
          recipeData.instructionsZh = instructions.filter(inst => inst.trim());
          
          // Store English as the main version
          recipeData.name = translation.nameEn;
          recipeData.ingredients = translation.ingredientsEn;
          recipeData.instructions = translation.instructionsEn;
          
          console.log('✅ Bilingual recipe created:', {
            chinese: recipeName,
            english: translation.nameEn
          });
        } catch (error) {
          console.error('❌ Translation failed, saving as Chinese-only:', error);
          // Keep original Chinese version if translation fails
        }
      }
      
      if (selectedRecipe?.id) {
        // Update existing recipe
        console.log('🔄 Updating existing recipe with ID:', selectedRecipe.id);
        await updateRecipe(selectedRecipe.id, recipeData);
        console.log('✅ Recipe updated successfully');
        toast.success('Recipe updated!');
      } else {
        // Create new recipe
        console.log('➕ Creating new recipe...');
        console.log('🔍 addRecipe function:', addRecipe ? 'Available' : 'NOT AVAILABLE');
        const result = await addRecipe(recipeData as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>);
        console.log('✅ Recipe created successfully. Result:', result);
        toast.success('Recipe saved!');
      }
      
      console.log('🎉 Save completed, calling handleClose...');
      handleClose();
      console.log('✅ ========== SAVE RECIPE COMPLETED ==========');
    } catch (error: any) {
      console.error('❌ ========== ERROR SAVING RECIPE ==========');
      console.error('❌ Error object:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error stack:', error?.stack);
      const errorMessage = error?.message || 'Failed to save recipe';
      toast.error(`Error saving recipe: ${errorMessage}`);
    } finally {
      console.log('🏁 Finally block: setting isSaving to false');
      setIsSaving(false);
    }
  };
  
  const renderStepIndicator = () => {
    const steps: { key: Step; label: string; number: number }[] = [
      { key: 'image', label: 'Image', number: 1 },
      { key: 'recipe', label: 'Recipe', number: 2 },
      { key: 'calories', label: 'Calories', number: 3 },
      { key: 'tags', label: 'Tags', number: 4 },
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
    <Dialog open={isRecipeEditFormOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-md p-6 gap-4" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'image' && 'Select Recipe Image'}
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
          {/* STEP 0: Image Selection */}
          {currentStep === 'image' && (
            <div className="space-y-4">
              {/* Show error message if image extraction failed or all images failed to load */}
              {(imageExtractionFailed || (availableImages.length > 0 && failedImageCount >= availableImages.length)) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-2">Image Extraction Failed</h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        We couldn't extract images from this URL (the website blocked access with a 403 Forbidden error).
                      </p>
                      {/* Upload button prominently displayed in error box */}
                      <input
                        id="recipe-image-upload-error"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              setImageToCrop(imageUrl);
                              setAvailableImages([imageUrl]);
                              setImageExtractionFailed(false);
                              setCrop({ x: 0, y: 0 });
                              setZoom(1);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <label htmlFor="recipe-image-upload-error" className="flex-1">
                          <Button
                            type="button"
                            variant="default"
                            className="w-full"
                            asChild
                          >
                            <span>
                              <Camera className="w-4 h-4 mr-2" />
                              Upload Image
                            </span>
                          </Button>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setImageExtractionFailed(false);
                            setImageToCrop('');
                            setRecipeImage('');
                          }}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Check if this is URL extraction (multiple images to select from) */}
              {availableImages.length > 1 ? (
                // URL extraction: Show image grid selector
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Select a recipe image (from {availableImages.length} found images)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {availableImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          console.log('Image selected:', imgUrl);
                          setImageToCrop(imgUrl);
                          setRecipeImage(imgUrl);
                        }}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all bg-gray-100 ${
                          imageToCrop === imgUrl
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ aspectRatio: '1' }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Recipe option ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            console.error('Failed to load image:', imgUrl);
                            setFailedImageCount(prev => prev + 1);
                            // Show a gray placeholder instead of sample food image
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.image-placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'image-placeholder w-full h-full flex items-center justify-center bg-gray-200 text-gray-500';
                              placeholder.innerHTML = '<div class="text-center"><div class="text-2xl mb-1">🖼️</div><div class="text-xs">Failed to load</div></div>';
                              parent.appendChild(placeholder);
                            }
                          }}
                          onLoad={() => console.log('Image loaded successfully:', imgUrl.substring(0, 50))}
                        />
                        {imageToCrop === imgUrl && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {imageToCrop && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ✓ Selected image will be used for your recipe
                    </p>
                  )}
                </>
              ) : imageToCrop && (imageToCrop.startsWith('http://') || imageToCrop.startsWith('https://')) ? (
                // Single external URL image - show preview only (no cropping due to CORS)
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Recipe image from URL (cropping not available for external images)
                  </p>
                  <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-square">
                    <img 
                      src={imageToCrop} 
                      alt="Recipe" 
                      className="w-full h-full object-cover"
                      // Only add crossOrigin for non-AI-chatbot extractions
                      // AI chatbot images come from external sites with CORS restrictions
                      {...((draftRecipe as any)?.sourceUrl && availableImages.length === 1 ? {} : { crossOrigin: 'anonymous' })}
                      onError={(e) => {
                        console.error('Failed to load external image:', imageToCrop);
                        // Fallback for AI chatbot extraction images that fail
                        if ((draftRecipe as any)?.sourceUrl && availableImages.length === 1) {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.image-fallback')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-fallback w-full h-full flex items-center justify-center bg-gray-200 text-gray-500';
                            placeholder.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">🖼️</div><div class="text-sm font-medium">Image preview unavailable</div><div class="text-xs mt-1">Image will be processed when you save</div></div>';
                            parent.appendChild(placeholder);
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ This image will be used for your recipe
                  </p>
                </>
              ) : (
                // Uploaded image - show cropper
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Move the picture to position the square crop area where you want
                  </p>
                  
                  <div 
                    className="relative w-full rounded-lg overflow-hidden bg-black aspect-square"
                  >
                    {imageToCrop ? (
                      <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        showGrid={false}
                        objectFit="cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Camera className="w-12 h-12 opacity-50 mb-2" />
                        <p className="text-sm">No image to crop</p>
                        <p className="text-xs mt-1">Upload a recipe card image below</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full"
                      disabled={!imageToCrop}
                    />
                  </div>
                </>
              )}
              
              {/* Upload Button - only show for manual entry/screenshot */}
              {availableImages.length <= 1 && (
                <div className="space-y-2">
                  <input
                    id="recipe-card-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const imageUrl = event.target?.result as string;
                          setImageToCrop(imageUrl);
                          setAvailableImages([imageUrl]);
                          // Reset crop state
                          setCrop({ x: 0, y: 0 });
                          setZoom(1);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="recipe-card-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        {imageToCrop ? 'Change Recipe Card Image' : 'Upload Recipe Card Image'}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          )}
          
          {/* STEP 1: Recipe Confirmation */}
          {currentStep === 'recipe' && (
            <div className="space-y-4">
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
                    type="button"
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
                          type="button"
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
                    type="button"
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
                          type="button"
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

              {/* AI Calculate Button - Right after servings */}
              <Button
                type="button"
                onClick={handleCalculateCaloriesWithAI}
                disabled={isCalculatingCalories || !recipeName || ingredients.length === 0}
                variant="outline"
                className="w-full"
              >
                {isCalculatingCalories ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {calculationReasoning ? 'Recalculate' : 'Calculate'} Calories with AI
                  </>
                )}
              </Button>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Calories per Serving</label>
                <Input
                  type="number"
                  value={caloriesPerServing}
                  onChange={(e) => setCaloriesPerServing(Number(e.target.value))}
                  min={0}
                />
              </div>
              
              {calculationReasoning ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">🤖 AI Calculation Logic</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200"
                      style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordWrap: 'break-word', 
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {calculationReasoning}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-amber-800">No calorie calculation available</p>
                      <p className="text-xs text-amber-700 mt-1">
                        AI could not extract ingredient information to calculate calories. Please enter the values manually.
                      </p>
                    </div>
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
          {currentStep !== 'image' && (
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

