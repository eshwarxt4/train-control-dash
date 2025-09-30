import { useState, useEffect } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { TimeDistanceGraph } from './TimeDistanceGraph';
import { RecommendationPanel } from './RecommendationPanel';
import { ControlPanel } from './ControlPanel';
import { AuditLog } from './AuditLog';
import { TrainStatusPanel } from './TrainStatusPanel';
import { MetricsDashboard } from './MetricsDashboard';
import { SimulationControls } from './SimulationControls';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  userRole: 'Controller' | 'Viewer';
  onLogout: () => void;
}

export function Dashboard({ userRole, onLogout }: DashboardProps) {
  const {
    currentTime,
    simulationTime,
    isRunning,
    speed,
    trains,
    activeTrains,
    conflicts,
    optimizationResults,
    systemStatus,
    play,
    pause,
    setSpeed,
    setTime,
    reset,
    generateOptimization,
    selectOptimizationOption,
    simulateOptimizationOption,
    logDecision,
    refreshData,
    calculateTrainPosition,
    isWebSocketConnected
  } = useSimulation();

  const [showSimulationOverlay, setShowSimulationOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const activeRecommendation = optimizationResults.find(r => !r.selectedOption);
  const uiRecommendation = activeRecommendation && {
    conflictId: activeRecommendation.conflictId,
    timestamp: activeRecommendation.timestamp,
    options: activeRecommendation.options.map(opt => ({
      id: opt.optionId,
      action: opt.action,
      description: opt.description,
      predictedDelay: opt.predictedOutcomes.totalDelay,
      throughputImpact: opt.predictedOutcomes.throughputImpact,
      confidence: opt.confidence,
      details: `feasibility:${opt.feasibility}; impl:${opt.implementationTime}ms`
    })),
    selectedOption: activeRecommendation.selectedOption,
    overrideReason: undefined
  } as any;

  // Adapt API TrainSchedule -> UI Train, and API Conflict -> UI Conflict
  const uiTrains = trains.map(t => ({
    id: t.trainId,
    type: (t.trainType === 'Express' || t.trainType === 'Local' || t.trainType === 'Freight') ? t.trainType : 'Local',
    priority: t.priority,
    start: t.route?.[0]?.stationId || '',
    depart: t.route?.[0]?.departureTime || '00:00',
    speed_kmph: t.averageSpeed,
    length: undefined,
    currentPosition: undefined,
    currentBlock: undefined,
    status: (t.status === 'cancelled' ? 'delayed' : (t.status === 'completed' ? 'scheduled' : t.status)) as any,
    delay: t.totalDelay || 0,
    route: t.route?.map(r => r.stationId) || []
  }));

  const uiConflicts = conflicts.map(c => ({
    id: c.conflictId,
    trains: c.trains.map(ct => ct.trainId),
    block: c.location.blockId,
    time: c.conflictTime,
    severity: (c.severity === 'low' || c.severity === 'medium' || c.severity === 'high') ? c.severity : 'high',
    description: c.description
  }));

  const calcPositionForUiTrain = (train: any, time: string) => {
    const scheduleLike: any = {
      route: [ { departureTime: train.depart } ],
      averageSpeed: train.speed_kmph,
      totalDistance: 75
    };
    return calculateTrainPosition(scheduleLike, time);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Control Panel */}
      <ControlPanel
        state={{
          currentTime: currentTime,
          isRunning: isRunning,
          trains: trains,
          conflicts: conflicts,
          scenario: null
        }}
        userRole={userRole}
        onToggleSimulation={isRunning ? pause : play}
        onLoadScenario={() => {}} // Not used in real-time mode
        onLogout={onLogout}
        onShowSimulationOverlay={setShowSimulationOverlay}
        onRefreshData={refreshData}
        isWebSocketConnected={isWebSocketConnected}
      />
      
      {/* Main Dashboard with Tabs */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="dashboard">Control Dashboard</TabsTrigger>
            <TabsTrigger value="metrics">Metrics & Analytics</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Control Dashboard Tab */}
          <TabsContent value="dashboard" className="h-full">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Time-Distance Graph - Left Panel */}
              <div className="col-span-7">
                <Card className="h-full p-4 bg-graph border-panel-border">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Time-Distance Graph</h3>
                  <TimeDistanceGraph
                    trains={uiTrains as any}
                    currentTime={currentTime}
                    conflicts={uiConflicts as any}
                    calculateTrainPosition={calcPositionForUiTrain as any}
                    showSimulationOverlay={showSimulationOverlay}
                  />
                </Card>
              </div>

              {/* Recommendation Panel - Right Panel */}
              <div className="col-span-5 space-y-4">
                <SimulationControls
                  currentTime={currentTime}
                  isRunning={isRunning}
                  speed={speed}
                  onPlay={play}
                  onPause={pause}
                  onSetSpeed={setSpeed}
                  onSetTime={setTime}
                  onReset={reset}
                />
                
                {activeRecommendation ? (
                  <RecommendationPanel
                    recommendation={uiRecommendation}
                    userRole={userRole}
                    onApplyRecommendation={async (conflictId, optionId) => {
                      try {
                        await selectOptimizationOption(activeRecommendation.optimizationId, optionId);
                        await logDecision({
                          conflictId,
                          optimizationId: activeRecommendation.optimizationId,
                          controllerId: userRole,
                          controllerRole: userRole,
                          decision: 'accepted',
                          selectedOption: activeRecommendation.options.find(opt => opt.optionId === optionId),
                          reasoning: 'AI recommendation accepted',
                          responseTime: Date.now() - new Date(activeRecommendation.timestamp).getTime()
                        });
                      } catch (error) {
                        console.error('Failed to apply recommendation:', error);
                      }
                    }}
                    onOverrideRecommendation={async (conflictId, reason) => {
                      try {
                        await logDecision({
                          conflictId,
                          optimizationId: activeRecommendation.optimizationId,
                          controllerId: userRole,
                          controllerRole: userRole,
                          decision: 'override',
                          selectedOption: null,
                          reasoning: reason,
                          responseTime: Date.now() - new Date(activeRecommendation.timestamp).getTime()
                        });
                      } catch (error) {
                        console.error('Failed to override recommendation:', error);
                      }
                    }}
                    onShowSimulation={async () => {
                      if (activeRecommendation) {
                        try {
                          await simulateOptimizationOption(activeRecommendation.conflictId, activeRecommendation.options[0].optionId);
                          setShowSimulationOverlay(true);
                        } catch (error) {
                          console.error('Failed to simulate option:', error);
                        }
                      }
                    }}
                  />
                ) : (
                  <Card className="h-96 p-6 bg-panel border-panel-border flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">All Clear</h3>
                      <p className="text-muted-foreground">No active conflicts detected</p>
                      {conflicts.length === 0 && trains.length > 0 && (
                        <p className="text-sm text-success mt-2">✓ Traffic flowing normally</p>
                      )}
                    </div>
                  </Card>
                )}
                
                {/* Train Status Panel */}
                <TrainStatusPanel
                  trains={uiTrains as any}
                  currentTime={currentTime}
                  calculateTrainPosition={calcPositionForUiTrain as any}
                />
              </div>
            </div>
          </TabsContent>

          {/* Metrics Dashboard Tab */}
          <TabsContent value="metrics" className="h-full">
            <MetricsDashboard 
              userRole={userRole}
            />
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="h-full">
            <AuditLog
              auditLog={[]} // Will be populated from API
              userRole={userRole}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}