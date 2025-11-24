import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Recipe, RecipeCategory, RecipeCuisine } from '../../types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Plus, Heart, Clock, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';
export function RecipeLibraryScreen() {
  const { t, i18n } = useTranslation('recipe');
  const {
    recipes,
    setSelectedRecipe,
    setIsRecipeDetailsModalOpen,
    setIsAddRecipeModalOpen,
    deleteRecipe,
    user,
    recipesLoading
  } = useApp();
  
  console.log('📚 RecipeLibraryScreen - Debug:', {
    recipesCount: recipes.length,
    recipes: recipes,
    recipesLoading,
    userId: user?.uid,
    userSignedIn: !!user
  });
  
  // Helper function to translate category names
  const translateCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'Korean': t('categories.korean'),
      'Chinese': t('categories.chinese'),
      'Italian': t('categories.italian'),
      'American': t('categories.american'),
      'Mexican': t('categories.mexican'),
      'Japanese': t('categories.japanese'),
      'Other': t('categories.other'),
      'Kid-Friendly': t('categories.kidFriendly'),
      'Breakfast': t('categories.breakfast'),
      'Lunch': t('categories.lunch'),
      'Dinner': t('categories.dinner'),
      'Snack': t('categories.snack'),
      'Batch-Cook Friendly': t('categories.batchCook'),
    };
    return categoryMap[category] || category;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMealType, setSelectedMealType] = useState<string>('All');

  // Define protein source categories for sidebar
  const proteinCategories: Array<{ key: string; label: string; emoji: string }> = [
    { key: 'All', label: 'All Recipes', emoji: '🍽️' },
    { key: 'Poultry', label: 'Poultry', emoji: '🍗' },
    { key: 'Beef', label: 'Beef', emoji: '🥩' },
    { key: 'Pork', label: 'Pork', emoji: '🍖' },
    { key: 'Seafood', label: 'Seafood', emoji: '🦐' },
    { key: 'Eggs', label: 'Eggs', emoji: '🥚' },
    { key: 'Plant-based', label: 'Plant-based', emoji: '🌱' },
  ];

  // Define meal type tags for top filter
  const mealTypeTags: Array<{ key: string; label: string; emoji: string }> = [
    { key: 'All', label: 'All', emoji: '' },
    { key: 'Breakfast', label: 'Breakfast', emoji: '🍳' },
    { key: 'Lunch', label: 'Lunch', emoji: '🍱' },
    { key: 'Dinner', label: 'Dinner', emoji: '🍽️' },
  ];

  // Helper function to get all protein types (handles both old and new format)
  const getProteinTypes = (recipe: Recipe): string[] => {
    if (recipe.proteinTypes && recipe.proteinTypes.length > 0) {
      return recipe.proteinTypes;
    }
    // Fallback to singular field for old recipes
    if (recipe.proteinType) {
      return [recipe.proteinType];
    }
    return [];
  };

  // Helper function to get all meal types (handles both old and new format)
  const getMealTypes = (recipe: Recipe): string[] => {
    if (recipe.mealTypes && recipe.mealTypes.length > 0) {
      return recipe.mealTypes;
    }
    // Fallback to singular field for old recipes
    if (recipe.mealType) {
      return [recipe.mealType];
    }
    return [];
  };

  // Filter recipes based on search and category
  const filteredRecipes = recipes.filter((recipe) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProteinTypes(recipe).some(pt => pt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      recipe.mealType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Legacy support for old categories
      (recipe.categories && recipe.categories.some((cat) =>
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    // Category filter by protein type with smart grouping
    let matchesCategory = true;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Plant-based') {
      // Plant-based includes: vegetarian, vegan, tofu, tempeh, beans, lentils, vegetables
      const plantBasedProteins = ['vegetarian', 'vegan', 'tofu', 'tempeh', 'bean', 'lentil', 'vegetable', 'seitan', 'chickpea', 'mushroom', 'paneer', 'cheese'];
      matchesCategory = 
        getProteinTypes(recipe).some(pt => {
          const ptLower = pt.toLowerCase();
          return plantBasedProteins.some(vp => ptLower.includes(vp));
        }) ||
        (recipe.categories && recipe.categories.some(cat => {
          const catLower = cat.toLowerCase();
          return catLower.includes('vegetarian') || catLower.includes('vegan');
        }));
    } else if (selectedCategory === 'Poultry') {
      // Poultry includes: chicken, turkey, duck, quail, etc.
      const poultryProteins = ['chicken', 'turkey', 'duck', 'quail', 'poultry', 'fowl'];
      matchesCategory = getProteinTypes(recipe).some(pt => {
        const ptLower = pt.toLowerCase();
        return poultryProteins.some(pp => ptLower.includes(pp));
      });
    } else if (selectedCategory === 'Seafood') {
      // Seafood includes: fish, shrimp, shellfish, crab, lobster, etc.
      matchesCategory = getProteinTypes(recipe).some(pt => {
        const ptLower = pt.toLowerCase();
        return ptLower.includes('fish') ||
          ptLower.includes('shrimp') ||
          ptLower.includes('seafood') ||
          ptLower.includes('shellfish') ||
          ptLower.includes('crab') ||
          ptLower.includes('lobster') ||
          ptLower.includes('salmon') ||
          ptLower.includes('tuna');
      });
    } else {
      // Match protein type using unified helper
      // Check both directions: "Eggs" matches "egg" and "Eggs" matches "Eggs"
      matchesCategory = getProteinTypes(recipe).some(pt => {
        const ptLower = pt.toLowerCase();
        const catLower = selectedCategory.toLowerCase();
        return ptLower.includes(catLower) || catLower.includes(ptLower);
      });
    }

    // Meal type filter
    let matchesMealType = true;
    if (selectedMealType !== 'All') {
      matchesMealType = getMealTypes(recipe).some(mt => {
        const mtLower = mt.toLowerCase();
        const mealTypeLower = selectedMealType.toLowerCase();
        return mtLower.includes(mealTypeLower) || mealTypeLower.includes(mtLower);
      });
    }

    return matchesSearch && matchesCategory && matchesMealType;
  });

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeDetailsModalOpen(true);
  };

  const handleAddRecipe = () => {
    setIsAddRecipeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-md mx-auto w-full px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('library.title')}</h1>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddRecipe} size="sm" className="shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              <UserButton />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={t('library.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Fixed Sidebar + Scrollable Content */}
      <div className="flex-1 flex max-w-md mx-auto w-full relative">
        {/* Left Sidebar - Protein Categories (Fixed) */}
        <div className="w-24 bg-secondary/30 border-r sticky top-[180px] self-start" style={{ height: 'calc(100vh - 180px - 5rem)' }}>
          <ScrollArea className="h-full">
            <div className="py-2">
              {proteinCategories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`w-full px-3 py-8 flex flex-col items-center justify-center gap-2 transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-background border-r-2 border-primary text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {category.label}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Content - Recipe Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px - 5rem)' }}>
            <div className="p-4">
              {/* Meal Type Tags */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {mealTypeTags.map((tag) => (
                  <button
                    key={tag.key}
                    onClick={() => setSelectedMealType(tag.key)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                      selectedMealType === tag.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Category Title */}
              <h2 className="text-lg font-semibold mb-4">
                {proteinCategories.find(c => c.key === selectedCategory)?.label}
              </h2>

              {/* Recipe Grid */}
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">{t('library.noRecipesFound')}</p>
                  <p className="text-sm mt-2">{t('library.tryAdjusting')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => handleRecipeClick(recipe)}
                      onDelete={deleteRecipe}
                      t={t}
                      currentLanguage={i18n.language}
                    />
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onDelete: (recipeId: string) => Promise<void>;
  t: any; // i18n translation function
  currentLanguage: string; // Current language for bilingual support
}

function RecipeCard({ recipe, onClick, onDelete, t, currentLanguage }: RecipeCardProps) {
  // Bilingual support: use Chinese name if available and language is Chinese
  const displayName = (currentLanguage === 'zh' && recipe.nameZh) ? recipe.nameZh : recipe.name;
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (confirm(t('library.deleteConfirm', { name: recipe.name }))) {
      try {
        await onDelete(recipe.id);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert(t('library.deleteFailed'));
      }
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden relative"
      onClick={onClick}
    >
      <CardContent className="p-0 flex items-center">
        {/* Recipe Image - Left Side */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center">
          <ImageWithFallback
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          
          {/* Favorite Heart */}
          {recipe.isFavorite && (
            <div className="absolute top-1 left-1 bg-white/90 rounded-full p-1 shadow-md backdrop-blur-sm">
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </div>
          )}
        </div>

        {/* Recipe Info - Right Side */}
        <div className="flex-1 p-3">
          <h3 className="font-semibold text-sm line-clamp-2">{displayName}</h3>
        </div>
      </CardContent>

      {/* Delete Button - Floating Top Right */}
      <button
        onClick={handleDelete}
        className="absolute p-1.5 bg-white/90 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shadow-md z-10"
        style={{ top: '8px', right: '8px' }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </Card>
  );
}

