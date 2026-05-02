import { HealthStatus } from '@/modules/admin/components/health-status';

export default function AdminMonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor the health and performance of critical services
        </p>
      </div>

      <HealthStatus />
    </div>
  );
}
