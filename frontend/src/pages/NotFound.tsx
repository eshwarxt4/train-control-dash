import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Train, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-lg mr-4">
            <Train className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">404</h1>
            <p className="text-sm text-muted-foreground font-mono">Page Not Found</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">Oops! Lost in Transit</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track!
          </p>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono text-muted-foreground">
              Requested: {location.pathname}
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Button>
          
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
