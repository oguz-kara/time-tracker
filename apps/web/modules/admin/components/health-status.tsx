'use client';

import { useGetAdminSystemHealthQuery } from '@/lib/graphql/generated';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CreditCard, Mail, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ServiceStatus = 'healthy' | 'unhealthy' | 'degraded';

function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusVariant(status: ServiceStatus): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'healthy':
      return 'default';
    case 'degraded':
      return 'secondary';
    case 'unhealthy':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function HealthStatus() {
  const { data, isLoading, error, refetch } = useGetAdminSystemHealthQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Checking services...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription className="text-destructive">
            Error loading health status: {error instanceof Error ? error.message : 'Unknown error'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const health = data?.adminSystemHealth;

  const services = [
    { name: 'Database', icon: Database, data: health?.database },
    { name: 'Stripe API', icon: CreditCard, data: health?.stripe },
    { name: 'Resend API', icon: Mail, data: health?.resend },
    { name: 'Email Service', icon: Server, data: health?.email },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current status of critical services</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => {
            const Icon = service.icon;
            const status = service.data?.status || 'unhealthy';
            const latency = service.data?.latency;
            const message = service.data?.message;

            return (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {message && (
                      <p className="text-xs text-muted-foreground">{message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {latency && (
                    <span className="text-xs text-muted-foreground">{latency}ms</span>
                  )}
                  <Badge variant={getStatusVariant(status)}>
                    {status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
