import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, TrainSchedule, TrainPosition, Conflict, OptimizationResult } from '@/services/api';
import { websocketService, TrainPositionUpdate, TrainEvent, Conflict as WSConflict } from '@/services/websocket';

interface SimulationState {
  currentTime: string;
  isRunning: boolean;
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

export function useRealTimeSimulation() {
  const [state, setState] = useState<SimulationState>({
    currentTime: new Date().toLocaleTimeString('en-GB', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    isRunning: false,
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
        apiService.getTrainStatus()
      ]);

      setState(prev => ({
        ...prev,
        trains,
        activeTrains,
        conflicts,
        systemStatus: {
          totalTrains: systemStatus.summary.total,
          activeTrains: systemStatus.summary.running,
          conflicts: conflicts.length,
          averageDelay: systemStatus.averageDelay
        }
      }));

      // Set up WebSocket listeners
      setupWebSocketListeners();

    } catch (error) {
      console.error('Failed to initialize simulation:', error);
    }
  }, []);

  // Set up WebSocket listeners
  const setupWebSocketListeners = useCallback(() => {
    // Train position updates
    websocketService.onTrainPositionUpdate((data: TrainPositionUpdate) => {
      setState(prev => ({
        ...prev,
        activeTrains: prev.activeTrains.map(train => 
          train.trainId === data.trainId 
            ? { ...train, ...data }
            : train
        ).filter(train => 
          prev.activeTrains.some(at => at.trainId === train.trainId) || 
          data.trainId === train.trainId
        )
      }));
    });

    // Train events
    websocketService.onTrainEvent((data: TrainEvent) => {
      console.log('Train event received:', data);
      
      if (data.eventType === 'conflict_detected' && data.conflict) {
        setState(prev => ({
          ...prev,
          conflicts: [...prev.conflicts, data.conflict as Conflict],
          systemStatus: {
            ...prev.systemStatus,
            conflicts: prev.systemStatus.conflicts + 1
          }
        }));
      }
    });

    // Conflict detection
    websocketService.onConflictDetected((data: WSConflict) => {
      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, data as Conflict],
        systemStatus: {
          ...prev.systemStatus,
          conflicts: prev.systemStatus.conflicts + 1
        }
      }));
    });

    // Optimization results
    websocketService.onOptimizationResult((data: OptimizationResult) => {
      setState(prev => ({
        ...prev,
        optimizationResults: [...prev.optimizationResults, data]
      }));
    });

    wsConnectedRef.current = true;
  }, []);

  // Start simulation
  const startSimulation = useCallback(() => {
    if (state.isRunning) return;

    setState(prev => ({ ...prev, isRunning: true }));

    // Subscribe to WebSocket updates
    websocketService.subscribeToConflicts();

    // Start time update interval
    intervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString('en-GB', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
    }, 1000);

  }, [state.isRunning]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Unsubscribe from WebSocket updates
    websocketService.unsubscribeFromConflicts();
  }, []);

  // Generate optimization for conflict
  const generateOptimization = useCallback(async (conflictId: string) => {
    try {
      const optimization = await apiService.generateOptimization(conflictId);
      setState(prev => ({
        ...prev,
        optimizationResults: [...prev.optimizationResults, optimization]
      }));
      return optimization;
    } catch (error) {
      console.error('Failed to generate optimization:', error);
      throw error;
    }
  }, []);

  // Select optimization option
  const selectOptimizationOption = useCallback(async (
    optimizationId: string, 
    optionId: string, 
    controllerId: string, 
    reasoning?: string
  ) => {
    try {
      const result = await apiService.selectOptimizationOption(
        optimizationId, 
        optionId, 
        controllerId, 
        reasoning
      );

      // Update conflict status
      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.map(conflict => 
          conflict.conflictId === result.conflictId
            ? { ...conflict, status: 'resolved' as const }
            : conflict
        ),
        systemStatus: {
          ...prev.systemStatus,
          conflicts: Math.max(0, prev.systemStatus.conflicts - 1)
        }
      }));

      return result;
    } catch (error) {
      console.error('Failed to select optimization option:', error);
      throw error;
    }
  }, []);

  // Simulate optimization option
  const simulateOptimizationOption = useCallback(async (
    conflictId: string, 
    optionId: string, 
    simulationTime?: number
  ) => {
    try {
      const simulation = await apiService.simulateOptimizationOption(
        conflictId, 
        optionId, 
        simulationTime
      );
      return simulation;
    } catch (error) {
      console.error('Failed to simulate optimization option:', error);
      throw error;
    }
  }, []);

  // Log decision
  const logDecision = useCallback(async (decisionData: {
    conflictId: string;
    optimizationId: string;
    controllerId: string;
    controllerRole: 'Controller' | 'Viewer';
    decision: 'accepted' | 'rejected' | 'modified' | 'override';
    selectedOption: any;
    reasoning: string;
    responseTime: number;
  }) => {
    try {
      const decision = await apiService.logDecision(decisionData);
      return decision;
    } catch (error) {
      console.error('Failed to log decision:', error);
      throw error;
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      const [activeTrains, conflicts, systemStatus] = await Promise.all([
        apiService.getActiveTrains(20),
        apiService.getActiveConflicts(),
        apiService.getTrainStatus()
      ]);

      setState(prev => ({
        ...prev,
        activeTrains,
        conflicts,
        systemStatus: {
          totalTrains: systemStatus.summary.total,
          activeTrains: systemStatus.summary.running,
          conflicts: conflicts.length,
          averageDelay: systemStatus.averageDelay
        }
      }));
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  // Calculate train position
  const calculateTrainPosition = useCallback((train: TrainSchedule, currentTime: string): number => {
    const departTime = new Date(`2000-01-01 ${train.route[0].departureTime}:00`);
    const currentDateTime = new Date(`2000-01-01 ${currentTime}:00`);
    
    if (currentDateTime < departTime) {
      return 0; // Train hasn't departed yet
    }

    const minutesElapsed = (currentDateTime.getTime() - departTime.getTime()) / 60000;
    const distanceCovered = (train.averageSpeed / 60) * minutesElapsed; // km
    
    // Simple linear position along route
    return Math.min(distanceCovered, train.totalDistance);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeSimulation();

    return () => {
      stopSimulation();
      websocketService.disconnect();
    };
  }, [initializeSimulation, stopSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      websocketService.disconnect();
    };
  }, []);

  return {
    state,
    startSimulation,
    stopSimulation,
    generateOptimization,
    selectOptimizationOption,
    simulateOptimizationOption,
    logDecision,
    refreshData,
    calculateTrainPosition,
    isWebSocketConnected: websocketService.isSocketConnected()
  };
}