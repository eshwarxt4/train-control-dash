import { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SimulationControlsProps {
  currentTime: string;
  isRunning: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onSetSpeed: (speed: number) => void;
  onSetTime: (time: string) => void;
  onReset: () => void;
}

export function SimulationControls({
  currentTime,
  isRunning,
  speed,
  onPlay,
  onPause,
  onSetSpeed,
  onSetTime,
  onReset
}: SimulationControlsProps) {
  const [customTime, setCustomTime] = useState(currentTime);
  const [showTimeInput, setShowTimeInput] = useState(false);

  const speedOptions = [
    { value: 0.5, label: '0.5x', icon: ZapOff },
    { value: 1, label: '1x', icon: Clock },
    { value: 2, label: '2x', icon: Zap },
    { value: 5, label: '5x', icon: Zap },
    { value: 10, label: '10x', icon: Zap }
  ];

  const handleTimeSubmit = () => {
    onSetTime(customTime);
    setShowTimeInput(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <Card className="p-4 bg-panel border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Simulation Controls</h3>
        <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
          {isRunning ? "Running" : "Paused"}
        </Badge>
      </div>

      {/* Time Display */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-lg font-bold text-foreground">
            {formatTime(currentTime)}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTimeInput(!showTimeInput)}
          className="text-xs"
        >
          Set Time
        </Button>
      </div>

      {/* Custom Time Input */}
      {showTimeInput && (
        <div className="mb-4 p-3 bg-background rounded-lg border">
          <Label htmlFor="custom-time" className="text-sm font-medium">
            Set Simulation Time
          </Label>
          <div className="flex items-center space-x-2 mt-2">
            <Input
              id="custom-time"
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="font-mono"
            />
            <Button size="sm" onClick={handleTimeSubmit}>
              Apply
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowTimeInput(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Play/Pause Controls */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          onClick={isRunning ? onPause : onPlay}
          variant={isRunning ? "destructive" : "default"}
          size="sm"
          className="flex items-center space-x-1"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Play</span>
            </>
          )}
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Speed Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Simulation Speed</Label>
        <div className="flex items-center space-x-2">
          {speedOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                onClick={() => onSetSpeed(option.value)}
                variant={speed === option.value ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-1"
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs">{option.label}</span>
              </Button>
            );
          })}
        </div>
        
        {/* Speed Slider */}
        <div className="px-2">
          <Slider
            value={[speed]}
            onValueChange={([value]) => onSetSpeed(value)}
            min={0.5}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>
      </div>

      {/* Demo Scenarios */}
      <div className="mt-4 pt-4 border-t border-border">
        <Label className="text-sm font-medium mb-2 block">Demo Scenarios</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSetTime('06:00');
              onSetSpeed(2);
            }}
            className="text-xs"
          >
            Morning Rush
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSetTime('14:30');
              onSetSpeed(5);
            }}
            className="text-xs"
          >
            Afternoon Peak
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSetTime('18:00');
              onSetSpeed(3);
            }}
            className="text-xs"
          >
            Evening Rush
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSetTime('22:00');
              onSetSpeed(1);
            }}
            className="text-xs"
          >
            Night Service
          </Button>
        </div>
      </div>
    </Card>
  );
}