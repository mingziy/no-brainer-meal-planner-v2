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
import { LanguageSwitcher } from '../shared/LanguageSwitcher';

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

  // Define protein source categories for sidebar
  const proteinCategories: Array<{ key: string; label: string; emoji: string }> = [
    { key: 'All', label: 'All Recipes', emoji: '🍽️' },
    { key: 'Chicken', label: 'Chicken', emoji: '🍗' },
    { key: 'Beef', label: 'Beef', emoji: '🥩' },
    { key: 'Pork', label: 'Pork', emoji: '🍖' },
    { key: 'Fish', label: 'Fish', emoji: '🐟' },
    { key: 'Seafood', label: 'Seafood', emoji: '🦐' },
    { key: 'Eggs', label: 'Eggs', emoji: '🥚' },
    { key: 'Vegetarian', label: 'Vegetarian', emoji: '🥦' },
    { key: 'Vegan', label: 'Vegan', emoji: '🌱' },
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

    // Category filter by protein type
    let matchesCategory = true;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Vegetarian' || selectedCategory === 'Vegan') {
      matchesCategory = 
        getProteinTypes(recipe).some(pt => pt.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (recipe.categories && recipe.categories.some(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase())));
    } else if (selectedCategory === 'Seafood') {
      matchesCategory = getProteinTypes(recipe).some(pt => 
        pt.toLowerCase().includes('fish') ||
        pt.toLowerCase().includes('shrimp') ||
        pt.toLowerCase().includes('seafood') ||
        pt.toLowerCase().includes('shellfish')
      );
    } else {
      // Match protein type using unified helper
      // Check both directions: "Eggs" matches "egg" and "Eggs" matches "Eggs"
      matchesCategory = getProteinTypes(recipe).some(pt => {
        const ptLower = pt.toLowerCase();
        const catLower = selectedCategory.toLowerCase();
        return ptLower.includes(catLower) || catLower.includes(ptLower);
      });
    }

    return matchesSearch && matchesCategory;
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
      {/* Header */}
      <div className="max-w-md mx-auto w-full px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('library.title')}</h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddRecipe} size="sm" className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            <LanguageSwitcher />
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

      {/* Two Column Layout: Sidebar + Content */}
      <div className="flex-1 flex max-w-md mx-auto w-full">
        {/* Left Sidebar - Protein Categories */}
        <div className="w-24 bg-secondary/30 border-r">
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

        {/* Right Content - Recipe Grid */}
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4">
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
          </ScrollArea>
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

