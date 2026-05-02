"use client";

import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_USER_ORGANIZATIONS } from "@/modules/organizations/graphql/documents/queries";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  logo: string | null;
};

export function OrgSwitcher() {
  const { data: session } = useSession();

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ["userOrganizations"],
    queryFn: async () => {
      const result = await graphqlClient.request<{ userOrganizations: Organization[] }>(
        GET_USER_ORGANIZATIONS
      );
      return result.userOrganizations;
    },
    enabled: !!session?.user,
  });

  if (!session?.user || isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const organizations = orgsData || [];
  // For now, we'll use the first organization as active
  // TODO: Implement actual active organization tracking with Better-Auth
  const activeOrg = organizations[0];

  if (!activeOrg) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No organization</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between bg-muted/40 hover:bg-muted/60"
          />
        }
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate text-left">{activeOrg.name}</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="start">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="cursor-pointer"
            onClick={() => {
              // TODO: Implement organization switching with Better-Auth
              console.log("Switch to org:", org.id);
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                activeOrg.id === org.id ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="flex flex-col">
              <span>{org.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {org.role}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
