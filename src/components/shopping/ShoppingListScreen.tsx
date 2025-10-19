import { Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../shared/BottomNav';
import { mockPrepTasks } from '../../data/mockData';

export function ShoppingListScreen() {
  const { shoppingList, setShoppingList, setCurrentScreen, setPrepTasks } = useApp();

  const toggleItem = (id: string) => {
    setShoppingList(
      shoppingList.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleExportList = () => {
    const listText = shoppingList.map(item => `${item.checked ? '✓' : '☐'} ${item.name} (${item.quantity})`).join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'Shopping List',
        text: listText,
      });
    } else {
      navigator.clipboard.writeText(listText);
      alert('Shopping list copied to clipboard!');
    }
  };

  const handleGotGroceries = () => {
    setPrepTasks(mockPrepTasks);
    setCurrentScreen('prep-hub');
  };

  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const categoryNames = {
    produce: 'Produce',
    meat: 'Meat & Poultry',
    pantry: 'Pantry',
    dairy: 'Dairy',
    other: 'Other',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1>This Week's Shopping List</h1>
          <p className="text-muted-foreground">
            Check off items you already have at home
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{categoryNames[category as keyof typeof categoryNames]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.name} <span className="text-muted-foreground">({item.quantity})</span>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleExportList}>
            <Share2 className="w-4 h-4 mr-2" />
            Export List
          </Button>
          <Button className="w-full" onClick={handleGotGroceries}>
            I have all my groceries!
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
