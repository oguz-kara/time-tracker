import Link from 'next/link';
import { LayoutDashboard, Users, Building2, Activity } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Red Admin Banner */}
      <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium">
        ADMIN MODE - You are viewing the system administration panel
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/10 min-h-[calc(100vh-40px)]">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Admin Panel</h2>
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
              <Link
                href="/admin/organizations"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <Building2 className="h-4 w-4" />
                Organizations
              </Link>
              <Link
                href="/admin/monitoring"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <Activity className="h-4 w-4" />
                System Health
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
