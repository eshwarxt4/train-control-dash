// WebSocket Service for Real-time Updates
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to WebSocket server after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to WebSocket server');
      this.isConnected = false;
    });
  }

  // Connection management
  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscription methods
  public subscribeToTrainUpdates(trainId: string) {
    if (this.socket) {
      this.socket.emit('subscribe-train', trainId);
    }
  }

  public unsubscribeFromTrainUpdates(trainId: string) {
    if (this.socket) {
      this.socket.emit('unsubscribe-train', trainId);
    }
  }

  public subscribeToConflicts() {
    if (this.socket) {
      this.socket.emit('subscribe-conflicts');
    }
  }

  public unsubscribeFromConflicts() {
    if (this.socket) {
      this.socket.emit('unsubscribe-conflicts');
    }
  }

  public subscribeToOptimization(conflictId: string) {
    if (this.socket) {
      this.socket.emit('subscribe-optimization', conflictId);
    }
  }

  public unsubscribeFromOptimization(conflictId: string) {
    if (this.socket) {
      this.socket.emit('unsubscribe-optimization', conflictId);
    }
  }

  // Event listeners
  public onTrainPositionUpdate(callback: (data: TrainPositionUpdate) => void) {
    if (this.socket) {
      this.socket.on('train-position-update', callback);
    }
  }

  public offTrainPositionUpdate(callback: (data: TrainPositionUpdate) => void) {
    if (this.socket) {
      this.socket.off('train-position-update', callback);
    }
  }

  public onTrainEvent(callback: (data: TrainEvent) => void) {
    if (this.socket) {
      this.socket.on('train-event', callback);
    }
  }

  public offTrainEvent(callback: (data: TrainEvent) => void) {
    if (this.socket) {
      this.socket.off('train-event', callback);
    }
  }

  public onConflictDetected(callback: (data: Conflict) => void) {
    if (this.socket) {
      this.socket.on('conflict-detected', callback);
    }
  }

  public offConflictDetected(callback: (data: Conflict) => void) {
    if (this.socket) {
      this.socket.off('conflict-detected', callback);
    }
  }

  public onOptimizationResult(callback: (data: OptimizationResult) => void) {
    if (this.socket) {
      this.socket.on('optimization-result', callback);
    }
  }

  public offOptimizationResult(callback: (data: OptimizationResult) => void) {
    if (this.socket) {
      this.socket.off('optimization-result', callback);
    }
  }

  public onGeneralUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('rail-prism-updates', callback);
    }
  }

  public offGeneralUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('rail-prism-updates', callback);
    }
  }

  // Utility methods
  public getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  public emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }
}

// Type definitions
interface TrainPositionUpdate {
  trainId: string;
  timestamp: string;
  position: {
    stationId: string;
    blockId: string;
    distance: number;
    latitude: number;
    longitude: number;
  };
  speed: number;
  status: string;
  delay: number;
}

interface TrainEvent {
  eventType: 'train_delay' | 'train_breakdown' | 'signal_failure' | 'weather_alert' | 'conflict_detected';
  trainId?: string;
  conflictId?: string;
  delayMinutes?: number;
  reason?: string;
  location?: {
    stationId: string;
    distance: number;
    blockId: string;
  };
  blockId?: string;
  estimatedRepairTime?: number;
  weatherType?: string;
  impact?: string;
  timestamp: string;
  conflict?: Conflict;
}

interface Conflict {
  _id: string;
  conflictId: string;
  conflictType: 'headway' | 'platform' | 'block' | 'signal' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  trains: ConflictTrain[];
  location: ConflictLocation;
  conflictTime: string;
  description: string;
  status: 'detected' | 'analyzing' | 'resolved' | 'escalated';
  impact: ConflictImpact;
  createdAt: string;
}

interface ConflictTrain {
  trainId: string;
  trainType: string;
  priority: number;
  currentPosition: {
    stationId: string;
    distance: number;
    blockId: string;
  };
  estimatedArrival: string;
}

interface ConflictLocation {
  stationId: string;
  stationName: string;
  blockId: string;
  blockName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface ConflictImpact {
  affectedTrains: string[];
  estimatedDelay: number;
  throughputImpact: number;
  passengerImpact: number;
}

interface OptimizationResult {
  optimizationId: string;
  conflictId: string;
  timestamp: string;
  algorithm: string;
  processingTime: number;
  options: OptimizationOption[];
  status: string;
  metrics: OptimizationMetrics;
}

interface OptimizationOption {
  optionId: string;
  action: string;
  description: string;
  affectedTrains: AffectedTrain[];
  predictedOutcomes: PredictedOutcomes;
  confidence: number;
  feasibility: number;
  implementationTime: number;
  riskFactors: RiskFactor[];
}

interface AffectedTrain {
  trainId: string;
  action: string;
  delayMinutes: number;
  newRoute: string[] | null;
  newSpeed: number | null;
}

interface PredictedOutcomes {
  totalDelay: number;
  throughputImpact: number;
  passengerImpact: number;
  costImpact: number;
}

interface RiskFactor {
  factor: string;
  probability: number;
  impact: string;
}

interface OptimizationMetrics {
  totalConflictsResolved: number;
  averageDelayReduction: number;
  systemEfficiency: number;
  passengerSatisfaction: number;
}

interface ConnectionStatus {
  connected: boolean;
  socketId: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export types
export type {
  TrainPositionUpdate,
  TrainEvent,
  Conflict,
  OptimizationResult,
  ConnectionStatus
};