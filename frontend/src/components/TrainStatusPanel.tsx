import { Train } from '@/types/rail';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Train as TrainIcon, 
  Clock, 
  MapPin, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Gauge,
  Activity
} from 'lucide-react';

interface TrainStatusPanelProps {
  trains: Train[];
  currentTime: string;
  calculateTrainPosition: (train: Train, time: string) => number;
}

export function TrainStatusPanel({ trains, currentTime, calculateTrainPosition }: TrainStatusPanelProps) {
  const parseTime = (timeStr: string | undefined): Date => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const getTrainColor = (type: Train['type']) => {
    switch (type) {
      case 'Express': return '#3b82f6';
      case 'Local': return '#10b981';
      case 'Freight': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTrainTypeIcon = (type: Train['type']) => {
    switch (type) {
      case 'Express': return <Zap className="w-4 h-4" />;
      case 'Local': return <TrainIcon className="w-4 h-4" />;
      case 'Freight': return <Activity className="w-4 h-4" />;
      default: return <TrainIcon className="w-4 h-4" />;
    }
  };

  const runningTrains = trains.filter(t => parseTime(currentTime) >= parseTime(t.depart));
  const scheduledTrains = trains.filter(t => parseTime(currentTime) < parseTime(t.depart));
  const emergencyTrains = trains.filter(t => t.status === 'breakdown');
  const delayedTrains = trains.filter(t => t.delay > 0);

  return (
    <Card className="h-full bg-panel border-panel-border">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Fleet Status</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {trains.length} Total
            </Badge>
            <Badge variant={emergencyTrains.length > 0 ? 'destructive' : 'secondary'} className="text-xs">
              {emergencyTrains.length} Emergency
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-success/10 rounded border border-success/20">
            <div className="text-lg font-bold text-success">{runningTrains.length}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded border border-border">
            <div className="text-lg font-bold text-foreground">{scheduledTrains.length}</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
          <div className="text-center p-2 bg-warning/10 rounded border border-warning/20">
            <div className="text-lg font-bold text-warning">{delayedTrains.length}</div>
            <div className="text-xs text-muted-foreground">Delayed</div>
          </div>
          <div className="text-center p-2 bg-destructive/10 rounded border border-destructive/20">
            <div className="text-lg font-bold text-destructive">{emergencyTrains.length}</div>
            <div className="text-xs text-muted-foreground">Emergency</div>
          </div>
        </div>

        {/* Train List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {trains.map(train => {
              const departTime = train.depart || '00:00';
              const isActive = parseTime(currentTime) >= parseTime(departTime);
              const position = calculateTrainPosition(train, currentTime);
              const progress = Math.min((position / 75) * 100, 100);
              
              return (
                <div
                  key={train.id}
                  className={`p-3 rounded-lg border transition-all ${
                    train.status === 'delayed' || train.status === 'breakdown' 
                      ? 'bg-destructive/5 border-destructive/30' 
                      : isActive 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-background border-border'
                  }`}
                >
                  {/* Train Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: getTrainColor(train.type) }}
                      >
                        {getTrainTypeIcon(train.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-sm font-bold text-foreground">{train.id}</span>
                          <Badge variant="outline" className="text-xs">
                            {train.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Priority {train.priority} • {train.speed_kmph} km/h
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {train.status === 'delayed' || train.status === 'breakdown' ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          BREAKDOWN
                        </Badge>
                      ) : train.delay > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          +{train.delay}min
                        </Badge>
                      ) : isActive ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ON TIME
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          SCHEDULED
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Route & Time Info */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{train.route?.[0]?.stationName || 'Unknown'} → {train.route?.[train.route.length - 1]?.stationName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Depart {departTime}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isActive && position > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Position: {position.toFixed(1)} km</span>
                        <span className="text-foreground font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000 rounded-full"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: getTrainColor(train.type)
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Emergency Alert */}
                  {(train.status === 'delayed' || train.status === 'breakdown') && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                      <div className="flex items-center space-x-1 text-destructive font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        <span>EMERGENCY: Requires immediate assistance</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}