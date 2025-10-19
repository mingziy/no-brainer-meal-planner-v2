import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Meal } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface MealDetailsModalProps {
  meal: Meal;
  onClose: () => void;
  onSwap: () => void;
}

export function MealDetailsModal({ meal, onClose, onSwap }: MealDetailsModalProps) {
  const { protein, veggies, carbs, fats } = meal.plateComposition;
  const total = protein + veggies + carbs + fats;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meal.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <ImageWithFallback
            src={meal.image}
            alt={meal.name}
            className="w-full h-48 object-cover rounded-lg"
          />

          <div className="space-y-3">
            <h3>Plate Composition</h3>
            <div className="w-full bg-secondary rounded-full h-8 flex overflow-hidden">
              <div
                className="bg-red-500 flex items-center justify-center text-white text-xs"
                style={{ width: `${(protein / total) * 100}%` }}
              >
                {protein}%
              </div>
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs"
                style={{ width: `${(veggies / total) * 100}%` }}
              >
                {veggies}%
              </div>
              <div
                className="bg-yellow-500 flex items-center justify-center text-white text-xs"
                style={{ width: `${(carbs / total) * 100}%` }}
              >
                {carbs}%
              </div>
              <div
                className="bg-orange-500 flex items-center justify-center text-white text-xs"
                style={{ width: `${(fats / total) * 100}%` }}
              >
                {fats}%
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              <div>
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                Protein
              </div>
              <div>
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                Veggies
              </div>
              <div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                Carbs
              </div>
              <div>
                <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div>
                Fats
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3>Nutrition Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Protein</p>
                <p>{meal.nutrition.protein}g</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Fiber</p>
                <p>{meal.nutrition.fiber}g</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Fat</p>
                <p>{meal.nutrition.fat}g</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Carbs</p>
                <p>{meal.nutrition.carbs}g</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Iron</p>
                <p>{meal.nutrition.iron}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground text-sm">Calcium</p>
                <p>{meal.nutrition.calcium}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3>Portion Guidance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Adult:</span>
                <span>{meal.portions.adult}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Child (Age 5):</span>
                <span>{meal.portions.child5}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/30 rounded">
                <span className="text-muted-foreground">Child (Age 2):</span>
                <span>{meal.portions.child2}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onSwap}>
              Swap This Meal
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
