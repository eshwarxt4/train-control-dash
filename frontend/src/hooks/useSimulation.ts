import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, TrainSchedule, TrainPosition, Conflict, OptimizationResult } from '@/services/api';
import { websocketService, TrainPositionUpdate, TrainEvent, Conflict as WSConflict } from '@/services/websocket';

interface SimulationState {
  currentTime: string;
  simulationTime: Date;
  isRunning: boolean;
  speed: number; // 1x, 2x, 5x, 10x
  trains: TrainSchedule[];
  activeTrains: TrainPosition[];
  conflicts: Conflict[];
  optimizationResults: OptimizationResult[];
  systemStatus: {
    totalTrains: number;
    activeTrains: number;
    conflicts: number;
    averageDelay: number;
  };
}

interface SimulationControls {
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  setTime: (time: string) => void;
  reset: () => void;
  generateOptimization: (conflictId: string) => Promise<void>;
  selectOptimizationOption: (optimizationId: string, optionId: string) => Promise<void>;
  simulateOptimizationOption: (optimizationId: string, optionId: string) => Promise<void>;
  logDecision: (decision: any) => Promise<void>;
  refreshData: () => Promise<void>;
  calculateTrainPosition: (train: TrainSchedule, time: string) => number;
  isWebSocketConnected: boolean;
}

export function useSimulation(): SimulationState & SimulationControls {
  const [state, setState] = useState<SimulationState>({
    currentTime: '06:00', // Start at 6 AM
    simulationTime: new Date('2024-01-01T06:00:00'),
    isRunning: false,
    speed: 1,
    trains: [],
    activeTrains: [],
    conflicts: [],
    optimizationResults: [],
    systemStatus: {
      totalTrains: 0,
      activeTrains: 0,
      conflicts: 0,
      averageDelay: 0
    }
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsConnectedRef = useRef(false);

  // Initialize simulation
  const initializeSimulation = useCallback(async () => {
    try {
      // Load initial data
      const [trains, activeTrains, conflicts, systemStatus] = await Promise.all([
        apiService.getTrainSchedules({ limit: 50 }),
        apiService.getActiveTrains(20),
        apiService.getActiveConflicts(),
        apiService.getSystemStatus()
      ]);

      setState(prev => ({
        ...prev,
        trains,
        activeTrains,
        conflicts,
        systemStatus
      }));

      // Connect to WebSocket for real-time updates
      if (!wsConnectedRef.current) {
        await websocketService.connect();
        wsConnectedRef.current = true;

        // Set up WebSocket listeners
        websocketService.onTrainPositionUpdate((update: TrainPositionUpdate) => {
          setState(prev => ({
            ...prev,
            activeTrains: prev.activeTrains.map(train => 
              train.trainId === update.trainId 
                ? { ...train, ...update }
                : train
            )
          }));
        });

        websocketService.onTrainEvent((event: TrainEvent) => {
          console.log('Train event:', event);
          // Handle train events (delays, breakdowns, etc.)
        });

        websocketService.onConflict((conflict: WSConflict) => {
          setState(prev => ({
            ...prev,
            conflicts: [...prev.conflicts, conflict]
          }));
        });
      }

    } catch (error) {
      console.error('Failed to initialize simulation:', error);
    }
  }, []);

  // Simulation time ticker
  const tickSimulation = useCallback(() => {
    setState(prev => {
      const newTime = new Date(prev.simulationTime.getTime() + (60000 * prev.speed)); // Add minutes based on speed
      const timeString = newTime.toLocaleTimeString('en-GB', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return {
        ...prev,
        simulationTime: newTime,
        currentTime: timeString
      };
    });
  }, []);

  // Start simulation
  const play = useCallback(async () => {
    if (state.isRunning) return;
    
    try {
      await apiService.startSimulation();
      setState(prev => ({ ...prev, isRunning: true }));
      intervalRef.current = setInterval(tickSimulation, 1000); // Update every second
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  }, [state.isRunning, tickSimulation]);

  // Pause simulation
  const pause = useCallback(async () => {
    try {
      await apiService.stopSimulation();
      setState(prev => ({ ...prev, isRunning: false }));
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Failed to stop simulation:', error);
    }
  }, []);

  // Set simulation speed
  const setSpeed = useCallback(async (speed: number) => {
    try {
      await apiService.setSimulationSpeed(speed);
      setState(prev => ({ ...prev, speed }));
    } catch (error) {
      console.error('Failed to set simulation speed:', error);
    }
  }, []);

  // Set simulation time
  const setTime = useCallback(async (time: string) => {
    try {
      await apiService.setSimulationTime(time);
      const [hours, minutes] = time.split(':').map(Number);
      const newTime = new Date('2024-01-01T06:00:00');
      newTime.setHours(hours, minutes, 0, 0);
      
      setState(prev => ({
        ...prev,
        simulationTime: newTime,
        currentTime: time
      }));
    } catch (error) {
      console.error('Failed to set simulation time:', error);
    }
  }, []);

  // Reset simulation
  const reset = useCallback(async () => {
    try {
      await apiService.resetSimulation();
      await pause();
      await setTime('06:00');
      await setSpeed(1);
    } catch (error) {
      console.error('Failed to reset simulation:', error);
    }
  }, [pause, setTime, setSpeed]);

  // Calculate train position based on simulation time
  const calculateTrainPosition = useCallback((train: TrainSchedule, time: string): number => {
    if (!train.route || train.route.length === 0) return 0;
    
    const [currentHours, currentMinutes] = time.split(':').map(Number);
    const currentTimeMinutes = currentHours * 60 + currentMinutes;
    
    const departTime = train.route[0]?.departureTime || '06:00';
    const [departHours, departMinutes] = departTime.split(':').map(Number);
    const departTimeMinutes = departHours * 60 + departMinutes;
    
    if (currentTimeMinutes < departTimeMinutes) return 0;
    
    const elapsedMinutes = currentTimeMinutes - departTimeMinutes;
    const distance = (elapsedMinutes / 60) * train.averageSpeed;
    
    return Math.min(distance, train.totalDistance);
  }, []);

  // Generate optimization for conflict
  const generateOptimization = useCallback(async (conflictId: string) => {
    try {
      const result = await apiService.generateOptimization(conflictId);
      setState(prev => ({
        ...prev,
        optimizationResults: [...prev.optimizationResults, result]
      }));
    } catch (error) {
      console.error('Failed to generate optimization:', error);
    }
  }, []);

  // Select optimization option
  const selectOptimizationOption = useCallback(async (optimizationId: string, optionId: string, controllerId?: string) => {
    try {
      await apiService.selectOptimizationOption(optimizationId, optionId, controllerId);
      setState(prev => ({
        ...prev,
        optimizationResults: prev.optimizationResults.map(result =>
          result.optimizationId === optimizationId
            ? { ...result, selectedOption: optionId, status: 'accepted' }
            : result
        )
      }));
    } catch (error) {
      console.error('Failed to select optimization option:', error);
    }
  }, []);

  // Simulate optimization option
  const simulateOptimizationOption = useCallback(async (optimizationId: string, optionId: string) => {
    try {
      const result = await apiService.simulateOptimizationOption(optimizationId, optionId);
      console.log('Simulation result:', result);
    } catch (error) {
      console.error('Failed to simulate optimization option:', error);
    }
  }, []);

  // Log decision
  const logDecision = useCallback(async (decision: any) => {
    try {
      await apiService.logDecision(decision);
    } catch (error) {
      console.error('Failed to log decision:', error);
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      const [trains, activeTrains, conflicts, systemStatus] = await Promise.all([
        apiService.getTrainSchedules({ limit: 50 }),
        apiService.getActiveTrains(20),
        apiService.getActiveConflicts(),
        apiService.getSystemStatus()
      ]);

      setState(prev => ({
        ...prev,
        trains,
        activeTrains,
        conflicts,
        systemStatus
      }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeSimulation();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsConnectedRef.current) {
        websocketService.disconnect();
      }
    };
  }, [initializeSimulation]);

  return {
    ...state,
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
    isWebSocketConnected: wsConnectedRef.current
  };
}