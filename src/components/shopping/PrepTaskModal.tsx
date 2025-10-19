import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { PrepTask } from '../../types';
import { Badge } from '../ui/badge';

interface PrepTaskModalProps {
  task: PrepTask;
  onClose: () => void;
  onMarkDone: () => void;
}

export function PrepTaskModal({ task, onClose, onMarkDone }: PrepTaskModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm">Used for:</p>
            <div className="flex flex-wrap gap-2">
              {task.usedFor.map((use, i) => (
                <Badge key={i} variant="secondary">
                  {use}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3>Ingredients</h3>
            <ul className="space-y-2">
              {task.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3>Instructions</h3>
            <ol className="space-y-3">
              {task.instructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <h4 className="text-primary">Storage Instructions</h4>
            <ol className="space-y-2 text-sm">
              {task.storageInstructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">{i + 1}.</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1" onClick={onMarkDone} disabled={task.completed}>
              {task.completed ? 'Completed' : 'Mark as Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
