import { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import { BottomNav } from '../components/shared/BottomNav';
import { PrepTaskModal } from './PrepTaskModal';
import { PrepTask } from '../types';

export function PrepHubScreen() {
  const { prepTasks, setPrepTasks, setCurrentScreen } = useApp();
  const [selectedTask, setSelectedTask] = useState<PrepTask | null>(null);

  const completedCount = prepTasks.filter(t => t.completed).length;
  const totalCount = prepTasks.length;

  const handleAllDone = () => {
    setCurrentScreen('home');
  };

  const handleToggleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrepTasks(
      prepTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleViewDetails = (task: PrepTask) => {
    setSelectedTask(task);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1>Your Weekend Prep Plan</h1>
          <p className="text-muted-foreground">
            Let's get this done in ~1.5 hours!
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {prepTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:bg-accent/50 transition-colors"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <button
                  onClick={(e) => handleToggleComplete(task.id, e)}
                  className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                  aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={task.completed ? 'line-through text-muted-foreground' : ''}>
                    {task.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {task.usedFor.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleViewDetails(task)}
                  className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring rounded p-1"
                  aria-label="View details"
                >
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={handleAllDone}
          disabled={completedCount < totalCount}
        >
          All Prep is Done!
        </Button>
      </div>

      <BottomNav />

      {selectedTask && (
        <PrepTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMarkDone={() => {
            setPrepTasks(
              prepTasks.map(t =>
                t.id === selectedTask.id ? { ...t, completed: true } : t
              )
            );
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
