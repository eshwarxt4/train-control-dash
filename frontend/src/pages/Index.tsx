import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Train, Shield, Eye, Activity } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-lg mr-4">
            <Train className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">RAIL-PRISM</h1>
            <p className="text-sm text-muted-foreground font-mono">AI-Assisted Decision Support System</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">Welcome to RAIL-PRISM</h2>
          <p className="text-muted-foreground">
            An intelligent railway traffic management system that provides AI-powered decision support 
            for railway controllers to optimize train scheduling and resolve conflicts in real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center space-x-2 p-3 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Controller Access</span>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-secondary/10 rounded-lg">
            <Eye className="w-5 h-5 text-secondary-foreground" />
            <span className="text-sm font-medium">Viewer Access</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 mb-6">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Redirecting to login...</span>
        </div>

        <Button 
          onClick={() => navigate('/login')}
          className="w-full"
        >
          Go to Login
        </Button>
      </Card>
    </div>
  );
};

export default Index;
