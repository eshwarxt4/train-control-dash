// RAIL-PRISM Type Definitions

export interface Station {
  id: string;
  name: string;
  position: number; // Distance from start in km
}

export interface Train {
  id: string;
  type: 'Express' | 'Local' | 'Freight';
  priority: number;
  start: string;
  depart: string;
  speed_kmph: number;
  length?: number;
  currentPosition?: number;
  currentBlock?: string;
  status: 'scheduled' | 'running' | 'delayed' | 'held' | 'breakdown';
  delay: number; // minutes
  route: string[];
}

export interface Block {
  id: string;
  from: string;
  to: string;
  capacity: number;
  occupied: string[];
  status: 'normal' | 'repair' | 'blocked';
}

export interface RepairWindow {
  id: string;
  block: string;
  start: string;
  end: string;
  flexible: boolean;
  description?: string;
}

export interface Conflict {
  id: string;
  trains: string[];
  block: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface RecommendationOption {
  id: string;
  action: string;
  description: string;
  predictedDelay: number;
  throughputImpact: number;
  confidence: number;
  details: string;
}

export interface Recommendation {
  conflictId: string;
  timestamp: string;
  options: RecommendationOption[];
  selectedOption?: string;
  overrideReason?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  type: 'recommendation' | 'action' | 'override' | 'failure';
  user: string;
  description: string;
  data: any;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  trains: Train[];
  repairs: RepairWindow[];
  initialTime: string;
}

export interface SimulationState {
  currentTime: string;
  isRunning: boolean;
  speed: number; // simulation speed multiplier
  trains: Train[];
  conflicts: Conflict[];
  recommendations: Recommendation[];
  auditLog: AuditEntry[];
  scenario: Scenario | null;
}