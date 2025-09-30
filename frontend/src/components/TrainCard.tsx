import { Train } from '@/types/rail';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Train as TrainIcon, 
  Clock, 
  MapPin, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Pause,
  Gauge
} from 'lucide-react';

interface TrainCardProps {
  train: Train;
  currentTime: string;
  currentPosition: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TrainCard({ train, currentTime, currentPosition, isSelected, onClick }: TrainCardProps) {
  const getTrainTypeIcon = (type: Train['type']) => {
    return <TrainIcon className="w-4 h-4" />;
  };

  const getTrainTypeColor = (type: Train['type']) => {
    switch (type) {
      case 'Express': return 'express';
      case 'Local': return 'local';
      case 'Freight': return 'freight';
      default: return 'muted';
    }
  };

  const getStatusIcon = (status: Train['status']) => {
    switch (status) {
      case 'running': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'delayed': return <Clock className="w-4 h-4 text-warning" />;
      case 'held': return <Pause className="w-4 h-4 text-muted-foreground" />;
      case 'breakdown': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const isRunning = parseTime(currentTime) >= parseTime(train.depart);
  const progress = Math.min((currentPosition / 75) * 100, 100); // 75km is total route length

  const getPriorityBadge = (priority: number) => {
    if (priority >= 9) return { variant: 'destructive' as const, label: 'HIGH' };
    if (priority >= 6) return { variant: 'default' as const, label: 'MED' };
    return { variant: 'secondary' as const, label: 'LOW' };
  };

  const priorityBadge = getPriorityBadge(train.priority);

  return (
    <Card
      className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-lg' 
          : 'border-panel-border hover:border-primary/50 hover:shadow-md'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 bg-${getTrainTypeColor(train.type)} rounded-lg flex items-center justify-center`}>
            {getTrainTypeIcon(train.type)}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-mono text-lg font-bold text-foreground">{train.id}</span>
              <Badge variant="outline" className="text-xs">
                {train.type}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{train.start} → {train.route[train.route.length - 1]}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <Badge variant={priorityBadge.variant} className="text-xs">
            {priorityBadge.label} P{train.priority}
          </Badge>
          {getStatusIcon(train.status)}
        </div>
      </div>

      {/* Status Information */}
      <div className="space-y-3">
        {/* Journey Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Journey Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Time & Speed Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Depart</div>
              <div className="font-medium text-foreground">{train.depart}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Gauge className="w-3 h-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Speed</div>
              <div className="font-medium text-foreground">{train.speed_kmph} km/h</div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="pt-2 border-t border-panel-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Status</span>
            <div className="flex items-center space-x-2">
              {train.delay > 0 && (
                <Badge variant="destructive" className="text-xs">
                  +{train.delay}min delay
                </Badge>
              )}
              <span className="font-medium capitalize text-foreground">
                {train.status === 'breakdown' ? 'BREAKDOWN' : 
                 isRunning ? 'Running' : 'Scheduled'}
              </span>
            </div>
          </div>
          
          {currentPosition > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              Position: {currentPosition.toFixed(1)}km
            </div>
          )}
        </div>

        {/* Emergency Status */}
        {train.status === 'breakdown' && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
            <div className="flex items-center space-x-1 text-destructive">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">EMERGENCY BREAKDOWN</span>
            </div>
            <div className="text-muted-foreground mt-1">
              Train requires immediate assistance
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}