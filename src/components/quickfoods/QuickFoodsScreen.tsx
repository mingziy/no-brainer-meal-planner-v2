import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { BottomNav } from '../shared/BottomNav';
import { defaultQuickFoods } from '../../data/quickFoods';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type Category = 'all' | 'fruit' | 'veggie' | 'dairy' | 'grain' | 'protein' | 'snack' | 'drink';

export function QuickFoodsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Filter foods by category and search
  const filteredFoods = defaultQuickFoods.filter(food => {
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryLabels: Record<Category, string> = {
    all: 'All Foods',
    fruit: 'Fruits',
    veggie: 'Vegetables',
    dairy: 'Dairy',
    grain: 'Grains',
    protein: 'Protein',
    snack: 'Snacks',
    drink: 'Drinks'
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1>Quick Foods</h1>
          <p className="text-muted-foreground">
            Add grab-and-go items to supplement your meals
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(categoryLabels) as Category[]).map(cat => (
              <SelectItem key={cat} value={cat}>
                {categoryLabels[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Food Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredFoods.map(food => (
            <Card key={food.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Emoji/Icon */}
                <div className="text-5xl text-center">
                  {food.emoji || '🍽️'}
                </div>

                {/* Food Info */}
                <div className="text-center space-y-1">
                  <h4 className="font-medium text-sm leading-tight">{food.name}</h4>
                  <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                  <p className="text-sm font-semibold text-primary">{food.calories} cal</p>
                </div>

                {/* Nutrition Summary */}
                <div className="text-xs text-muted-foreground text-center space-y-0.5">
                  <div>P: {food.nutrition.protein}g • C: {food.nutrition.carbs}g</div>
                  <div>F: {food.nutrition.fat}g • Fiber: {food.nutrition.fiber}g</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredFoods.length === 0 && (
          <Card className="bg-secondary/30">
            <CardContent className="pt-6 pb-6">
              <p className="text-center text-muted-foreground">
                No foods found. Try a different search or category.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

