import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationState, Train, Conflict, Recommendation, AuditEntry, Scenario, RecommendationOption } from '@/types/rail';
import { scenarios, stations } from '@/data/scenarios';

const SIMULATION_INTERVAL = 1000; // 1 second real time
const TIME_MULTIPLIER = 60; // 1 minute simulation time per second

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    currentTime: '11:00',
    isRunning: false,
    speed: 1,
    trains: [],
    conflicts: [],
    recommendations: [],
    auditLog: [],
    scenario: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  };

  const addMinutes = (timeStr: string, minutes: number): string => {
    const date = parseTime(timeStr);
    date.setMinutes(date.getMinutes() + minutes);
    return formatTime(date);
  };

  const getTimeDifferenceMinutes = (time1: string, time2: string): number => {
    const date1 = parseTime(time1);
    const date2 = parseTime(time2);
    return Math.round((date1.getTime() - date2.getTime()) / 60000);
  };

  // Calculate train position based on current time
  const calculateTrainPosition = useCallback((train: Train, currentTime: string): number => {
    const departTime = parseTime(train.depart);
    const currentDateTime = parseTime(currentTime);
    
    if (currentDateTime < departTime) {
      return 0; // Train hasn't departed yet
    }

    const minutesElapsed = (currentDateTime.getTime() - departTime.getTime()) / 60000;
    const distanceCovered = (train.speed_kmph / 60) * minutesElapsed; // km
    
    // Simple linear position along route
    return Math.min(distanceCovered, 75); // Max 75km (A to D)
  }, []);

  // Detect conflicts between trains
  const detectConflicts = useCallback((trains: Train[], currentTime: string): Conflict[] => {
    const conflicts: Conflict[] = [];
    const runningTrains = trains.filter(t => 
      parseTime(currentTime) >= parseTime(t.depart) && t.status !== 'breakdown'
    );

    for (let i = 0; i < runningTrains.length; i++) {
      for (let j = i + 1; j < runningTrains.length; j++) {
        const train1 = runningTrains[i];
        const train2 = runningTrains[j];
        
        const pos1 = calculateTrainPosition(train1, currentTime);
        const pos2 = calculateTrainPosition(train2, currentTime);
        
        // Check if trains are too close (within 5km)
        if (Math.abs(pos1 - pos2) < 5 && pos1 > 0 && pos2 > 0) {
          conflicts.push({
            id: `conflict-${train1.id}-${train2.id}`,
            trains: [train1.id, train2.id],
            block: pos1 < 25 ? 'A-B' : pos1 < 50 ? 'B-C' : 'C-D',
            time: currentTime,
            severity: train1.type === 'Express' || train2.type === 'Express' ? 'high' : 'medium',
            description: `${train1.id} (${train1.type}) and ${train2.id} (${train2.type}) conflict detected`,
          });
        }
      }
    }

    return conflicts;
  }, [calculateTrainPosition]);

  // Generate AI recommendations for conflicts
  const generateRecommendations = useCallback((conflicts: Conflict[], trains: Train[]): Recommendation[] => {
    return conflicts.map(conflict => {
      const conflictTrains = trains.filter(t => conflict.trains.includes(t.id));
      const options: RecommendationOption[] = [];

      // Option 1: Hold lower priority train
      const lowerPriorityTrain = conflictTrains.reduce((min, train) => 
        train.priority < min.priority ? train : min
      );
      
      options.push({
        id: `hold-${lowerPriorityTrain.id}`,
        action: 'hold',
        description: `Hold ${lowerPriorityTrain.id} for 10 minutes`,
        predictedDelay: 10,
        throughputImpact: -2,
        confidence: 0.85,
        details: `Priority-based holding strategy`,
      });

      // Option 2: Reroute via loop (if available)
      if (conflict.block === 'B-C') {
        options.push({
          id: `reroute-${conflictTrains[0].id}`,
          action: 'reroute',
          description: `Reroute ${conflictTrains[0].id} via B-loop`,
          predictedDelay: 5,
          throughputImpact: 0,
          confidence: 0.92,
          details: `Use alternate loop track at Station B`,
        });
      }

      // Option 3: Speed adjustment
      const fasterTrain = conflictTrains.reduce((max, train) => 
        train.speed_kmph > max.speed_kmph ? train : max
      );
      
      options.push({
        id: `speed-${fasterTrain.id}`,
        action: 'adjust_speed',
        description: `Reduce ${fasterTrain.id} speed by 15%`,
        predictedDelay: 3,
        throughputImpact: -1,
        confidence: 0.75,
        details: `Temporary speed reduction to create separation`,
      });

      return {
        conflictId: conflict.id,
        timestamp: new Date().toISOString(),
        options,
      };
    });
  }, []);

  // Simulation step function
  const simulationStep = useCallback(() => {
    setState(prevState => {
      if (!prevState.isRunning) return prevState;

      const newTime = addMinutes(prevState.currentTime, 1 * prevState.speed);
      const updatedTrains = prevState.trains.map(train => ({
        ...train,
        currentPosition: calculateTrainPosition(train, newTime),
      }));

      // Check for breakdown scenario
      if (prevState.scenario?.id === 'breakdown-scenario' && newTime === '11:22') {
        const f3Index = updatedTrains.findIndex(t => t.id === 'F3');
        if (f3Index !== -1) {
          updatedTrains[f3Index] = { ...updatedTrains[f3Index], status: 'breakdown' };
        }
      }

      const newConflicts = detectConflicts(updatedTrains, newTime);
      const newRecommendations = generateRecommendations(newConflicts, updatedTrains);

      return {
        ...prevState,
        currentTime: newTime,
        trains: updatedTrains,
        conflicts: newConflicts,
        recommendations: [...prevState.recommendations, ...newRecommendations],
      };
    });
  }, [calculateTrainPosition, detectConflicts, generateRecommendations]);

  // Start/stop simulation
  const toggleSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  // Load scenario
  const loadScenario = useCallback((scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setState(prev => ({
        ...prev,
        scenario,
        trains: [...scenario.trains],
        currentTime: scenario.initialTime,
        isRunning: false,
        conflicts: [],
        recommendations: [],
      }));
    }
  }, []);

  // Apply recommendation
  const applyRecommendation = useCallback((recommendationId: string, optionId: string) => {
    setState(prev => {
      const recommendation = prev.recommendations.find(r => r.conflictId === recommendationId);
      const option = recommendation?.options.find(o => o.id === optionId);
      
      if (!recommendation || !option) return prev;

      const auditEntry: AuditEntry = {
        id: `action-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'action',
        user: 'Controller',
        description: `Applied: ${option.description}`,
        data: { recommendation, option },
      };

      return {
        ...prev,
        auditLog: [...prev.auditLog, auditEntry],
      };
    });
  }, []);

  // Override recommendation
  const overrideRecommendation = useCallback((recommendationId: string, reason: string) => {
    setState(prev => {
      const recommendation = prev.recommendations.find(r => r.conflictId === recommendationId);
      if (!recommendation) return prev;

      const auditEntry: AuditEntry = {
        id: `override-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'override',
        user: 'Controller',
        description: `Override: ${reason}`,
        data: { recommendation, reason },
      };

      return {
        ...prev,
        auditLog: [...prev.auditLog, auditEntry],
      };
    });
  }, []);

  // Set up simulation interval
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(simulationStep, SIMULATION_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, simulationStep]);

  return {
    state,
    toggleSimulation,
    loadScenario,
    applyRecommendation,
    overrideRecommendation,
    calculateTrainPosition,
  };
}