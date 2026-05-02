import { builder } from '@/lib/graphql/builder';
import * as organizationsService from './service';
import { NotAuthenticatedError } from '@/modules/shared/errors';

/**
 * Organizations GraphQL API Layer
 * Thin resolvers that delegate to service layer
 */

// GraphQL Object Type for Organization
export const OrganizationType = builder.objectRef<{
  id: string;
  name: string;
  slug: string;
  role: string;
  logo: string | null;
}>('Organization').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    slug: t.exposeString('slug'),
    role: t.exposeString('role'),
    logo: t.exposeString('logo', { nullable: true }),
  }),
});

// Queries
builder.queryField('userOrganizations', (t) =>
  t.field({
    type: [OrganizationType],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();
      return organizationsService.getUserOrganizations(ctx.session.userId);
    },
  })
);
