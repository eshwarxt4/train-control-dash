import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Train, 
  AlertTriangle, 
  BarChart3, 
  FileText,
  Settings,
  LogOut
} from 'lucide-react';

interface NavigationProps {
  userRole: 'Controller' | 'Viewer';
  onLogout: () => void;
}

export function Navigation({ userRole, onLogout }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Main control panel'
    },
    {
      path: '/trains',
      label: 'Trains',
      icon: Train,
      description: 'Train management'
    },
    {
      path: '/conflicts',
      label: 'Conflicts',
      icon: AlertTriangle,
      description: 'Conflict resolution'
    },
    {
      path: '/metrics',
      label: 'Metrics',
      icon: BarChart3,
      description: 'Analytics & reports'
    },
    {
      path: '/audit',
      label: 'Audit Log',
      icon: FileText,
      description: 'Decision history'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-panel border-r border-panel-border w-64 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-panel-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Train className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">RAIL-PRISM</h2>
            <p className="text-xs text-muted-foreground">Navigation</p>
          </div>
        </div>
        
        <Badge variant="outline" className="flex items-center space-x-1 w-full justify-center">
          <Settings className="w-3 h-3" />
          <span className="text-xs">{userRole}</span>
        </Badge>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              variant={isActive(item.path) ? "default" : "ghost"}
              className="w-full justify-start h-auto p-3"
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-panel-border">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}