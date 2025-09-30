// API Service for RAIL-PRISM Backend Communication
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Train API methods
  async getTrainSchedules(params?: {
    status?: string;
    trainType?: string;
    limit?: number;
  }): Promise<TrainSchedule[]> {
    const response: AxiosResponse<ApiResponse<TrainSchedule[]>> = await this.api.get('/trains/schedules', { params });
    return response.data.data;
  }

  async getTrainSchedule(trainId: string): Promise<TrainSchedule> {
    const response: AxiosResponse<ApiResponse<TrainSchedule>> = await this.api.get(`/trains/schedules/${trainId}`);
    return response.data.data;
  }

  async getTrainPositions(params?: {
    trainId?: string;
    limit?: number;
    minutes?: number;
  }): Promise<TrainPosition[]> {
    const response: AxiosResponse<ApiResponse<TrainPosition[]>> = await this.api.get('/trains/positions', { params });
    return response.data.data;
  }

  async getTrainPositionHistory(trainId: string, params?: {
    limit?: number;
    hours?: number;
  }): Promise<TrainPosition[]> {
    const response: AxiosResponse<ApiResponse<TrainPosition[]>> = await this.api.get(`/trains/positions/${trainId}`, { params });
    return response.data.data;
  }

  async getActiveTrains(limit?: number): Promise<ActiveTrain[]> {
    const response: AxiosResponse<ApiResponse<ActiveTrain[]>> = await this.api.get('/trains/active', { params: { limit } });
    return response.data.data;
  }

  async getTrainStatus(): Promise<TrainStatusSummary> {
    const response: AxiosResponse<ApiResponse<TrainStatusSummary>> = await this.api.get('/trains/status');
    return response.data.data;
  }

  async updateTrainStatus(trainId: string, status: string, delay?: number, reason?: string): Promise<TrainSchedule> {
    const response: AxiosResponse<ApiResponse<TrainSchedule>> = await this.api.put(`/trains/schedules/${trainId}/status`, {
      status,
      delay,
      reason
    });
    return response.data.data;
  }

  async getDelayedTrains(minDelay?: number): Promise<TrainSchedule[]> {
    const response: AxiosResponse<ApiResponse<TrainSchedule[]>> = await this.api.get('/trains/delays', { 
      params: { minDelay } 
    });
    return response.data.data;
  }

  // Conflict API methods
  async getConflicts(params?: {
    status?: string;
    severity?: string;
    limit?: number;
    hours?: number;
  }): Promise<Conflict[]> {
    const response: AxiosResponse<ApiResponse<Conflict[]>> = await this.api.get('/conflicts', { params });
    return response.data.data;
  }

  async getActiveConflicts(): Promise<Conflict[]> {
    const response: AxiosResponse<ApiResponse<Conflict[]>> = await this.api.get('/conflicts/active');
    return response.data.data;
  }

  async getConflict(conflictId: string): Promise<Conflict> {
    const response: AxiosResponse<ApiResponse<Conflict>> = await this.api.get(`/conflicts/${conflictId}`);
    return response.data.data;
  }

  async updateConflictStatus(conflictId: string, status: string, resolution?: ConflictResolution): Promise<Conflict> {
    const response: AxiosResponse<ApiResponse<Conflict>> = await this.api.put(`/conflicts/${conflictId}/status`, {
      status,
      resolution
    });
    return response.data.data;
  }

  async getConflictStats(days?: number): Promise<ConflictStats> {
    const response: AxiosResponse<ApiResponse<ConflictStats>> = await this.api.get('/conflicts/stats', { 
      params: { days } 
    });
    return response.data.data;
  }

  async escalateConflict(conflictId: string, reason: string, escalatedBy: string): Promise<Conflict> {
    const response: AxiosResponse<ApiResponse<Conflict>> = await this.api.post(`/conflicts/${conflictId}/escalate`, {
      reason,
      escalatedBy
    });
    return response.data.data;
  }

  async getConflictsByLocation(stationId: string, hours?: number): Promise<Conflict[]> {
    const response: AxiosResponse<ApiResponse<Conflict[]>> = await this.api.get(`/conflicts/location/${stationId}`, { 
      params: { hours } 
    });
    return response.data.data;
  }

  // Optimization API methods
  async generateOptimization(conflictId: string): Promise<OptimizationResult> {
    const response: AxiosResponse<ApiResponse<OptimizationResult>> = await this.api.post(`/optimization/conflict/${conflictId}`);
    return response.data.data;
  }

  async getOptimizationResults(params?: {
    conflictId?: string;
    status?: string;
    limit?: number;
    hours?: number;
  }): Promise<OptimizationResult[]> {
    const response: AxiosResponse<ApiResponse<OptimizationResult[]>> = await this.api.get('/optimization/results', { params });
    return response.data.data;
  }

  async getOptimizationResult(optimizationId: string): Promise<OptimizationResult> {
    const response: AxiosResponse<ApiResponse<OptimizationResult>> = await this.api.get(`/optimization/results/${optimizationId}`);
    return response.data.data;
  }

  async selectOptimizationOption(optimizationId: string, optionId: string, controllerId?: string, reasoning?: string): Promise<OptimizationResult> {
    const response: AxiosResponse<ApiResponse<OptimizationResult>> = await this.api.put(`/optimization/results/${optimizationId}/select`, {
      optionId,
      controllerId: controllerId || 'demo-controller',
      reasoning
    });
    return response.data.data;
  }

  async simulateOptimizationOption(conflictId: string, optionId: string, simulationTime?: number): Promise<OptimizationSimulation> {
    const response: AxiosResponse<ApiResponse<OptimizationSimulation>> = await this.api.post('/optimization/simulate', {
      conflictId,
      optionId,
      simulationTime
    });
    return response.data.data;
  }

  async getOptimizationMetrics(days?: number): Promise<OptimizationMetrics> {
    const response: AxiosResponse<ApiResponse<OptimizationMetrics>> = await this.api.get('/optimization/metrics', { 
      params: { days } 
    });
    return response.data.data;
  }

  async provideOptimizationFeedback(optimizationId: string, controllerRating: number, effectiveness: number, comments?: string): Promise<OptimizationResult> {
    const response: AxiosResponse<ApiResponse<OptimizationResult>> = await this.api.post('/optimization/feedback', {
      optimizationId,
      controllerRating,
      effectiveness,
      comments
    });
    return response.data.data;
  }

  // Decision API methods
  async logDecision(decision: DecisionLogInput): Promise<DecisionLog> {
    const response: AxiosResponse<ApiResponse<DecisionLog>> = await this.api.post('/decisions', decision);
    return response.data.data;
  }

  async getDecisions(params?: {
    controllerId?: string;
    decision?: string;
    conflictId?: string;
    limit?: number;
    hours?: number;
  }): Promise<DecisionLog[]> {
    const response: AxiosResponse<ApiResponse<DecisionLog[]>> = await this.api.get('/decisions', { params });
    return response.data.data;
  }

  async getDecision(decisionId: string): Promise<DecisionLog> {
    const response: AxiosResponse<ApiResponse<DecisionLog>> = await this.api.get(`/decisions/${decisionId}`);
    return response.data.data;
  }

  async updateDecisionOutcome(decisionId: string, outcome: DecisionOutcome): Promise<DecisionLog> {
    const response: AxiosResponse<ApiResponse<DecisionLog>> = await this.api.put(`/decisions/${decisionId}/outcome`, outcome);
    return response.data.data;
  }

  async getControllerMetrics(controllerId: string, days?: number): Promise<ControllerMetrics> {
    const response: AxiosResponse<ApiResponse<ControllerMetrics>> = await this.api.get(`/decisions/controller/${controllerId}/metrics`, { 
      params: { days } 
    });
    return response.data.data;
  }

  async getDecisionStats(days?: number): Promise<DecisionStats> {
    const response: AxiosResponse<ApiResponse<DecisionStats>> = await this.api.get('/decisions/stats', { 
      params: { days } 
    });
    return response.data.data;
  }

  async getDecisionTrends(days?: number, interval?: string): Promise<DecisionTrend[]> {
    const response: AxiosResponse<ApiResponse<DecisionTrend[]>> = await this.api.get('/decisions/analytics/trends', { 
      params: { days, interval } 
    });
    return response.data.data;
  }

  async getPerformanceAnalytics(days?: number): Promise<PerformanceAnalytics[]> {
    const response: AxiosResponse<ApiResponse<PerformanceAnalytics[]>> = await this.api.get('/decisions/analytics/performance', { 
      params: { days } 
    });
    return response.data.data;
  }

  // Health check
  async getHealthStatus(): Promise<HealthStatus> {
    const response: AxiosResponse<HealthStatus> = await this.api.get('/health');
    return response.data;
  }

  // Simulation Control API methods
  async getSimulationStatus(): Promise<{
    isRunning: boolean;
    simulationTime: string;
    simulationSpeed: number;
    trainsCount: number;
  }> {
    const response = await this.api.get('/simulation/status');
    return response.data.data;
  }

  async startSimulation(): Promise<void> {
    await this.api.post('/simulation/start');
  }

  async stopSimulation(): Promise<void> {
    await this.api.post('/simulation/stop');
  }

  async setSimulationTime(time: string): Promise<void> {
    await this.api.post('/simulation/time', { time });
  }

  async setSimulationSpeed(speed: number): Promise<void> {
    await this.api.post('/simulation/speed', { speed });
  }

  async resetSimulation(): Promise<void> {
    await this.api.post('/simulation/reset');
  }
}

// Type definitions
interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
}

// Train types
interface TrainSchedule {
  _id: string;
  trainId: string;
  trainNumber: string;
  trainType: 'Express' | 'Local' | 'Freight' | 'Rajdhani' | 'Shatabdi';
  priority: number;
  route: TrainRoute[];
  totalDistance: number;
  averageSpeed: number;
  status: 'scheduled' | 'running' | 'delayed' | 'cancelled' | 'completed';
  currentPosition: TrainPosition;
  delays: TrainDelay[];
  totalDelay: number;
  createdAt: string;
  updatedAt: string;
}

interface TrainRoute {
  stationId: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  distance: number;
  platform: string;
}

interface TrainPosition {
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
  direction: 'up' | 'down';
  status: 'running' | 'stopped' | 'delayed' | 'breakdown';
  nextStation?: {
    stationId: string;
    stationName: string;
    estimatedArrival: string;
  };
  delay: number;
  metadata?: {
    signalAspect: string;
    trackCondition: string;
    weatherCondition: string;
    temperature: number;
  };
}

interface ActiveTrain {
  trainId: string;
  position: TrainPosition['position'];
  speed: number;
  status: string;
  delay: number;
  timestamp: string;
}

interface TrainDelay {
  stationId: string;
  delayMinutes: number;
  reason: string;
  timestamp: string;
}

interface TrainStatusSummary {
  summary: {
    total: number;
    scheduled: number;
    running: number;
    delayed: number;
    breakdown: number;
    completed: number;
  };
  averageDelay: number;
  trainsByType: Record<string, number>;
  lastUpdated: string;
}

// Conflict types
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
  resolution?: ConflictResolution;
  createdAt: string;
  resolvedAt?: string;
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

interface ConflictResolution {
  selectedOption: string;
  appliedBy: string;
  appliedAt: string;
  reason: string;
  effectiveness: number;
}

interface ConflictStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  resolved: number;
  active: number;
  averageResolutionTime: number;
  resolutionRate: number;
  period: string;
  lastUpdated: string;
}

// Optimization types
interface OptimizationResult {
  _id: string;
  optimizationId: string;
  conflictId: string;
  timestamp: string;
  algorithm: 'cp-sat' | 'genetic' | 'simulated_annealing' | 'rule_based';
  processingTime: number;
  options: OptimizationOption[];
  selectedOption?: string;
  status: 'generated' | 'presented' | 'accepted' | 'rejected' | 'implemented';
  metrics: OptimizationMetrics;
  feedback?: OptimizationFeedback;
  createdAt: string;
  updatedAt: string;
}

interface OptimizationOption {
  optionId: string;
  action: 'hold' | 'reroute' | 'speed_adjust' | 'platform_change' | 'delay';
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
  totalOptimizations: number;
  acceptanceRate: number;
  averageProcessingTime: number;
  averageConfidence: number;
  byAlgorithm: Record<string, number>;
  totalConflictsResolved: number;
  averageDelayReduction: number;
  systemEfficiency: number;
  passengerSatisfaction: number;
}

interface OptimizationFeedback {
  controllerRating: number;
  effectiveness: number;
  comments: string;
  timestamp: string;
}

interface OptimizationSimulation {
  option: OptimizationOption;
  simulation: {
    optionId: string;
    action: string;
    simulationTime: number;
    predictedOutcomes: PredictedOutcomes;
    timeline: SimulationEvent[];
    finalMetrics: PredictedOutcomes;
  };
  simulationTime: string;
}

interface SimulationEvent {
  time: number;
  event: string;
  impact: string;
  description: string;
}

// Decision types
interface DecisionLog {
  _id: string;
  decisionId: string;
  conflictId: string;
  optimizationId: string;
  controllerId: string;
  controllerRole: 'Controller' | 'Viewer';
  decision: 'accepted' | 'rejected' | 'modified' | 'override';
  selectedOption: DecisionSelectedOption;
  reasoning: string;
  timestamp: string;
  responseTime: number;
  outcome?: DecisionOutcome;
  context: DecisionContext;
  createdAt: string;
  updatedAt: string;
}

interface DecisionLogInput {
  conflictId: string;
  optimizationId: string;
  controllerId: string;
  controllerRole: 'Controller' | 'Viewer';
  decision: 'accepted' | 'rejected' | 'modified' | 'override';
  selectedOption: DecisionSelectedOption | null;
  reasoning: string;
  responseTime: number;
}

interface DecisionSelectedOption {
  optionId: string;
  action: string;
  description: string;
  modifications?: DecisionModification[];
}

interface DecisionModification {
  field: string;
  originalValue: any;
  newValue: any;
  reason: string;
}

interface DecisionOutcome {
  actualDelay: number;
  actualThroughputImpact: number;
  passengerFeedback: number;
  effectiveness: number;
}

interface DecisionContext {
  timeOfDay: string;
  dayOfWeek: string;
  weatherCondition: string;
  systemLoad: number;
  previousDecisions: string[];
}

interface ControllerMetrics {
  totalDecisions: number;
  successRate: number;
  averageResponseTime: number;
  averageEffectiveness: number;
  timeRange: number;
}

interface DecisionStats {
  total: number;
  byDecision: Record<string, number>;
  byController: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
  averageEffectiveness: number;
  period: string;
  lastUpdated: string;
}

interface DecisionTrend {
  _id: string;
  totalDecisions: number;
  acceptedDecisions: number;
  rejectedDecisions: number;
  averageResponseTime: number;
  averageEffectiveness: number;
}

interface PerformanceAnalytics {
  controllerId: string;
  totalDecisions: number;
  successRate: number;
  averageResponseTime: number;
  averageEffectiveness: number;
  decisions: Array<{
    decision: string;
    effectiveness: number;
    responseTime: number;
    timestamp: string;
  }>;
}

export const apiService = new ApiService();
export type {
  TrainSchedule,
  TrainPosition,
  ActiveTrain,
  TrainStatusSummary,
  Conflict,
  ConflictStats,
  OptimizationResult,
  OptimizationOption,
  OptimizationSimulation,
  DecisionLog,
  DecisionLogInput,
  ControllerMetrics,
  DecisionStats,
  HealthStatus
};