import { Party, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { useApp } from '../../context/AppContext';

interface WeeklyReviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function WeeklyReviewModal({ open, onClose }: WeeklyReviewModalProps) {
  const { setCurrentScreen } = useApp();

  const handlePlanNextWeek = () => {
    onClose();
    setCurrentScreen('plan-setup');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>You did it!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <div className="text-6xl">🎉</div>
          </div>

          <div className="text-center space-y-2">
            <h3>Amazing work this week!</h3>
            <p className="text-muted-foreground">
              You served 21 nutritious meals & snacks this week!
            </p>
          </div>

          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <h4 className="mb-4 text-center">Your Week in Nutrition</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Protein</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div className="bg-red-500 h-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Veggies</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fruits</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: '88%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Your Win
            </Button>
            <Button className="flex-1" onClick={handlePlanNextWeek}>
              Plan Next Week
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
