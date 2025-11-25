import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useApp } from '../../context/AppContext';

export function WelcomeScreen() {
  const { setCurrentScreen, userProfile, setUserProfile } = useApp();
  const [name, setName] = useState('');
  const [numberOfKids, setNumberOfKids] = useState('');
  const [kidsAges, setKidsAges] = useState('');

  const handleContinue = () => {
    const ages = kidsAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age));
    
    setUserProfile({
      ...userProfile,
      name,
      numberOfKids: parseInt(numberOfKids) || 0,
      kidsAges: ages,
    } as any);
    
    setCurrentScreen('dietary-preferences');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <h1>Let's get to know you!</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kids">How many kids are you cooking for?</Label>
            <Input
              id="kids"
              type="number"
              placeholder="e.g., 2"
              value={numberOfKids}
              onChange={(e) => setNumberOfKids(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ages">Ages of kids (separated by commas)</Label>
            <Input
              id="ages"
              type="text"
              placeholder="e.g., 2, 5"
              value={kidsAges}
              onChange={(e) => setKidsAges(e.target.value)}
            />
          </div>
        </div>

        <Button 
          className="w-full"
          onClick={handleContinue}
          disabled={!name || !numberOfKids || !kidsAges}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
