import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiService, TrainStatusSummary, ConflictStats, OptimizationMetrics, DecisionStats } from '@/services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Target,
  Users,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface MetricsDashboardProps {
  userRole: 'Controller' | 'Viewer';
}

export function MetricsDashboard({ userRole }: MetricsDashboardProps) {
  const [trainMetrics, setTrainMetrics] = useState<TrainStatusSummary | null>(null);
  const [conflictMetrics, setConflictMetrics] = useState<ConflictStats | null>(null);
  const [optimizationMetrics, setOptimizationMetrics] = useState<OptimizationMetrics | null>(null);
  const [decisionMetrics, setDecisionMetrics] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [trainData, conflictData, optimizationData, decisionData] = await Promise.all([
        apiService.getTrainStatus(),
        apiService.getConflictStats(7),
        apiService.getOptimizationMetrics(7),
        apiService.getDecisionStats(7)
      ]);

      setTrainMetrics(trainData);
      setConflictMetrics(conflictData);
      setOptimizationMetrics(optimizationData);
      setDecisionMetrics(decisionData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-success';
      case 'delayed': return 'text-warning';
      case 'breakdown': return 'text-destructive';
      case 'scheduled': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Metrics Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time performance indicators and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Live Data</span>
          </Badge>
          <Button
            onClick={fetchMetrics}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Trains</p>
              <p className="text-2xl font-bold text-foreground">
                {trainMetrics?.summary.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-success">Running: {trainMetrics?.summary.running || 0}</span>
              <span className="text-warning">Delayed: {trainMetrics?.summary.delayed || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Conflicts</p>
              <p className="text-2xl font-bold text-foreground">
                {conflictMetrics?.active || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-destructive">Critical: {conflictMetrics?.bySeverity.critical || 0}</span>
              <span className="text-warning">High: {conflictMetrics?.bySeverity.high || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Delay</p>
              <p className="text-2xl font-bold text-foreground">
                {trainMetrics?.averageDelay.toFixed(1) || 0} min
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
          <div className="mt-2">
            <Progress 
              value={Math.min((trainMetrics?.averageDelay || 0) * 2, 100)} 
              className="h-2"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {conflictMetrics?.resolutionRate.toFixed(1) || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-success" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-success">Resolved: {conflictMetrics?.resolved || 0}</span>
              <span className="text-muted-foreground">Total: {conflictMetrics?.total || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="trains" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trains">Trains</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        {/* Train Metrics Tab */}
        <TabsContent value="trains" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Train Status Distribution</span>
              </h3>
              <div className="space-y-3">
                {trainMetrics && Object.entries(trainMetrics.summary).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'running' ? 'bg-success' :
                        status === 'delayed' ? 'bg-warning' :
                        status === 'breakdown' ? 'bg-destructive' :
                        'bg-muted-foreground'
                      }`} />
                      <span className="capitalize text-sm text-foreground">{status}</span>
                    </div>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Trains by Type</span>
              </h3>
              <div className="space-y-3">
                {trainMetrics && Object.entries(trainMetrics.trainsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{type}</span>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={(count / trainMetrics.summary.total) * 100} 
                        className="w-20 h-2"
                      />
                      <span className="font-semibold text-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Conflict Metrics Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span>Conflict Severity</span>
              </h3>
              <div className="space-y-3">
                {conflictMetrics && Object.entries(conflictMetrics.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        severity === 'critical' ? 'bg-destructive' :
                        severity === 'high' ? 'bg-warning' :
                        severity === 'medium' ? 'bg-primary' :
                        'bg-success'
                      }`} />
                      <span className="capitalize text-sm text-foreground">{severity}</span>
                    </div>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-primary" />
                <span>Conflict Types</span>
              </h3>
              <div className="space-y-3">
                {conflictMetrics && Object.entries(conflictMetrics.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Resolution Metrics</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Resolution Time</span>
                  <span className="font-semibold text-foreground">
                    {conflictMetrics?.averageResolutionTime || 0} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolution Rate</span>
                  <span className="font-semibold text-success">
                    {conflictMetrics?.resolutionRate.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Conflicts</span>
                  <span className="font-semibold text-warning">
                    {conflictMetrics?.active || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Metrics Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Optimization Performance</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Optimizations</span>
                  <span className="font-semibold text-foreground">
                    {optimizationMetrics?.totalOptimizations || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                  <span className="font-semibold text-success">
                    {optimizationMetrics?.acceptanceRate.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Processing Time</span>
                  <span className="font-semibold text-foreground">
                    {optimizationMetrics?.averageProcessingTime.toFixed(0) || 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Confidence</span>
                  <span className="font-semibold text-primary">
                    {(optimizationMetrics?.averageConfidence * 100).toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Algorithm Performance</span>
              </h3>
              <div className="space-y-3">
                {optimizationMetrics && Object.entries(optimizationMetrics.byAlgorithm).map(([algorithm, count]) => (
                  <div key={algorithm} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{algorithm.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={(count / optimizationMetrics.totalOptimizations) * 100} 
                        className="w-20 h-2"
                      />
                      <span className="font-semibold text-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Decision Metrics Tab */}
        <TabsContent value="decisions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Decision Summary</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Decisions</span>
                  <span className="font-semibold text-foreground">
                    {decisionMetrics?.total || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-success">
                    {decisionMetrics?.successRate.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-semibold text-foreground">
                    {(decisionMetrics?.averageResponseTime / 1000).toFixed(1) || 0}s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Effectiveness</span>
                  <span className="font-semibold text-primary">
                    {decisionMetrics?.averageEffectiveness.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Decision Types</span>
              </h3>
              <div className="space-y-3">
                {decisionMetrics && Object.entries(decisionMetrics.byDecision).map(([decision, count]) => (
                  <div key={decision} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        decision === 'accepted' ? 'bg-success' :
                        decision === 'rejected' ? 'bg-destructive' :
                        decision === 'override' ? 'bg-warning' :
                        'bg-muted-foreground'
                      }`} />
                      <span className="capitalize text-sm text-foreground">{decision}</span>
                    </div>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>Live monitoring active</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span>Period: 7 days</span>
        </div>
      </div>
    </div>
  );
}