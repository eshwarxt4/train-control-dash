import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Recommendation } from '@/types/rail';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Eye, 
  Shield,
  AlertCircle
} from 'lucide-react';

interface RecommendationPanelProps {
  recommendation: Recommendation;
  userRole: 'Controller' | 'Viewer';
  onApplyRecommendation: (recommendationId: string, optionId: string) => void;
  onOverrideRecommendation: (recommendationId: string, reason: string) => void;
  onShowSimulation: () => void;
}

export function RecommendationPanel({
  recommendation,
  userRole,
  onApplyRecommendation,
  onOverrideRecommendation,
  onShowSimulation,
}: RecommendationPanelProps) {
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-full bg-panel border-panel-border">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Conflict Detected</h3>
              <Badge variant="destructive" className="text-xs">
                Priority Action Required
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-generated recommendations for conflict resolution
            </p>
          </div>
          {userRole === 'Viewer' && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>View Only</span>
            </Badge>
          )}
        </div>

        {/* Recommendation Options */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-foreground flex items-center space-x-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Recommended Actions</span>
          </h4>
          
          {recommendation.options.map((option, index) => (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedOption === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-panel-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-primary text-primary-foreground' :
                    index === 1 ? 'bg-secondary text-secondary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <h5 className="font-medium text-foreground">{option.action.toUpperCase()}</h5>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(option.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-foreground mb-3">{option.description}</p>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Delay:</span>
                  <span className="font-medium text-foreground">{option.predictedDelay}min</span>
                </div>
                <div className="flex items-center space-x-1">
                  {option.throughputImpact >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <span className="text-muted-foreground">Impact:</span>
                  <span className="font-medium text-foreground">
                    {option.throughputImpact > 0 ? '+' : ''}{option.throughputImpact}/h
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    option.confidence > 0.8 ? 'bg-success' :
                    option.confidence > 0.6 ? 'bg-warning' : 'bg-destructive'
                  }`} />
                  <span className="text-muted-foreground">Quality:</span>
                  <span className="font-medium text-foreground">
                    {option.confidence > 0.8 ? 'High' :
                     option.confidence > 0.6 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-panel-border">
                <p className="text-xs text-muted-foreground italic">{option.details}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        {userRole === 'Controller' && (
          <div className="space-y-3">
            <Button
              onClick={onShowSimulation}
              variant="outline"
              className="w-full"
              disabled={!selectedOption}
            >
              <Eye className="w-4 h-4 mr-2" />
              Simulate Selected Option
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => selectedOption && onApplyRecommendation(recommendation.conflictId, selectedOption)}
                disabled={!selectedOption}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />
                    Override
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Override AI Recommendation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Please provide a reason for overriding the AI recommendation. This will be logged for audit purposes.
                    </p>
                    <Textarea
                      placeholder="Reason for override (required)..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          if (overrideReason.trim()) {
                            onOverrideRecommendation(recommendation.conflictId, overrideReason);
                            setOverrideReason('');
                          }
                        }}
                        disabled={!overrideReason.trim()}
                        variant="destructive"
                        className="flex-1"
                      >
                        Confirm Override
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {userRole === 'Viewer' && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Viewing recommendations in read-only mode
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}