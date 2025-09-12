import { useState, useEffect } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { TimeDistanceGraph } from './TimeDistanceGraph';
import { RecommendationPanel } from './RecommendationPanel';
import { ControlPanel } from './ControlPanel';
import { AuditLog } from './AuditLog';
import { TrainStatusPanel } from './TrainStatusPanel';
import { Card } from '@/components/ui/card';

interface DashboardProps {
  userRole: 'Controller' | 'Viewer';
  onLogout: () => void;
}

export function Dashboard({ userRole, onLogout }: DashboardProps) {
  const {
    state,
    toggleSimulation,
    loadScenario,
    applyRecommendation,
    overrideRecommendation,
    calculateTrainPosition,
  } = useSimulation();

  const [showSimulationOverlay, setShowSimulationOverlay] = useState(false);

  // Load default scenario on mount
  useEffect(() => {
    if (!state.scenario) {
      loadScenario('normal-day');
    }
  }, [state.scenario, loadScenario]);

  const activeRecommendation = state.recommendations.find(r => !r.selectedOption);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Control Panel */}
      <ControlPanel
        state={state}
        userRole={userRole}
        onToggleSimulation={toggleSimulation}
        onLoadScenario={loadScenario}
        onLogout={onLogout}
        onShowSimulationOverlay={setShowSimulationOverlay}
      />

      {/* Main Dashboard Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Time-Distance Graph - Left Panel */}
        <div className="col-span-7">
          <Card className="h-full p-4 bg-graph border-panel-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Time-Distance Graph</h3>
            <TimeDistanceGraph
              trains={state.trains}
              currentTime={state.currentTime}
              conflicts={state.conflicts}
              calculateTrainPosition={calculateTrainPosition}
              showSimulationOverlay={showSimulationOverlay}
            />
          </Card>
        </div>

        {/* Recommendation Panel - Right Panel */}
        <div className="col-span-5 space-y-4">
          {activeRecommendation ? (
            <RecommendationPanel
              recommendation={activeRecommendation}
              userRole={userRole}
              onApplyRecommendation={applyRecommendation}
              onOverrideRecommendation={overrideRecommendation}
              onShowSimulation={() => setShowSimulationOverlay(true)}
            />
          ) : (
            <Card className="h-96 p-6 bg-panel border-panel-border flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">All Clear</h3>
                <p className="text-muted-foreground">No active conflicts detected</p>
                {state.conflicts.length === 0 && state.trains.length > 0 && (
                  <p className="text-sm text-success mt-2">✓ Traffic flowing normally</p>
                )}
              </div>
            </Card>
          )}
          
          {/* Train Status Panel */}
          <TrainStatusPanel
            trains={state.trains}
            currentTime={state.currentTime}
            calculateTrainPosition={calculateTrainPosition}
          />
        </div>

        {/* Audit Log - Bottom Panel */}
        <div className="col-span-12">
          <AuditLog
            auditLog={state.auditLog}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}