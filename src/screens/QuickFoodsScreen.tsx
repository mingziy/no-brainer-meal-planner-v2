import { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BottomNav } from '../components/shared/BottomNav';
import { UserButton } from '../components/auth/UserButton';
import { defaultQuickFoods } from '../data/quickFoods';
import { ScrollArea } from '../components/ui/scroll-area';
import { QuickFood } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type Category = 'all' | 'fruit' | 'veggie' | 'dairy' | 'grain' | 'protein' | 'snack' | 'drink';

export function QuickFoodsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('fruit');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customQuickFoods, setCustomQuickFoods] = useState<QuickFood[]>([]);
  
  // Form state
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState<Category>('fruit');
  const [emoji, setEmoji] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  // Load custom quick foods from Firebase
  useEffect(() => {
    const loadCustomQuickFoods = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db, auth } = await import('../config/firebase');
        
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'quickFoods'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const foods: QuickFood[] = [];
        
        querySnapshot.forEach((doc) => {
          foods.push({ id: doc.id, ...doc.data() } as QuickFood);
        });
        
        setCustomQuickFoods(foods);
      } catch (error) {
        console.error('Error loading custom quick foods:', error);
      }
    };

    loadCustomQuickFoods();
  }, []);

  const categories: { key: Category; label: string; emoji: string }[] = [
    { key: 'fruit', label: 'Fruits', emoji: '🍎' },
    { key: 'veggie', label: 'Veggies', emoji: '🥬' },
    { key: 'grain', label: 'Grains', emoji: '🌾' },
    { key: 'protein', label: 'Protein', emoji: '🥩' },
    { key: 'dairy', label: 'Dairy', emoji: '🥛' },
    { key: 'snack', label: 'Snacks', emoji: '🍪' },
    { key: 'drink', label: 'Drinks', emoji: '🥤' },
    { key: 'all', label: 'All', emoji: '🍽️' },
  ];

  // Combine default and custom quick foods
  const allQuickFoods = [...defaultQuickFoods, ...customQuickFoods];

  // Filter foods by selected category and search
  const filteredFoods = allQuickFoods.filter(food => {
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    const matchesSearch = searchQuery === '' || food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Reset form
  const resetForm = () => {
    setFoodName('');
    setFoodCategory('fruit');
    setEmoji('');
    setServingSize('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
  };

  // AI auto-populate nutrition data
  const handleAutoPopulate = async () => {
    if (!foodName.trim()) {
      alert('Please enter a food name first');
      return;
    }

    setIsLoading(true);
    try {
      // Check if API key exists
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('API Key exists:', !!apiKey);
      
      if (!apiKey) {
        throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      }
      
      // Import Gemini AI
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      console.log('Sending prompt to Gemini...');

      const prompt = `Analyze this food description: "${foodName.trim()}"

The user has described a food item including the serving size. Please extract and analyze:
- The food name
- The food category (fruit, veggie, dairy, grain, protein, snack, or drink)
- The serving size mentioned (or use typical serving if not specified)
- Calculate the approximate nutrition values

Provide the following information in JSON format:
{
  "emoji": "appropriate emoji for this food (single emoji)",
  "category": "one of: fruit, veggie, dairy, grain, protein, snack, drink",
  "servingSize": "the serving size mentioned in the description (e.g., '1 cup', '100g', '1 medium')",
  "calories": number (approximate calories for this serving),
  "nutrition": {
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams)
  }
}

Return ONLY valid JSON, no additional text or explanation.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();
      
      console.log('Gemini response:', text);

      // Clean up the response (remove markdown code blocks if present)
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/g, '');
      }
      
      console.log('Cleaned response:', text);

      const data = JSON.parse(text);
      console.log('Parsed data:', data);
      
      // Populate form with AI data
      setEmoji(data.emoji || '🍽️');
      if (data.category && ['fruit', 'veggie', 'dairy', 'grain', 'protein', 'snack', 'drink'].includes(data.category)) {
        setFoodCategory(data.category as Category);
      }
      setServingSize(data.servingSize || '1 serving');
      setCalories(data.calories?.toString() || '0');
      setProtein(data.nutrition?.protein?.toString() || '0');
      setCarbs(data.nutrition?.carbs?.toString() || '0');
      setFat(data.nutrition?.fat?.toString() || '0');
      setFiber(data.nutrition?.fiber?.toString() || '0');
    } catch (error) {
      console.error('Error analyzing food:', error);
      
      // Show more detailed error message
      let errorMessage = 'Failed to analyze food. ';
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage += 'API key not configured. Please check your Gemini API key.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Please enter values manually.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Save new quick food
  const handleSaveFood = async () => {
    if (!foodName.trim() || !calories) {
      alert('Please fill in at least food name and calories');
      return;
    }

    try {
      // Import Firebase
      const { collection, addDoc } = await import('firebase/firestore');
      const { db, auth } = await import('../config/firebase');
      
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to save quick foods');
        return;
      }

      // Extract the food name from the description (first few words)
      const extractedName = foodName.trim().split(/\s+/).slice(0, 5).join(' ');

      const newQuickFood = {
        name: extractedName,
        category: foodCategory,
        emoji: emoji || '🍽️',
        servingSize: servingSize || '1 serving',
        calories: parseInt(calories),
        nutrition: {
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
          fiber: parseFloat(fiber) || 0,
        },
        isCustom: true,
        userId: user.uid,
        createdAt: new Date(),
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, 'quickFoods'), newQuickFood);
      
      // Add to local state immediately
      setCustomQuickFoods(prev => [...prev, { id: docRef.id, ...newQuickFood } as QuickFood]);
      
      alert('Quick food saved!');
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving quick food:', error);
      alert('Failed to save quick food. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-md mx-auto w-full px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1>Quick Foods</h1>
            
            <div className="flex items-center gap-2">
              {/* Add Button */}
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                size="sm" 
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              <UserButton />
            </div>
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground">
            Add grab-and-go items to supplement your meals
          </p>

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
        </div>
      </div>

      {/* Two Column Layout: Fixed Sidebar + Scrollable Content */}
      <div className="flex-1 flex max-w-md mx-auto w-full relative">
        {/* Left Sidebar - Categories (Fixed) */}
        <div className="w-24 bg-secondary/30 border-r sticky top-[200px] self-start" style={{ height: 'calc(100vh - 200px - 5rem)' }}>
          <ScrollArea className="h-full">
            <div className="py-2">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`w-full px-3 py-4 flex flex-col items-center gap-1 transition-colors ${
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

        {/* Right Content - Food Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px - 5rem)' }}>
          <div className="p-4">
              {/* Category Title */}
              <h2 className="text-lg font-semibold mb-4">
                {categories.find(c => c.key === selectedCategory)?.label}
              </h2>

              {/* Food Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredFoods.map(food => (
                  <Card key={food.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      {/* Emoji/Icon */}
                      <div className="text-4xl text-center">
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
                        <div>Protein: {food.nutrition.protein}g</div>
                        <div>Carbs: {food.nutrition.carbs}g</div>
                        <div>Fat: {food.nutrition.fat}g</div>
                        <div>Fiber: {food.nutrition.fiber}g</div>
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
                      No foods found in this category. Try a different search.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      </div>

      {/* Add Quick Food Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Quick Food</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Food Description */}
            <div className="space-y-2">
              <Label htmlFor="foodName">Describe your food</Label>
              <div className="space-y-2">
                <textarea
                  id="foodName"
                  placeholder="e.g., a cup of brown rice, 1 medium apple, 100g grilled chicken breast"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  onClick={handleAutoPopulate}
                  disabled={isLoading || !foodName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      🤖 Auto-Fill with AI
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Describe the food and serving size, then click the button to auto-fill nutrition data
              </p>
            </div>

            {isLoading && (
              <div className="text-center py-6 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p className="font-medium">Analyzing your food with AI...</p>
                <p className="text-xs">This may take a few seconds</p>
              </div>
            )}

            {/* Category - only show after AI fills data */}
            {(emoji || servingSize || calories) && (
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={foodCategory} onValueChange={(value) => setFoodCategory(value as Category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Auto-filled Results - only show after AI fills data */}
            {(emoji || servingSize || calories) && !isLoading && (
              <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <p className="text-sm font-medium">AI Generated Results - Edit if needed</p>
                </div>

                {/* Emoji */}
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    placeholder="🍎"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="text-2xl"
                    maxLength={2}
                  />
                </div>

                {/* Serving Size */}
                <div className="space-y-2">
                  <Label htmlFor="servingSize">Serving Size</Label>
                  <Input
                    id="servingSize"
                    placeholder="e.g., 1 medium, 100g, 1 cup"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                  />
                </div>

                {/* Calories */}
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories *</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="95"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>

                {/* Nutrition Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      placeholder="0.5"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      step="0.1"
                      placeholder="25"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      placeholder="0.3"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiber">Fiber (g)</Label>
                    <Input
                      id="fiber"
                      type="number"
                      step="0.1"
                      placeholder="4"
                      value={fiber}
                      onChange={(e) => setFiber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFood}
                disabled={!foodName.trim() || !calories}
                className="flex-1"
              >
                Save Food
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

