import { useState } from 'react';
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
  const {
    recipes,
    setSelectedRecipe,
    setIsRecipeDetailsModalOpen,
    setIsAddRecipeModalOpen,
    deleteRecipe,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Define categories with "All" and "Favorites" first
  const categories: string[] = [
    'All',
    'Favorites ❤️',
    'Korean',
    'Chinese',
    'Italian',
    'Kid-Friendly',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Batch-Cook Friendly',
  ];

  // Filter recipes based on search and category
  const filteredRecipes = recipes.filter((recipe) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.categories.some((cat) =>
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Category filter
    let matchesCategory = true;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Favorites ❤️') {
      matchesCategory = recipe.isFavorite;
    } else if (
      ['Korean', 'Chinese', 'Italian', 'American', 'Mexican', 'Japanese', 'Other'].includes(
        selectedCategory
      )
    ) {
      matchesCategory = recipe.cuisine === selectedCategory;
    } else {
      // Check if recipe has this category
      matchesCategory = recipe.categories.includes(selectedCategory as RecipeCategory);
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Recipe Box</h1>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search my recipes (e.g., 'Chicken', 'Pasta')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Browse by Category - Horizontal Scrolling */}
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Recipe List */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No recipes found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleRecipeClick(recipe)}
                onDelete={deleteRecipe}
              />
            ))}
          </div>
        )}
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
}

function RecipeCard({ recipe, onClick, onDelete }: RecipeCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      try {
        await onDelete(recipe.id);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Recipe Image */}
        <div className="relative w-full h-48 overflow-hidden">
          <ImageWithFallback
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          {recipe.isFavorite && (
            <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
          )}
        </div>

        {/* Recipe Info */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-lg line-clamp-2">{recipe.name}</h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {recipe.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>

          {/* Time */}
          <div className="flex items-center text-sm text-muted-foreground">
            <span>
              Prep: {recipe.prepTime}m, Cook: {recipe.cookTime}m
            </span>
          </div>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Recipe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

