import { DashboardStats } from '@/modules/admin/components/dashboard-stats';
import { HealthStatus } from '@/modules/admin/components/health-status';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of system statistics and health
        </p>
      </div>

      <DashboardStats />
      <HealthStatus />
    </div>
  );
}
