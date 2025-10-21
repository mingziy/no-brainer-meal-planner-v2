import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Recipe, Ingredient, RecipeCategory, RecipeCuisine } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Trash2, Upload, Crop, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

export function RecipeEditForm() {
  const {
    selectedRecipe,
    draftRecipe,
    setDraftRecipe,
    isRecipeEditFormOpen,
    setIsRecipeEditFormOpen,
    addRecipe,
    updateRecipe,
    setSelectedRecipe,
  } = useApp();

  // Form state
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [cuisine, setCuisine] = useState<RecipeCuisine>('Other');
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [nutrition, setNutrition] = useState({
    protein: 0,
    fiber: 0,
    fat: 0,
    carbs: 0,
    iron: 'Moderate',
    calcium: 'Moderate',
  });
  const [plateComposition, setPlateComposition] = useState({
    protein: 25,
    veggies: 25,
    carbs: 25,
    fats: 25,
  });
  const [portions, setPortions] = useState({
    adult: '',
    child5: '',
    child2: '',
  });
  const [originalText, setOriginalText] = useState<string | undefined>(undefined);
  
  // Cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Available options
  const cuisineOptions: RecipeCuisine[] = [
    'Korean',
    'Chinese',
    'Italian',
    'American',
    'Mexican',
    'Japanese',
    'Other',
  ];

  const categoryOptions: RecipeCategory[] = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Kid-Friendly',
    'Batch-Cook Friendly',
  ];

  const mineralOptions = ['Low', 'Moderate', 'Good Source', 'Excellent'];

  // Track if we've loaded the draft to prevent re-running
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  // Debug: Log when imageToCrop changes
  useEffect(() => {
    console.log('📸 imageToCrop state changed:', imageToCrop ? `Has image (${imageToCrop.substring(0, 50)}...)` : 'null');
  }, [imageToCrop]);

  // Initialize form with selected recipe data or draft
  useEffect(() => {
    if (isRecipeEditFormOpen) {
      if (draftRecipe && !hasLoadedDraft) {
        // Use AI-extracted draft data
        setName(draftRecipe.name || '');
        setImage(draftRecipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop');
        setCuisine(draftRecipe.cuisine || 'Other');
        setCategories(draftRecipe.categories || []);
        setPrepTime(draftRecipe.prepTime || 0);
        setCookTime(draftRecipe.cookTime || 0);
        setIngredients(draftRecipe.ingredients || [{ id: '1', amount: '', unit: '', name: '' }]);
        setInstructions(draftRecipe.instructions || ['']);
        setNutrition(draftRecipe.nutrition || {
          protein: 0,
          fiber: 0,
          fat: 0,
          carbs: 0,
          iron: 'Moderate',
          calcium: 'Moderate',
        });
        setPlateComposition(draftRecipe.plateComposition || { protein: 25, veggies: 25, carbs: 25, fats: 25 });
        setPortions(draftRecipe.portions || { adult: '', child5: '', child2: '' });
        setOriginalText(draftRecipe.originalText); // Capture originalText before draft is cleared
        
        // Store original image for cropping if available
        if ((draftRecipe as any).originalImageForCropping) {
          setImageToCrop((draftRecipe as any).originalImageForCropping);
        }
        
        // Mark as loaded and clear draft
        setHasLoadedDraft(true);
        setDraftRecipe(null);
      } else if (selectedRecipe) {
        // Edit existing recipe
        setName(selectedRecipe.name);
        setImage(selectedRecipe.image);
        setCuisine(selectedRecipe.cuisine);
        setCategories(selectedRecipe.categories);
        setPrepTime(selectedRecipe.prepTime);
        setCookTime(selectedRecipe.cookTime);
        setIngredients(selectedRecipe.ingredients);
        setInstructions(selectedRecipe.instructions);
        setNutrition(selectedRecipe.nutrition);
        setPlateComposition(selectedRecipe.plateComposition);
        setPortions(selectedRecipe.portions);
        setOriginalText(selectedRecipe.originalText); // Preserve originalText when editing
      } else if (!hasLoadedDraft) {
        // Reset form for new manual recipe
        resetForm();
      }
    } else {
      // Reset the hasLoadedDraft flag when form closes
      setHasLoadedDraft(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipe, draftRecipe, isRecipeEditFormOpen]);

  const resetForm = () => {
    setName('');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop');
    setCuisine('Other');
    setCategories([]);
    setPrepTime(0);
    setCookTime(0);
    setIngredients([{ id: '1', amount: '', unit: '', name: '' }]);
    setInstructions(['']);
    setNutrition({
      protein: 0,
      fiber: 0,
      fat: 0,
      carbs: 0,
      iron: 'Moderate',
      calcium: 'Moderate',
    });
    setPlateComposition({ protein: 25, veggies: 25, carbs: 25, fats: 25 });
    setPortions({ adult: '', child5: '', child2: '' });
    setOriginalText(undefined);
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: String(ingredients.length + 1), amount: '', unit: '', name: '' },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleUpdateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    setInstructions(instructions.map((inst, i) => (i === index ? value : inst)));
  };

  const handleToggleCategory = (category: RecipeCategory) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleSave = async () => {
    try {
      const recipeData: any = {
        name,
        image,
        cuisine,
        categories,
        prepTime,
        cookTime,
        ingredients: ingredients.filter((ing) => ing.name.trim() !== ''),
        instructions: instructions.filter((inst) => inst.trim() !== ''),
        nutrition,
        plateComposition,
        portions,
        isFavorite: selectedRecipe?.isFavorite || false,
      };

      // Only include originalText if it exists (Firestore doesn't accept undefined)
      if (originalText) {
        recipeData.originalText = originalText;
      }

      if (selectedRecipe) {
        // Update existing recipe in Firebase
        await updateRecipe(selectedRecipe.id, recipeData);
      } else {
        // Add new recipe to Firebase
        await addRecipe(recipeData as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>);
      }

      setIsRecipeEditFormOpen(false);
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleImageUpload = () => {
    alert('Image upload functionality - would open device image picker');
  };

  const handleCropImage = () => {
    console.log('🖼️ imageToCrop:', imageToCrop ? 'Image available' : 'No image');
    console.log('🖼️ imageToCrop length:', imageToCrop?.length);
    if (imageToCrop) {
      setShowCropModal(true);
    } else {
      alert('No image available to crop. Please upload an image with text extraction first.');
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Failed to get canvas context');

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

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedImageDataUrl = await createCroppedImage(imageToCrop, croppedAreaPixels);
      setImage(croppedImageDataUrl);
      setShowCropModal(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  return (
    <>
    <Dialog open={isRecipeEditFormOpen} onOpenChange={setIsRecipeEditFormOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="recipe-form-description">
        <DialogHeader>
          <DialogTitle>
            {selectedRecipe ? 'Edit Recipe' : 'Add New Recipe'}
          </DialogTitle>
          <DialogDescription id="recipe-form-description">
            {selectedRecipe 
              ? 'Update the recipe details below.' 
              : 'Fill in the recipe information. AI-extracted data can be adjusted as needed.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            {/* Recipe Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Garlic Chicken"
              />
            </div>

            {/* Recipe Photo */}
            <div className="space-y-2">
              <Label>Recipe Photo</Label>
              <div className="flex gap-2">
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleImageUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                {imageToCrop && (
                  <Button variant="outline" onClick={handleCropImage}>
                    <Crop className="w-4 h-4 mr-2" />
                    Crop Image
                  </Button>
                )}
              </div>
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Ingredients Section */}
            <div className="space-y-2">
              <Label>Ingredients</Label>
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex gap-2 items-start">
                    <Input
                      placeholder="Amount"
                      value={ingredient.amount}
                      onChange={(e) =>
                        handleUpdateIngredient(ingredient.id, 'amount', e.target.value)
                      }
                      className="w-20"
                    />
                    <Input
                      placeholder="Unit"
                      value={ingredient.unit}
                      onChange={(e) =>
                        handleUpdateIngredient(ingredient.id, 'unit', e.target.value)
                      }
                      className="w-24"
                    />
                    <Input
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) =>
                        handleUpdateIngredient(ingredient.id, 'name', e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIngredient(ingredient.id)}
                      disabled={ingredients.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddIngredient}>
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            {/* Instructions Section */}
            <div className="space-y-2">
              <Label>Instructions</Label>
              <div className="space-y-2">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-sm font-medium mt-3">{index + 1}.</span>
                    <Textarea
                      value={instruction}
                      onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                      placeholder="Describe this step..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveInstruction(index)}
                      disabled={instructions.length === 1}
                      className="mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddInstruction}>
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">Details</h3>

              {/* Cuisine */}
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Select value={cuisine} onValueChange={(value) => setCuisine(value as RecipeCuisine)}>
                  <SelectTrigger id="cuisine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <Badge
                      key={category}
                      variant={categories.includes(category) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleToggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Nutrition Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Nutrition (Auto-Calculated)</h3>
                <p className="text-sm text-gray-600">
                  We've estimated the nutrition based on the ingredients. You can adjust
                  these values if needed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={nutrition.protein}
                    onChange={(e) =>
                      setNutrition({ ...nutrition, protein: Number(e.target.value) })
                    }
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={nutrition.fat}
                    onChange={(e) =>
                      setNutrition({ ...nutrition, fat: Number(e.target.value) })
                    }
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={nutrition.carbs}
                    onChange={(e) =>
                      setNutrition({ ...nutrition, carbs: Number(e.target.value) })
                    }
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiber">Fiber (g)</Label>
                  <Input
                    id="fiber"
                    type="number"
                    value={nutrition.fiber}
                    onChange={(e) =>
                      setNutrition({ ...nutrition, fiber: Number(e.target.value) })
                    }
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iron">Iron</Label>
                  <Select
                    value={nutrition.iron}
                    onValueChange={(value) => setNutrition({ ...nutrition, iron: value })}
                  >
                    <SelectTrigger id="iron">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mineralOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calcium">Calcium</Label>
                  <Select
                    value={nutrition.calcium}
                    onValueChange={(value) =>
                      setNutrition({ ...nutrition, calcium: value })
                    }
                  >
                    <SelectTrigger id="calcium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mineralOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Portion Guidance */}
            <div className="space-y-4">
              <h3 className="font-semibold">Portion Guidance</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="adultPortion">Adult Portion</Label>
                  <Input
                    id="adultPortion"
                    value={portions.adult}
                    onChange={(e) => setPortions({ ...portions, adult: e.target.value })}
                    placeholder="e.g., 1.5 cups"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child5Portion">Child (5 years) Portion</Label>
                  <Input
                    id="child5Portion"
                    value={portions.child5}
                    onChange={(e) => setPortions({ ...portions, child5: e.target.value })}
                    placeholder="e.g., 3/4 cup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child2Portion">Child (2 years) Portion</Label>
                  <Input
                    id="child2Portion"
                    value={portions.child2}
                    onChange={(e) => setPortions({ ...portions, child2: e.target.value })}
                    placeholder="e.g., 1/2 cup"
                  />
                </div>
              </div>
            </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background border-t pt-4 pb-2">
          <Button variant="outline" onClick={() => setIsRecipeEditFormOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Image Cropping Modal */}
    <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop Recipe Image</DialogTitle>
          <DialogDescription>
            Select the area of the image you want to use as the recipe photo
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          {imageToCrop ? (
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No image to crop
            </div>
          )}
        </div>

        <div className="space-y-4 flex-shrink-0">
          {/* Zoom Control */}
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
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCropConfirm}
              disabled={isCropping}
              className="flex-1"
            >
              {isCropping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cropping...
                </>
              ) : (
                <>
                  <Crop className="mr-2 h-4 w-4" />
                  Apply Crop
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCropCancel}
              disabled={isCropping}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

