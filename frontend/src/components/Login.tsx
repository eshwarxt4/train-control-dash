import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Train } from 'lucide-react';

interface LoginProps {
  onLogin: (role: 'Controller' | 'Viewer') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<'Controller' | 'Viewer' | null>(null);

  const roles = [
    {
      type: 'Controller' as const,
      title: 'Section Controller',
      description: 'Full access to decision-making and system controls',
      icon: Shield,
      permissions: ['View all data', 'Accept/Override recommendations', 'Control simulations', 'Access audit logs'],
      color: 'bg-primary',
    },
    {
      type: 'Viewer' as const,
      title: 'Operations Viewer',
      description: 'Read-only access to monitor railway operations',
      icon: Eye,
      permissions: ['View train positions', 'Monitor conflicts', 'Read recommendations', 'View audit logs'],
      color: 'bg-secondary',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-lg mr-4">
              <Train className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">RAIL-PRISM</h1>
              <p className="text-sm text-muted-foreground font-mono">AI-Assisted Decision Support System</p>
            </div>
          </div>
          <h2 className="text-xl text-foreground mb-2">Select Your Role</h2>
          <p className="text-muted-foreground">Choose your access level for the demonstration</p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <Card
              key={role.type}
              className={`p-6 cursor-pointer border-2 transition-all duration-200 ${
                selectedRole === role.type
                  ? 'border-primary bg-card shadow-lg shadow-primary/20'
                  : 'border-panel-border hover:border-primary/50 hover:shadow-md'
              }`}
              onClick={() => setSelectedRole(role.type)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${role.color} rounded-lg flex items-center justify-center`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{role.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-wide">Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Login Button */}
        <div className="text-center">
          <Button
            onClick={() => selectedRole && onLogin(selectedRole)}
            disabled={!selectedRole}
            size="lg"
            className="w-full md:w-auto px-8"
          >
            Enter RAIL-PRISM Dashboard
          </Button>
          {selectedRole && (
            <p className="text-sm text-muted-foreground mt-4">
              Logging in as <span className="font-medium text-foreground">{selectedRole}</span>
            </p>
          )}
        </div>

        {/* Demo Note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="w-2 h-2 bg-warning rounded-full mr-2 animate-pulse"></div>
            <p className="text-sm text-warning-foreground">
              Demo Mode - No authentication required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}