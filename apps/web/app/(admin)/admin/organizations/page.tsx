import { OrgList } from '@/modules/admin/components/org-list';

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all organizations and their billing
        </p>
      </div>

      <OrgList />
    </div>
  );
}
