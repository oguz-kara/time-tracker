'use client';

import { useState } from 'react';
import { useGetAdminOrganizationsQuery } from '@/lib/graphql/generated';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreditAdjustDialog } from './credit-adjust-dialog';

export function OrgList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useGetAdminOrganizationsQuery({
    page,
    pageSize,
    search: search || undefined,
  });

  const orgs = data?.adminOrganizations;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Manage all organizations and their billing</CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">Loading organizations...</div>
          )}

          {!!error && (
            <div className="text-center py-8 text-destructive">
              Error loading organizations: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          )}

          {orgs && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!orgs.organizations || orgs.organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orgs.organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{org.planId || 'free'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{org.creditBalance}</span>
                        </TableCell>
                        <TableCell>{org.memberCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrgId(org.id ?? null)}
                          >
                            Adjust Credits
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {orgs.organizations?.length ?? 0} of {orgs.total ?? 0} organizations
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">Page {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!orgs.hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreditAdjustDialog
        organizationId={selectedOrgId}
        onClose={() => {
          setSelectedOrgId(null);
          refetch();
        }}
      />
    </>
  );
}
