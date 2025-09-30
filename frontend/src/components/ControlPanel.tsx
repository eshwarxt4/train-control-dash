import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimulationState } from '@/types/rail';
import { scenarios } from '@/data/scenarios';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  Train,
  Activity,
  RefreshCw
} from 'lucide-react';

interface ControlPanelProps {
  state: {
    currentTime: string;
    isRunning: boolean;
    trains: any[];
    conflicts: any[];
    scenario: any;
  };
  userRole: 'Controller' | 'Viewer';
  onToggleSimulation: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onLogout: () => void;
  onShowSimulationOverlay: (show: boolean) => void;
  onRefreshData?: () => void;
  isWebSocketConnected?: boolean;
}

export function ControlPanel({
  state,
  userRole,
  onToggleSimulation,
  onLoadScenario,
  onLogout,
  onShowSimulationOverlay,
  onRefreshData,
  isWebSocketConnected = false,
}: ControlPanelProps) {
  const runningTrains = state.trains.filter(t => 
    t.route && t.route.length > 0 && 
    new Date(`2000-01-01 ${state.currentTime}:00`) >= new Date(`2000-01-01 ${t.route[0]?.departureTime || '06:00'}:00`)
  ).length;

  return (
    <div className="bg-panel border-b border-panel-border p-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Brand & Status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Train className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">RAIL-PRISM</h1>
              <p className="text-xs text-muted-foreground">Decision Support System</p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="flex items-center space-x-2 bg-background rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg font-semibold text-foreground">
              {state.currentTime}
            </span>
            <div className={`w-2 h-2 rounded-full ${state.isRunning ? 'bg-success animate-pulse' : 'bg-muted'}`} />
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">{runningTrains}/{state.trains.length} Active</span>
            </div>
            {state.conflicts.length > 0 && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{state.conflicts.length} Conflict{state.conflicts.length > 1 ? 's' : ''}</span>
              </Badge>
            )}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              <span className="text-xs text-muted-foreground">
                {isWebSocketConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Section - Simulation Controls */}
        <div className="flex items-center space-x-2">
          {userRole === 'Controller' && (
            <>
              <Button
                onClick={onToggleSimulation}
                variant={state.isRunning ? 'secondary' : 'default'}
                size="sm"
                className="flex items-center space-x-1"
              >
                {state.isRunning ? (
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
                variant="outline"
                size="sm"
                onClick={() => onShowSimulationOverlay(true)}
                disabled={state.conflicts.length === 0}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Refresh Data Button */}
          {onRefreshData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshData}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          )}
        </div>

        {/* Right Section - User & Settings */}
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Settings className="w-3 h-3" />
            <span>{userRole}</span>
          </Badge>
          
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}