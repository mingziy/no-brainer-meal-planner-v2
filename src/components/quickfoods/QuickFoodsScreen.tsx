import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Loader2, Languages } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { BottomNav } from '../shared/BottomNav';
import { UserButton } from '../auth/UserButton';
import { defaultQuickFoods } from '../../data/quickFoods';
import { ScrollArea } from '../ui/scroll-area';
import { QuickFood } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type Category = 'all' | 'fruit' | 'veggie' | 'dairy' | 'grain' | 'protein' | 'snack' | 'drink';

export function QuickFoodsScreen() {
  const { t, i18n } = useTranslation('quickfoods');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('fruit');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [customQuickFoods, setCustomQuickFoods] = useState<QuickFood[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render after translation
  
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
        const { db, auth } = await import('../../config/firebase');
        
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
    { key: 'fruit', label: t('categories.fruits'), emoji: '🍎' },
    { key: 'veggie', label: t('categories.veggies'), emoji: '🥬' },
    { key: 'grain', label: t('categories.grains'), emoji: '🌾' },
    { key: 'protein', label: t('categories.protein'), emoji: '🥩' },
    { key: 'dairy', label: t('categories.dairy'), emoji: '🥛' },
    { key: 'snack', label: t('categories.snacks'), emoji: '🍪' },
    { key: 'drink', label: t('categories.drinks'), emoji: '🥤' },
    { key: 'all', label: t('categories.all'), emoji: '🍽️' },
  ];

  // Load translations from localStorage and apply to default foods
  const translationsMap = JSON.parse(localStorage.getItem('quickFoodsTranslations') || '{}');
  const defaultFoodsWithTranslations = defaultQuickFoods.map(food => {
    const translation = translationsMap[food.id];
    if (translation) {
      return {
        ...food,
        nameTranslated: translation.nameTranslated,
        servingSizeTranslated: translation.servingSizeTranslated,
        translatedTo: translation.translatedTo as 'en' | 'zh'
      };
    }
    return food;
  });

  // Combine default (with translations) and custom quick foods
  const allQuickFoods = [...defaultFoodsWithTranslations, ...customQuickFoods];

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
      const { db, auth } = await import('../../config/firebase');
      // Import language detection
      const { detectQuickFoodLanguage } = await import('../../utils/geminiRecipeParser');
      
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to save quick foods');
        return;
      }

      // Extract the food name from the description (first few words)
      const extractedName = foodName.trim().split(/\s+/).slice(0, 5).join(' ');

      // Detect language of the food name
      let originalLanguage: 'en' | 'zh' = 'en';
      try {
        const detected = await detectQuickFoodLanguage(extractedName);
        originalLanguage = detected.originalLanguage;
        console.log('✅ Detected language for quick food:', originalLanguage);
      } catch (error) {
        console.warn('⚠️ Language detection failed, defaulting to English:', error);
        // Fallback: simple check for Chinese characters
        originalLanguage = /[\u4e00-\u9fa5]/.test(extractedName) ? 'zh' : 'en';
      }

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
        originalLanguage, // NEW: Store detected language
        isCustom: true,
        userId: user.uid,
        createdAt: new Date(),
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, 'quickFoods'), newQuickFood);
      
      // Add to local state immediately
      setCustomQuickFoods(prev => [...prev, { id: docRef.id, ...newQuickFood } as QuickFood]);
      
      alert(t('messages.foodSaved'));
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving quick food:', error);
      alert(t('messages.saveFailed'));
    }
  };

  const handleTranslateQuickFoods = async () => {
    setIsTranslating(true);
    try {
      const { collection, getDocs, query, where, doc, updateDoc } = await import('firebase/firestore');
      const { db, auth } = await import('../../config/firebase');
      const { translateQuickFoods } = await import('../../utils/geminiRecipeParser');
      
      const user = auth.currentUser;
      if (!user) {
        alert('You must be logged in to translate quick foods');
        return;
      }

      // Determine target language based on current UI language
      // If user is in Chinese mode, translate everything to Chinese
      // If user is in English mode, translate everything to English
      const targetLanguage: 'en' | 'zh' = i18n.language === 'zh' ? 'zh' : 'en';

      console.log(`🔄 Current UI language: ${i18n.language}`);
      console.log(`🔄 Target language: ${targetLanguage}`);
      console.log(`📊 Total foods: ${allQuickFoods.length}`);

      // Filter foods that need translation (don't have translation or translation is outdated)
      const foodsToTranslate = allQuickFoods.filter(food => {
        // If no translation exists, translate it
        if (!food.nameTranslated || !food.servingSizeTranslated) return true;
        
        // If translation is to a different language, translate it
        if (food.translatedTo !== targetLanguage) return true;
        
        return false;
      });

      console.log(`📝 Foods needing translation: ${foodsToTranslate.length}`);

      if (foodsToTranslate.length === 0) {
        alert('All quick foods are already translated!');
        return;
      }

      // Call AI to translate
      const translations = await translateQuickFoods(
        foodsToTranslate.map(f => ({
          id: f.id,
          name: f.name,
          servingSize: f.servingSize,
          originalLanguage: f.originalLanguage
        })),
        targetLanguage
      );

      console.log(`✅ Received ${translations.length} translations`);

      // Separate custom foods (can be saved to Firestore) from default foods (only local state)
      const customFoodsToUpdate = foodsToTranslate.filter(f => f.isCustom && f.userId === user.uid);
      const defaultFoodsTranslations = translations.filter(t => 
        !foodsToTranslate.find(f => f.id === t.id)?.isCustom
      );

      console.log(`💾 Custom foods to save: ${customFoodsToUpdate.length}`);
      console.log(`📋 Default foods (local only): ${defaultFoodsTranslations.length}`);

      // Update Firestore ONLY for custom foods
      if (customFoodsToUpdate.length > 0) {
        const quickFoodsRef = collection(db, 'quickFoods');
        const updatePromises = translations
          .filter(t => customFoodsToUpdate.find(f => f.id === t.id))
          .map(async (translation) => {
            const foodRef = doc(db, 'quickFoods', translation.id);
            await updateDoc(foodRef, {
              nameTranslated: translation.nameTranslated,
              servingSizeTranslated: translation.servingSizeTranslated,
              translatedTo: targetLanguage,
              lastTranslated: new Date()
            });
          });

        await Promise.all(updatePromises);
        console.log('✅ Custom foods saved to Firestore');
        
        // Reload custom quick foods
        const q = query(quickFoodsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const updatedFoods: QuickFood[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as QuickFood));
        
        setCustomQuickFoods(updatedFoods);
      }

      // Store translations in localStorage for default foods
      const translationsMap: Record<string, { nameTranslated: string; servingSizeTranslated: string; translatedTo: string }> = {};
      translations.forEach(t => {
        translationsMap[t.id] = {
          nameTranslated: t.nameTranslated,
          servingSizeTranslated: t.servingSizeTranslated,
          translatedTo: targetLanguage
        };
      });
      localStorage.setItem('quickFoodsTranslations', JSON.stringify(translationsMap));
      console.log('✅ Default foods translations saved to localStorage');
      
      // Force a re-render by updating the refresh key
      setRefreshKey(prev => prev + 1);
      
      alert(`Successfully translated ${translations.length} quick foods to ${targetLanguage === 'en' ? 'English' : 'Chinese'}!`);
    } catch (error) {
      console.error('❌ Translation error:', error);
      alert('Failed to translate quick foods. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-md mx-auto w-full px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1>{t('title')}</h1>
            
            <div className="flex items-center gap-2">
              {/* Translate Button */}
              <Button 
                onClick={handleTranslateQuickFoods} 
                size="sm" 
                variant="outline"
                className="shrink-0"
                disabled={isTranslating}
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common:messages.translating', { ns: 'common' })}
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4 mr-2" />
                    {t('common:buttons.translate', { ns: 'common' })}
                  </>
                )}
              </Button>
              
              {/* Add Button */}
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                size="sm" 
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('common:buttons.add', { ns: 'common' })}
              </Button>
              <UserButton />
            </div>
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('searchPlaceholder')}
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
                        <h4 className="font-medium text-sm leading-tight">
                          {food.nameTranslated || food.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {food.servingSizeTranslated || food.servingSize}
                        </p>
                        <p className="text-sm font-semibold text-primary">{food.calories} {t('nutrition.cal')}</p>
                      </div>

                      {/* Nutrition Summary */}
                      <div className="text-xs text-muted-foreground text-center space-y-0.5">
                        <div>{t('nutrition.protein')}: {food.nutrition.protein}{t('nutrition.grams')}</div>
                        <div>{t('nutrition.carbs')}: {food.nutrition.carbs}{t('nutrition.grams')}</div>
                        <div>{t('nutrition.fat')}: {food.nutrition.fat}{t('nutrition.grams')}</div>
                        <div>{t('nutrition.fiber')}: {food.nutrition.fiber}{t('nutrition.grams')}</div>
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
            <DialogTitle>{t('addModal.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Food Description */}
            <div className="space-y-2">
              <Label htmlFor="foodName">{t('addModal.describeFoodLabel')}</Label>
              <div className="space-y-2">
                <textarea
                  id="foodName"
                  placeholder={t('addModal.describeFoodPlaceholder')}
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
                      {t('addModal.analyzingButton')}
                    </>
                  ) : (
                    <>
                      {t('addModal.autoFillButton')}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('addModal.describeFoodHint')}
              </p>
            </div>

            {isLoading && (
              <div className="text-center py-6 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p className="font-medium">{t('addModal.analyzingMessage')}</p>
                <p className="text-xs">{t('addModal.analyzingSubtext')}</p>
              </div>
            )}

            {/* Category - only show after AI fills data */}
            {(emoji || servingSize || calories) && (
              <div className="space-y-2">
                <Label htmlFor="category">{t('addModal.categoryRequired')}</Label>
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
                  <p className="text-sm font-medium">{t('addModal.aiResultsHeader')}</p>
                </div>

                {/* Emoji */}
                <div className="space-y-2">
                  <Label htmlFor="emoji">{t('addModal.emojiLabel')}</Label>
                  <Input
                    id="emoji"
                    placeholder={t('addModal.emojiPlaceholder')}
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="text-2xl"
                    maxLength={2}
                  />
                </div>

                {/* Serving Size */}
                <div className="space-y-2">
                  <Label htmlFor="servingSize">{t('addModal.servingSizeLabel')}</Label>
                  <Input
                    id="servingSize"
                    placeholder={t('addModal.servingSizePlaceholder')}
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                  />
                </div>

                {/* Calories */}
                <div className="space-y-2">
                  <Label htmlFor="calories">{t('addModal.caloriesLabel')}</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder={t('addModal.caloriesPlaceholder')}
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>

                {/* Nutrition Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="protein">{t('addModal.proteinLabel')}</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      placeholder={t('addModal.proteinPlaceholder')}
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">{t('addModal.carbsLabel')}</Label>
                    <Input
                      id="carbs"
                      type="number"
                      step="0.1"
                      placeholder={t('addModal.carbsPlaceholder')}
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">{t('addModal.fatLabel')}</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      placeholder={t('addModal.fatPlaceholder')}
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiber">{t('addModal.fiberLabel')}</Label>
                    <Input
                      id="fiber"
                      type="number"
                      step="0.1"
                      placeholder={t('addModal.fiberPlaceholder')}
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
                {t('addModal.cancelButton')}
              </Button>
              <Button
                onClick={handleSaveFood}
                disabled={!foodName.trim() || !calories}
                className="flex-1"
              >
                {t('addModal.saveButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

