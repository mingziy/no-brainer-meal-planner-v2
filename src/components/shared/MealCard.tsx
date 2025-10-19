import { Info, RefreshCw } from 'lucide-react';
import { Meal } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface MealCardProps {
  meal: Meal;
  onViewInfo?: () => void;
  onSwap?: () => void;
  showActions?: boolean;
}

export function MealCard({ meal, onViewInfo, onSwap, showActions = true }: MealCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
      <ImageWithFallback
        src={meal.image}
        alt={meal.name}
        className="w-16 h-16 rounded-md object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="truncate">{meal.name}</p>
      </div>
      {showActions && (
        <div className="flex gap-2">
          {onViewInfo && (
            <button
              onClick={onViewInfo}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="View info"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          {onSwap && (
            <button
              onClick={onSwap}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Swap meal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
