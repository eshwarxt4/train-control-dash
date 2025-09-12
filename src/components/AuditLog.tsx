import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditEntry } from '@/types/rail';
import { 
  Download, 
  Search, 
  Calendar, 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Filter
} from 'lucide-react';

interface AuditLogProps {
  auditLog: AuditEntry[];
  userRole: 'Controller' | 'Viewer';
}

export function AuditLog({ auditLog, userRole }: AuditLogProps) {
  const [filter, setFilter] = useState<string>('all');

  const getEntryIcon = (type: AuditEntry['type']) => {
    switch (type) {
      case 'recommendation': return <Shield className="w-4 h-4 text-primary" />;
      case 'action': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'override': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'failure': return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEntryBadgeVariant = (type: AuditEntry['type']) => {
    switch (type) {
      case 'recommendation': return 'default';
      case 'action': return 'secondary';
      case 'override': return 'destructive';
      case 'failure': return 'destructive';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportAuditLog = () => {
    const dataStr = JSON.stringify(auditLog, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `rail-prism-audit-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredLog = auditLog.filter(entry => 
    filter === 'all' || entry.type === filter
  );

  const logStats = {
    total: auditLog.length,
    recommendations: auditLog.filter(e => e.type === 'recommendation').length,
    actions: auditLog.filter(e => e.type === 'action').length,
    overrides: auditLog.filter(e => e.type === 'override').length,
    failures: auditLog.filter(e => e.type === 'failure').length,
  };

  return (
    <Card className="bg-panel border-panel-border">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">System Audit Log</h3>
            <Badge variant="outline" className="text-xs">
              {auditLog.length} entries
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 bg-background border border-border rounded text-sm"
            >
              <option value="all">All Events ({logStats.total})</option>
              <option value="recommendation">Recommendations ({logStats.recommendations})</option>
              <option value="action">Actions ({logStats.actions})</option>
              <option value="override">Overrides ({logStats.overrides})</option>
              <option value="failure">Failures ({logStats.failures})</option>
            </select>

            {/* Export Button */}
            <Button
              onClick={exportAuditLog}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-center p-2 bg-background rounded border border-border">
            <div className="text-lg font-bold text-foreground">{logStats.total}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center p-2 bg-background rounded border border-border">
            <div className="text-lg font-bold text-primary">{logStats.recommendations}</div>
            <div className="text-xs text-muted-foreground">AI Recommendations</div>
          </div>
          <div className="text-center p-2 bg-background rounded border border-border">
            <div className="text-lg font-bold text-success">{logStats.actions}</div>
            <div className="text-xs text-muted-foreground">Actions Taken</div>
          </div>
          <div className="text-center p-2 bg-background rounded border border-border">
            <div className="text-lg font-bold text-destructive">{logStats.overrides}</div>
            <div className="text-xs text-muted-foreground">Overrides</div>
          </div>
          <div className="text-center p-2 bg-background rounded border border-border">
            <div className="text-lg font-bold text-warning">{logStats.failures}</div>
            <div className="text-xs text-muted-foreground">System Failures</div>
          </div>
        </div>

        {/* Log Entries */}
        <ScrollArea className="h-48">
          {filteredLog.length > 0 ? (
            <div className="space-y-2">
              {filteredLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start space-x-3 p-3 bg-background rounded border border-border"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEntryIcon(entry.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge 
                            variant={getEntryBadgeVariant(entry.type)} 
                            className="text-xs uppercase"
                          >
                            {entry.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{entry.user}</span>
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{entry.description}</p>
                        
                        {/* Additional data preview */}
                        {entry.data && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                            {typeof entry.data === 'object' ? (
                              <div className="max-h-16 overflow-hidden">
                                {JSON.stringify(entry.data, null, 2).slice(0, 100)}
                                {JSON.stringify(entry.data, null, 2).length > 100 && '...'}
                              </div>
                            ) : (
                              String(entry.data)
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-center">
              <div>
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No audit entries found</p>
                <p className="text-xs text-muted-foreground">
                  {filter !== 'all' ? 'Try changing the filter' : 'Events will appear as the system operates'}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer Info */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Real-time system audit trail</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Live monitoring active</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Session: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}