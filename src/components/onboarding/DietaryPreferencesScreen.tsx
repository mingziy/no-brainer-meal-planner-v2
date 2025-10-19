import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useApp } from '../../context/AppContext';

export function DietaryPreferencesScreen() {
  const { setCurrentScreen, userProfile, setUserProfile } = useApp();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState('');
  const [avoidFoods, setAvoidFoods] = useState('');

  const commonAllergens = ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy'];

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleContinue = () => {
    const otherAllergiesList = otherAllergies.split(',').map(a => a.trim()).filter(a => a);
    const avoidFoodsList = avoidFoods.split(',').map(f => f.trim()).filter(f => f);
    
    setUserProfile({
      ...userProfile,
      allergies: [...selectedAllergens, ...otherAllergiesList],
      avoidFoods: avoidFoodsList,
    } as any);
    
    setCurrentScreen('cooking-style');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <h1>Any allergies or dislikes?</h1>
          <p className="text-muted-foreground">We'll plan around them.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Common Allergens</Label>
            <div className="space-y-3">
              {commonAllergens.map((allergen) => (
                <div key={allergen} className="flex items-center space-x-2">
                  <Checkbox
                    id={allergen}
                    checked={selectedAllergens.includes(allergen)}
                    onCheckedChange={() => toggleAllergen(allergen)}
                  />
                  <label
                    htmlFor={allergen}
                    className="cursor-pointer"
                  >
                    {allergen}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="other">Other allergies (separated by commas)</Label>
            <Input
              id="other"
              type="text"
              placeholder="e.g., eggs"
              value={otherAllergies}
              onChange={(e) => setOtherAllergies(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avoid">Foods to avoid (separated by commas)</Label>
            <Input
              id="avoid"
              type="text"
              placeholder="e.g., mushrooms, spicy"
              value={avoidFoods}
              onChange={(e) => setAvoidFoods(e.target.value)}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
