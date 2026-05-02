import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  UseMutationOptions,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
} from "@tanstack/react-query";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch("http://localhost:3000/api/graphql", {
      method: "POST",
      ...{
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  };
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  JSON: { input: any; output: any };
};

export type AdminOrganization = {
  __typename?: "AdminOrganization";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  creditBalance?: Maybe<Scalars["Int"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  memberCount?: Maybe<Scalars["Int"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  planId?: Maybe<Scalars["String"]["output"]>;
  slug?: Maybe<Scalars["String"]["output"]>;
  subscriptionStatus?: Maybe<Scalars["String"]["output"]>;
};

export type AdminUser = {
  __typename?: "AdminUser";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  emailVerified?: Maybe<Scalars["Boolean"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** Number of organizations this user belongs to */
  organizationCount?: Maybe<Scalars["Int"]["output"]>;
};

export type BaseError = {
  __typename?: "BaseError";
  code?: Maybe<Scalars["String"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
};

export type BillingPlan = {
  __typename?: "BillingPlan";
  /** Monthly credit grant for hybrid billing */
  creditsPerMonth?: Maybe<Scalars["Int"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  features?: Maybe<Array<Scalars["String"]["output"]>>;
  id?: Maybe<Scalars["ID"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** Monthly price in dollars */
  priceMonthly?: Maybe<Scalars["Int"]["output"]>;
  /** Yearly price in dollars */
  priceYearly?: Maybe<Scalars["Int"]["output"]>;
};

export type CheckoutResult = {
  __typename?: "CheckoutResult";
  /** Stripe checkout session ID */
  sessionId?: Maybe<Scalars["String"]["output"]>;
  /** Stripe checkout URL to redirect user to */
  url?: Maybe<Scalars["String"]["output"]>;
};

export type CreateEntryInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  start: Scalars["DateTime"]["input"];
  stop: Scalars["DateTime"]["input"];
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type CreateProjectInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
};

export type CreateTaskInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
};

export type CreditAdjustmentResult = {
  __typename?: "CreditAdjustmentResult";
  adjustmentAmount?: Maybe<Scalars["Int"]["output"]>;
  newBalance?: Maybe<Scalars["Int"]["output"]>;
  organizationId?: Maybe<Scalars["ID"]["output"]>;
  previousBalance?: Maybe<Scalars["Int"]["output"]>;
  reason?: Maybe<Scalars["String"]["output"]>;
};

export type CreditBalance = {
  __typename?: "CreditBalance";
  /** Current credit balance */
  balance?: Maybe<Scalars["Int"]["output"]>;
  /** Whether subscription is scheduled to cancel at period end */
  cancelAtPeriodEnd?: Maybe<Scalars["Boolean"]["output"]>;
  /** End date of current billing period */
  currentPeriodEnd?: Maybe<Scalars["DateTime"]["output"]>;
  /** Current subscription plan ID */
  planId?: Maybe<Scalars["String"]["output"]>;
  /** Date when canceled subscription will actually end */
  subscriptionEndDate?: Maybe<Scalars["DateTime"]["output"]>;
  /** Subscription status (active, canceled, etc.) */
  subscriptionStatus?: Maybe<Scalars["String"]["output"]>;
};

export type CreditPack = {
  __typename?: "CreditPack";
  credits?: Maybe<Scalars["Int"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  /** Price in dollars */
  price?: Maybe<Scalars["Int"]["output"]>;
};

export type CreditTransaction = {
  __typename?: "CreditTransaction";
  /** Credit amount (positive for additions, negative for usage) */
  amount?: Maybe<Scalars["Int"]["output"]>;
  /** Credit balance after this transaction */
  balanceAfter?: Maybe<Scalars["Int"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  metadata?: Maybe<Scalars["JSON"]["output"]>;
  /** Transaction type: purchase, usage, refund, adjustment, subscription_grant */
  type?: Maybe<Scalars["String"]["output"]>;
};

export type CustomerPortalResult = {
  __typename?: "CustomerPortalResult";
  /** Stripe customer portal URL */
  url?: Maybe<Scalars["String"]["output"]>;
};

export type DailyTotal = {
  __typename?: "DailyTotal";
  date?: Maybe<Scalars["String"]["output"]>;
  totalMinutes?: Maybe<Scalars["Int"]["output"]>;
};

export type DashboardStats = {
  __typename?: "DashboardStats";
  /** New user signups in the last 7 days */
  recentSignups?: Maybe<Scalars["Int"]["output"]>;
  totalOrganizations?: Maybe<Scalars["Int"]["output"]>;
  totalUsers?: Maybe<Scalars["Int"]["output"]>;
};

export type DeleteFileInput = {
  fileId: Scalars["String"]["input"];
};

/** Uploaded file metadata */
export type File = {
  __typename?: "File";
  contentType?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  filename?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  key?: Maybe<Scalars["String"]["output"]>;
  metadata?: Maybe<Scalars["JSON"]["output"]>;
  organizationId?: Maybe<Scalars["String"]["output"]>;
  size?: Maybe<Scalars["Int"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  url?: Maybe<Scalars["String"]["output"]>;
  userId?: Maybe<Scalars["String"]["output"]>;
};

export type GetSignedUrlInput = {
  expiresIn?: InputMaybe<Scalars["Int"]["input"]>;
  fileId: Scalars["String"]["input"];
};

export type HealthStatus = {
  __typename?: "HealthStatus";
  database?: Maybe<ServiceHealth>;
  email?: Maybe<ServiceHealth>;
  resend?: Maybe<ServiceHealth>;
  stripe?: Maybe<ServiceHealth>;
};

export enum MemberRole {
  Admin = "admin",
  Member = "member",
  Owner = "owner",
}

export type Mutation = {
  __typename?: "Mutation";
  adminAdjustCredits?: Maybe<CreditAdjustmentResult>;
  createCheckout?: Maybe<CheckoutResult>;
  createCreditCheckout?: Maybe<CheckoutResult>;
  createCustomerPortal?: Maybe<CustomerPortalResult>;
  createEntry?: Maybe<TimeEntry>;
  createProject?: Maybe<Project>;
  createTask?: Maybe<Task>;
  deleteEntry?: Maybe<Scalars["Boolean"]["output"]>;
  deleteFile?: Maybe<Scalars["Boolean"]["output"]>;
  deleteProject?: Maybe<Scalars["Boolean"]["output"]>;
  deleteTask?: Maybe<Task>;
  getSignedUrl?: Maybe<SignedUrl>;
  markAllNotificationsRead?: Maybe<Scalars["Boolean"]["output"]>;
  markNotificationRead?: Maybe<Notification>;
  startTimer?: Maybe<TimeEntry>;
  stopTimer?: Maybe<TimeEntry>;
  updateEntry?: Maybe<TimeEntry>;
  updateProject?: Maybe<Project>;
  updateTask?: Maybe<Task>;
  updateUserSettings?: Maybe<UserSettings>;
  uploadFile?: Maybe<File>;
};

export type MutationAdminAdjustCreditsArgs = {
  amount: Scalars["Int"]["input"];
  organizationId: Scalars["String"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationCreateCheckoutArgs = {
  interval?: InputMaybe<Scalars["String"]["input"]>;
  planId: Scalars["String"]["input"];
};

export type MutationCreateCreditCheckoutArgs = {
  packId: Scalars["String"]["input"];
};

export type MutationCreateEntryArgs = {
  input: CreateEntryInput;
};

export type MutationCreateProjectArgs = {
  input?: InputMaybe<CreateProjectInput>;
};

export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
};

export type MutationDeleteEntryArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeleteFileArgs = {
  input: DeleteFileInput;
};

export type MutationDeleteProjectArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeleteTaskArgs = {
  id: Scalars["String"]["input"];
};

export type MutationGetSignedUrlArgs = {
  input: GetSignedUrlInput;
};

export type MutationMarkNotificationReadArgs = {
  notificationId: Scalars["String"]["input"];
};

export type MutationStartTimerArgs = {
  input?: InputMaybe<StartTimerInput>;
};

export type MutationUpdateEntryArgs = {
  id: Scalars["String"]["input"];
  input: UpdateEntryInput;
};

export type MutationUpdateProjectArgs = {
  id: Scalars["String"]["input"];
  input?: InputMaybe<UpdateProjectInput>;
};

export type MutationUpdateTaskArgs = {
  id: Scalars["String"]["input"];
  input: UpdateTaskInput;
};

export type MutationUpdateUserSettingsArgs = {
  input: UpdateUserSettingsInput;
};

export type MutationUploadFileArgs = {
  input: UploadFileInput;
};

export type Notification = {
  __typename?: "Notification";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  link?: Maybe<Scalars["String"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
  organizationId?: Maybe<Scalars["String"]["output"]>;
  read?: Maybe<Scalars["Boolean"]["output"]>;
  readAt?: Maybe<Scalars["DateTime"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
  type?: Maybe<Scalars["String"]["output"]>;
  userId?: Maybe<Scalars["String"]["output"]>;
};

export type Organization = {
  __typename?: "Organization";
  id?: Maybe<Scalars["ID"]["output"]>;
  logo?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  role?: Maybe<Scalars["String"]["output"]>;
  slug?: Maybe<Scalars["String"]["output"]>;
};

export type PaginatedOrganizations = {
  __typename?: "PaginatedOrganizations";
  hasMore?: Maybe<Scalars["Boolean"]["output"]>;
  organizations?: Maybe<Array<AdminOrganization>>;
  page?: Maybe<Scalars["Int"]["output"]>;
  pageSize?: Maybe<Scalars["Int"]["output"]>;
  total?: Maybe<Scalars["Int"]["output"]>;
};

export type PaginatedUsers = {
  __typename?: "PaginatedUsers";
  hasMore?: Maybe<Scalars["Boolean"]["output"]>;
  page?: Maybe<Scalars["Int"]["output"]>;
  pageSize?: Maybe<Scalars["Int"]["output"]>;
  total?: Maybe<Scalars["Int"]["output"]>;
  users?: Maybe<Array<AdminUser>>;
};

export type Project = {
  __typename?: "Project";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  organizationId?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type Query = {
  __typename?: "Query";
  adminDashboardStats?: Maybe<DashboardStats>;
  adminOrganizations?: Maybe<PaginatedOrganizations>;
  adminSystemHealth?: Maybe<HealthStatus>;
  adminUsers?: Maybe<PaginatedUsers>;
  billingPlans?: Maybe<Array<BillingPlan>>;
  creditBalance?: Maybe<CreditBalance>;
  creditHistory?: Maybe<Array<CreditTransaction>>;
  creditPacks?: Maybe<Array<CreditPack>>;
  currentEntry?: Maybe<TimeEntry>;
  dailyTotals?: Maybe<Array<DailyTotal>>;
  entries?: Maybe<Array<TimeEntry>>;
  file?: Maybe<File>;
  files?: Maybe<Array<File>>;
  health?: Maybe<Scalars["String"]["output"]>;
  notifications?: Maybe<Array<Notification>>;
  project?: Maybe<Project>;
  projects?: Maybe<Array<Project>>;
  task?: Maybe<Task>;
  tasks?: Maybe<Array<Task>>;
  unreadNotificationCount?: Maybe<UnreadCount>;
  userOrganizations?: Maybe<Array<Organization>>;
  userSettings?: Maybe<UserSettings>;
};

export type QueryAdminOrganizationsArgs = {
  page?: InputMaybe<Scalars["Int"]["input"]>;
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryAdminUsersArgs = {
  page?: InputMaybe<Scalars["Int"]["input"]>;
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryCreditHistoryArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryDailyTotalsArgs = {
  from: Scalars["DateTime"]["input"];
  to: Scalars["DateTime"]["input"];
};

export type QueryEntriesArgs = {
  from: Scalars["DateTime"]["input"];
  to: Scalars["DateTime"]["input"];
};

export type QueryFileArgs = {
  id: Scalars["String"]["input"];
};

export type QueryNotificationsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryProjectArgs = {
  id: Scalars["String"]["input"];
};

export type QueryTaskArgs = {
  id: Scalars["String"]["input"];
};

export type ServiceHealth = {
  __typename?: "ServiceHealth";
  /** Response time in milliseconds */
  latency?: Maybe<Scalars["Int"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<ServiceHealthStatus>;
};

export enum ServiceHealthStatus {
  Degraded = "degraded",
  Healthy = "healthy",
  Unhealthy = "unhealthy",
}

/** Temporary signed URL for file access */
export type SignedUrl = {
  __typename?: "SignedUrl";
  expiresIn?: Maybe<Scalars["Int"]["output"]>;
  url?: Maybe<Scalars["String"]["output"]>;
};

export type StartTimerInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export enum SubscriptionStatus {
  Active = "active",
  Canceled = "canceled",
  Incomplete = "incomplete",
  PastDue = "past_due",
  Trialing = "trialing",
}

export type Task = {
  __typename?: "Task";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  organizationId?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type TimeEntry = {
  __typename?: "TimeEntry";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  id?: Maybe<Scalars["ID"]["output"]>;
  organizationId?: Maybe<Scalars["String"]["output"]>;
  start?: Maybe<Scalars["DateTime"]["output"]>;
  stop?: Maybe<Scalars["DateTime"]["output"]>;
  tags?: Maybe<Array<Scalars["String"]["output"]>>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId?: Maybe<Scalars["String"]["output"]>;
};

export type UnreadCount = {
  __typename?: "UnreadCount";
  count?: Maybe<Scalars["Int"]["output"]>;
};

export type UpdateEntryInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  start?: InputMaybe<Scalars["DateTime"]["input"]>;
  stop?: InputMaybe<Scalars["DateTime"]["input"]>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type UpdateProjectInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateTaskInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserSettingsInput = {
  dailyGoalMinutes?: InputMaybe<Scalars["Int"]["input"]>;
  locale?: InputMaybe<Scalars["String"]["input"]>;
  timezone?: InputMaybe<Scalars["String"]["input"]>;
  weekStartsOn?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UploadFileInput = {
  base64Data: Scalars["String"]["input"];
  contentType: Scalars["String"]["input"];
  filename: Scalars["String"]["input"];
  size: Scalars["Int"]["input"];
};

export enum UserRole {
  Admin = "admin",
  User = "user",
}

export type UserSettings = {
  __typename?: "UserSettings";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  dailyGoalMinutes?: Maybe<Scalars["Int"]["output"]>;
  locale?: Maybe<Scalars["String"]["output"]>;
  timezone?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId?: Maybe<Scalars["String"]["output"]>;
  weekStartsOn?: Maybe<Scalars["Int"]["output"]>;
};

export type AdminAdjustCreditsMutationVariables = Exact<{
  organizationId: Scalars["String"]["input"];
  amount: Scalars["Int"]["input"];
  reason: Scalars["String"]["input"];
}>;

export type AdminAdjustCreditsMutation = {
  __typename?: "Mutation";
  adminAdjustCredits?: {
    __typename?: "CreditAdjustmentResult";
    organizationId?: string | null;
    previousBalance?: number | null;
    newBalance?: number | null;
    adjustmentAmount?: number | null;
    reason?: string | null;
  } | null;
};

export type GetAdminUsersQueryVariables = Exact<{
  page?: InputMaybe<Scalars["Int"]["input"]>;
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type GetAdminUsersQuery = {
  __typename?: "Query";
  adminUsers?: {
    __typename?: "PaginatedUsers";
    total?: number | null;
    page?: number | null;
    pageSize?: number | null;
    hasMore?: boolean | null;
    users?: Array<{
      __typename?: "AdminUser";
      id?: string | null;
      name?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      createdAt?: any | null;
      organizationCount?: number | null;
    }> | null;
  } | null;
};

export type GetAdminOrganizationsQueryVariables = Exact<{
  page?: InputMaybe<Scalars["Int"]["input"]>;
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type GetAdminOrganizationsQuery = {
  __typename?: "Query";
  adminOrganizations?: {
    __typename?: "PaginatedOrganizations";
    total?: number | null;
    page?: number | null;
    pageSize?: number | null;
    hasMore?: boolean | null;
    organizations?: Array<{
      __typename?: "AdminOrganization";
      id?: string | null;
      name?: string | null;
      slug?: string | null;
      createdAt?: any | null;
      memberCount?: number | null;
      planId?: string | null;
      creditBalance?: number | null;
      subscriptionStatus?: string | null;
    }> | null;
  } | null;
};

export type GetAdminDashboardStatsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetAdminDashboardStatsQuery = {
  __typename?: "Query";
  adminDashboardStats?: {
    __typename?: "DashboardStats";
    totalUsers?: number | null;
    totalOrganizations?: number | null;
    recentSignups?: number | null;
  } | null;
};

export type GetAdminSystemHealthQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetAdminSystemHealthQuery = {
  __typename?: "Query";
  adminSystemHealth?: {
    __typename?: "HealthStatus";
    database?: {
      __typename?: "ServiceHealth";
      status?: ServiceHealthStatus | null;
      message?: string | null;
      latency?: number | null;
    } | null;
    stripe?: {
      __typename?: "ServiceHealth";
      status?: ServiceHealthStatus | null;
      message?: string | null;
      latency?: number | null;
    } | null;
    resend?: {
      __typename?: "ServiceHealth";
      status?: ServiceHealthStatus | null;
      message?: string | null;
      latency?: number | null;
    } | null;
    email?: {
      __typename?: "ServiceHealth";
      status?: ServiceHealthStatus | null;
      message?: string | null;
      latency?: number | null;
    } | null;
  } | null;
};

export type CreateCheckoutMutationVariables = Exact<{
  planId: Scalars["String"]["input"];
  interval?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type CreateCheckoutMutation = {
  __typename?: "Mutation";
  createCheckout?: {
    __typename?: "CheckoutResult";
    url?: string | null;
    sessionId?: string | null;
  } | null;
};

export type CreateCreditCheckoutMutationVariables = Exact<{
  packId: Scalars["String"]["input"];
}>;

export type CreateCreditCheckoutMutation = {
  __typename?: "Mutation";
  createCreditCheckout?: {
    __typename?: "CheckoutResult";
    url?: string | null;
    sessionId?: string | null;
  } | null;
};

export type CreateCustomerPortalMutationVariables = Exact<{
  [key: string]: never;
}>;

export type CreateCustomerPortalMutation = {
  __typename?: "Mutation";
  createCustomerPortal?: {
    __typename?: "CustomerPortalResult";
    url?: string | null;
  } | null;
};

export type GetCreditBalanceQueryVariables = Exact<{ [key: string]: never }>;

export type GetCreditBalanceQuery = {
  __typename?: "Query";
  creditBalance?: {
    __typename?: "CreditBalance";
    balance?: number | null;
    planId?: string | null;
    subscriptionStatus?: string | null;
    cancelAtPeriodEnd?: boolean | null;
    subscriptionEndDate?: any | null;
    currentPeriodEnd?: any | null;
  } | null;
};

export type GetCreditHistoryQueryVariables = Exact<{
  limit?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetCreditHistoryQuery = {
  __typename?: "Query";
  creditHistory?: Array<{
    __typename?: "CreditTransaction";
    id?: string | null;
    amount?: number | null;
    type?: string | null;
    description?: string | null;
    balanceAfter?: number | null;
    createdAt?: any | null;
    metadata?: any | null;
  }> | null;
};

export type GetBillingPlansQueryVariables = Exact<{ [key: string]: never }>;

export type GetBillingPlansQuery = {
  __typename?: "Query";
  billingPlans?: Array<{
    __typename?: "BillingPlan";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    priceMonthly?: number | null;
    priceYearly?: number | null;
    creditsPerMonth?: number | null;
    features?: Array<string> | null;
  }> | null;
};

export type GetCreditPacksQueryVariables = Exact<{ [key: string]: never }>;

export type GetCreditPacksQuery = {
  __typename?: "Query";
  creditPacks?: Array<{
    __typename?: "CreditPack";
    id?: string | null;
    name?: string | null;
    credits?: number | null;
    price?: number | null;
  }> | null;
};

export type MarkNotificationReadMutationVariables = Exact<{
  notificationId: Scalars["String"]["input"];
}>;

export type MarkNotificationReadMutation = {
  __typename?: "Mutation";
  markNotificationRead?: {
    __typename?: "Notification";
    id?: string | null;
    read?: boolean | null;
    readAt?: any | null;
  } | null;
};

export type MarkAllNotificationsReadMutationVariables = Exact<{
  [key: string]: never;
}>;

export type MarkAllNotificationsReadMutation = {
  __typename?: "Mutation";
  markAllNotificationsRead?: boolean | null;
};

export type GetNotificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetNotificationsQuery = {
  __typename?: "Query";
  notifications?: Array<{
    __typename?: "Notification";
    id?: string | null;
    title?: string | null;
    message?: string | null;
    type?: string | null;
    link?: string | null;
    read?: boolean | null;
    createdAt?: any | null;
    readAt?: any | null;
  }> | null;
};

export type GetUnreadNotificationCountQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetUnreadNotificationCountQuery = {
  __typename?: "Query";
  unreadNotificationCount?: {
    __typename?: "UnreadCount";
    count?: number | null;
  } | null;
};

export type GetUserOrganizationsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetUserOrganizationsQuery = {
  __typename?: "Query";
  userOrganizations?: Array<{
    __typename?: "Organization";
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    role?: string | null;
    logo?: string | null;
  }> | null;
};

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;

export type CreateProjectMutation = {
  __typename?: "Mutation";
  createProject?: {
    __typename?: "Project";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    organizationId?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type UpdateProjectMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  input: UpdateProjectInput;
}>;

export type UpdateProjectMutation = {
  __typename?: "Mutation";
  updateProject?: {
    __typename?: "Project";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    organizationId?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DeleteProjectMutation = {
  __typename?: "Mutation";
  deleteProject?: boolean | null;
};

export type GetProjectsQueryVariables = Exact<{ [key: string]: never }>;

export type GetProjectsQuery = {
  __typename?: "Query";
  projects?: Array<{
    __typename?: "Project";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    organizationId?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  }> | null;
};

export type GetProjectQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type GetProjectQuery = {
  __typename?: "Query";
  project?: {
    __typename?: "Project";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    organizationId?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type CreateTaskMutationVariables = Exact<{
  input: CreateTaskInput;
}>;

export type CreateTaskMutation = {
  __typename?: "Mutation";
  createTask?: {
    __typename?: "Task";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  input: UpdateTaskInput;
}>;

export type UpdateTaskMutation = {
  __typename?: "Mutation";
  updateTask?: {
    __typename?: "Task";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DeleteTaskMutation = {
  __typename?: "Mutation";
  deleteTask?: {
    __typename?: "Task";
    id?: string | null;
    name?: string | null;
  } | null;
};

export type GetTasksQueryVariables = Exact<{ [key: string]: never }>;

export type GetTasksQuery = {
  __typename?: "Query";
  tasks?: Array<{
    __typename?: "Task";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  }> | null;
};

export type GetTaskQueryVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type GetTaskQuery = {
  __typename?: "Query";
  task?: {
    __typename?: "Task";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type StartTimerMutationVariables = Exact<{
  input?: InputMaybe<StartTimerInput>;
}>;

export type StartTimerMutation = {
  __typename?: "Mutation";
  startTimer?: {
    __typename?: "TimeEntry";
    id?: string | null;
    start?: any | null;
    stop?: any | null;
    description?: string | null;
    tags?: Array<string> | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type StopTimerMutationVariables = Exact<{ [key: string]: never }>;

export type StopTimerMutation = {
  __typename?: "Mutation";
  stopTimer?: {
    __typename?: "TimeEntry";
    id?: string | null;
    start?: any | null;
    stop?: any | null;
    description?: string | null;
    tags?: Array<string> | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type CreateEntryMutationVariables = Exact<{
  input: CreateEntryInput;
}>;

export type CreateEntryMutation = {
  __typename?: "Mutation";
  createEntry?: {
    __typename?: "TimeEntry";
    id?: string | null;
    start?: any | null;
    stop?: any | null;
    description?: string | null;
    tags?: Array<string> | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type UpdateEntryMutationVariables = Exact<{
  id: Scalars["String"]["input"];
  input: UpdateEntryInput;
}>;

export type UpdateEntryMutation = {
  __typename?: "Mutation";
  updateEntry?: {
    __typename?: "TimeEntry";
    id?: string | null;
    start?: any | null;
    stop?: any | null;
    description?: string | null;
    tags?: Array<string> | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type DeleteEntryMutationVariables = Exact<{
  id: Scalars["String"]["input"];
}>;

export type DeleteEntryMutation = {
  __typename?: "Mutation";
  deleteEntry?: boolean | null;
};

export type TimeEntryFieldsFragment = {
  __typename?: "TimeEntry";
  id?: string | null;
  start?: any | null;
  stop?: any | null;
  description?: string | null;
  tags?: Array<string> | null;
  createdAt?: any | null;
  updatedAt?: any | null;
};

export type GetCurrentEntryQueryVariables = Exact<{ [key: string]: never }>;

export type GetCurrentEntryQuery = {
  __typename?: "Query";
  currentEntry?: {
    __typename?: "TimeEntry";
    id?: string | null;
    start?: any | null;
    stop?: any | null;
    description?: string | null;
    tags?: Array<string> | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type GetEntriesQueryVariables = Exact<{
  from: Scalars["DateTime"]["input"];
  to: Scalars["DateTime"]["input"];
}>;

export type GetEntriesQuery = {
  __typename?: "Query";
  entries?: Array<{
    __typename?: "TimeEntry";
    id?: string | null;
    start?: any | null;
    stop?: any | null;
    description?: string | null;
    tags?: Array<string> | null;
    createdAt?: any | null;
    updatedAt?: any | null;
  }> | null;
};

export type GetDailyTotalsQueryVariables = Exact<{
  from: Scalars["DateTime"]["input"];
  to: Scalars["DateTime"]["input"];
}>;

export type GetDailyTotalsQuery = {
  __typename?: "Query";
  dailyTotals?: Array<{
    __typename?: "DailyTotal";
    date?: string | null;
    totalMinutes?: number | null;
  }> | null;
};

export type UpdateUserSettingsMutationVariables = Exact<{
  input: UpdateUserSettingsInput;
}>;

export type UpdateUserSettingsMutation = {
  __typename?: "Mutation";
  updateUserSettings?: {
    __typename?: "UserSettings";
    userId?: string | null;
    dailyGoalMinutes?: number | null;
    weekStartsOn?: number | null;
    timezone?: string | null;
    locale?: string | null;
  } | null;
};

export type UserSettingsFieldsFragment = {
  __typename?: "UserSettings";
  userId?: string | null;
  dailyGoalMinutes?: number | null;
  weekStartsOn?: number | null;
  timezone?: string | null;
  locale?: string | null;
};

export type GetUserSettingsQueryVariables = Exact<{ [key: string]: never }>;

export type GetUserSettingsQuery = {
  __typename?: "Query";
  userSettings?: {
    __typename?: "UserSettings";
    userId?: string | null;
    dailyGoalMinutes?: number | null;
    weekStartsOn?: number | null;
    timezone?: string | null;
    locale?: string | null;
  } | null;
};

export const TimeEntryFieldsFragmentDoc = `
    fragment TimeEntryFields on TimeEntry {
  id
  start
  stop
  description
  tags
  createdAt
  updatedAt
}
    `;
export const UserSettingsFieldsFragmentDoc = `
    fragment UserSettingsFields on UserSettings {
  userId
  dailyGoalMinutes
  weekStartsOn
  timezone
  locale
}
    `;
export const AdminAdjustCreditsDocument = `
    mutation AdminAdjustCredits($organizationId: String!, $amount: Int!, $reason: String!) {
  adminAdjustCredits(
    organizationId: $organizationId
    amount: $amount
    reason: $reason
  ) {
    organizationId
    previousBalance
    newBalance
    adjustmentAmount
    reason
  }
}
    `;

export const useAdminAdjustCreditsMutation = <
  TError = unknown,
  TContext = unknown,
>(
  options?: UseMutationOptions<
    AdminAdjustCreditsMutation,
    TError,
    AdminAdjustCreditsMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    AdminAdjustCreditsMutation,
    TError,
    AdminAdjustCreditsMutationVariables,
    TContext
  >({
    mutationKey: ["AdminAdjustCredits"],
    mutationFn: (variables?: AdminAdjustCreditsMutationVariables) =>
      fetcher<AdminAdjustCreditsMutation, AdminAdjustCreditsMutationVariables>(
        AdminAdjustCreditsDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminAdjustCreditsMutation.fetcher = (
  variables: AdminAdjustCreditsMutationVariables,
) =>
  fetcher<AdminAdjustCreditsMutation, AdminAdjustCreditsMutationVariables>(
    AdminAdjustCreditsDocument,
    variables,
  );

export const GetAdminUsersDocument = `
    query GetAdminUsers($page: Int, $pageSize: Int, $search: String) {
  adminUsers(page: $page, pageSize: $pageSize, search: $search) {
    users {
      id
      name
      email
      emailVerified
      createdAt
      organizationCount
    }
    total
    page
    pageSize
    hasMore
  }
}
    `;

export const useGetAdminUsersQuery = <
  TData = GetAdminUsersQuery,
  TError = unknown,
>(
  variables?: GetAdminUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetAdminUsersQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetAdminUsersQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetAdminUsersQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetAdminUsers"]
        : ["GetAdminUsers", variables],
    queryFn: fetcher<GetAdminUsersQuery, GetAdminUsersQueryVariables>(
      GetAdminUsersDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminUsersQuery.getKey = (variables?: GetAdminUsersQueryVariables) =>
  variables === undefined ? ["GetAdminUsers"] : ["GetAdminUsers", variables];

export const useInfiniteGetAdminUsersQuery = <
  TData = InfiniteData<GetAdminUsersQuery>,
  TError = unknown,
>(
  variables: GetAdminUsersQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetAdminUsersQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetAdminUsersQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetAdminUsersQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetAdminUsers.infinite"]
            : ["GetAdminUsers.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetAdminUsersQuery, GetAdminUsersQueryVariables>(
            GetAdminUsersDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetAdminUsersQuery.getKey = (
  variables?: GetAdminUsersQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminUsers.infinite"]
    : ["GetAdminUsers.infinite", variables];

useGetAdminUsersQuery.fetcher = (variables?: GetAdminUsersQueryVariables) =>
  fetcher<GetAdminUsersQuery, GetAdminUsersQueryVariables>(
    GetAdminUsersDocument,
    variables,
  );

export const GetAdminOrganizationsDocument = `
    query GetAdminOrganizations($page: Int, $pageSize: Int, $search: String) {
  adminOrganizations(page: $page, pageSize: $pageSize, search: $search) {
    organizations {
      id
      name
      slug
      createdAt
      memberCount
      planId
      creditBalance
      subscriptionStatus
    }
    total
    page
    pageSize
    hasMore
  }
}
    `;

export const useGetAdminOrganizationsQuery = <
  TData = GetAdminOrganizationsQuery,
  TError = unknown,
>(
  variables?: GetAdminOrganizationsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetAdminOrganizationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetAdminOrganizationsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetAdminOrganizationsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetAdminOrganizations"]
        : ["GetAdminOrganizations", variables],
    queryFn: fetcher<
      GetAdminOrganizationsQuery,
      GetAdminOrganizationsQueryVariables
    >(GetAdminOrganizationsDocument, variables),
    ...options,
  });
};

useGetAdminOrganizationsQuery.getKey = (
  variables?: GetAdminOrganizationsQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminOrganizations"]
    : ["GetAdminOrganizations", variables];

export const useInfiniteGetAdminOrganizationsQuery = <
  TData = InfiniteData<GetAdminOrganizationsQuery>,
  TError = unknown,
>(
  variables: GetAdminOrganizationsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetAdminOrganizationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetAdminOrganizationsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetAdminOrganizationsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetAdminOrganizations.infinite"]
            : ["GetAdminOrganizations.infinite", variables],
        queryFn: (metaData) =>
          fetcher<
            GetAdminOrganizationsQuery,
            GetAdminOrganizationsQueryVariables
          >(GetAdminOrganizationsDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetAdminOrganizationsQuery.getKey = (
  variables?: GetAdminOrganizationsQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminOrganizations.infinite"]
    : ["GetAdminOrganizations.infinite", variables];

useGetAdminOrganizationsQuery.fetcher = (
  variables?: GetAdminOrganizationsQueryVariables,
) =>
  fetcher<GetAdminOrganizationsQuery, GetAdminOrganizationsQueryVariables>(
    GetAdminOrganizationsDocument,
    variables,
  );

export const GetAdminDashboardStatsDocument = `
    query GetAdminDashboardStats {
  adminDashboardStats {
    totalUsers
    totalOrganizations
    recentSignups
  }
}
    `;

export const useGetAdminDashboardStatsQuery = <
  TData = GetAdminDashboardStatsQuery,
  TError = unknown,
>(
  variables?: GetAdminDashboardStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetAdminDashboardStatsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetAdminDashboardStatsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetAdminDashboardStatsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetAdminDashboardStats"]
        : ["GetAdminDashboardStats", variables],
    queryFn: fetcher<
      GetAdminDashboardStatsQuery,
      GetAdminDashboardStatsQueryVariables
    >(GetAdminDashboardStatsDocument, variables),
    ...options,
  });
};

useGetAdminDashboardStatsQuery.getKey = (
  variables?: GetAdminDashboardStatsQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminDashboardStats"]
    : ["GetAdminDashboardStats", variables];

export const useInfiniteGetAdminDashboardStatsQuery = <
  TData = InfiniteData<GetAdminDashboardStatsQuery>,
  TError = unknown,
>(
  variables: GetAdminDashboardStatsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetAdminDashboardStatsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetAdminDashboardStatsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetAdminDashboardStatsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetAdminDashboardStats.infinite"]
            : ["GetAdminDashboardStats.infinite", variables],
        queryFn: (metaData) =>
          fetcher<
            GetAdminDashboardStatsQuery,
            GetAdminDashboardStatsQueryVariables
          >(GetAdminDashboardStatsDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetAdminDashboardStatsQuery.getKey = (
  variables?: GetAdminDashboardStatsQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminDashboardStats.infinite"]
    : ["GetAdminDashboardStats.infinite", variables];

useGetAdminDashboardStatsQuery.fetcher = (
  variables?: GetAdminDashboardStatsQueryVariables,
) =>
  fetcher<GetAdminDashboardStatsQuery, GetAdminDashboardStatsQueryVariables>(
    GetAdminDashboardStatsDocument,
    variables,
  );

export const GetAdminSystemHealthDocument = `
    query GetAdminSystemHealth {
  adminSystemHealth {
    database {
      status
      message
      latency
    }
    stripe {
      status
      message
      latency
    }
    resend {
      status
      message
      latency
    }
    email {
      status
      message
      latency
    }
  }
}
    `;

export const useGetAdminSystemHealthQuery = <
  TData = GetAdminSystemHealthQuery,
  TError = unknown,
>(
  variables?: GetAdminSystemHealthQueryVariables,
  options?: Omit<
    UseQueryOptions<GetAdminSystemHealthQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetAdminSystemHealthQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetAdminSystemHealthQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetAdminSystemHealth"]
        : ["GetAdminSystemHealth", variables],
    queryFn: fetcher<
      GetAdminSystemHealthQuery,
      GetAdminSystemHealthQueryVariables
    >(GetAdminSystemHealthDocument, variables),
    ...options,
  });
};

useGetAdminSystemHealthQuery.getKey = (
  variables?: GetAdminSystemHealthQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminSystemHealth"]
    : ["GetAdminSystemHealth", variables];

export const useInfiniteGetAdminSystemHealthQuery = <
  TData = InfiniteData<GetAdminSystemHealthQuery>,
  TError = unknown,
>(
  variables: GetAdminSystemHealthQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetAdminSystemHealthQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetAdminSystemHealthQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetAdminSystemHealthQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetAdminSystemHealth.infinite"]
            : ["GetAdminSystemHealth.infinite", variables],
        queryFn: (metaData) =>
          fetcher<
            GetAdminSystemHealthQuery,
            GetAdminSystemHealthQueryVariables
          >(GetAdminSystemHealthDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetAdminSystemHealthQuery.getKey = (
  variables?: GetAdminSystemHealthQueryVariables,
) =>
  variables === undefined
    ? ["GetAdminSystemHealth.infinite"]
    : ["GetAdminSystemHealth.infinite", variables];

useGetAdminSystemHealthQuery.fetcher = (
  variables?: GetAdminSystemHealthQueryVariables,
) =>
  fetcher<GetAdminSystemHealthQuery, GetAdminSystemHealthQueryVariables>(
    GetAdminSystemHealthDocument,
    variables,
  );

export const CreateCheckoutDocument = `
    mutation CreateCheckout($planId: String!, $interval: String) {
  createCheckout(planId: $planId, interval: $interval) {
    url
    sessionId
  }
}
    `;

export const useCreateCheckoutMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateCheckoutMutation,
    TError,
    CreateCheckoutMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateCheckoutMutation,
    TError,
    CreateCheckoutMutationVariables,
    TContext
  >({
    mutationKey: ["CreateCheckout"],
    mutationFn: (variables?: CreateCheckoutMutationVariables) =>
      fetcher<CreateCheckoutMutation, CreateCheckoutMutationVariables>(
        CreateCheckoutDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateCheckoutMutation.fetcher = (
  variables: CreateCheckoutMutationVariables,
) =>
  fetcher<CreateCheckoutMutation, CreateCheckoutMutationVariables>(
    CreateCheckoutDocument,
    variables,
  );

export const CreateCreditCheckoutDocument = `
    mutation CreateCreditCheckout($packId: String!) {
  createCreditCheckout(packId: $packId) {
    url
    sessionId
  }
}
    `;

export const useCreateCreditCheckoutMutation = <
  TError = unknown,
  TContext = unknown,
>(
  options?: UseMutationOptions<
    CreateCreditCheckoutMutation,
    TError,
    CreateCreditCheckoutMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateCreditCheckoutMutation,
    TError,
    CreateCreditCheckoutMutationVariables,
    TContext
  >({
    mutationKey: ["CreateCreditCheckout"],
    mutationFn: (variables?: CreateCreditCheckoutMutationVariables) =>
      fetcher<
        CreateCreditCheckoutMutation,
        CreateCreditCheckoutMutationVariables
      >(CreateCreditCheckoutDocument, variables)(),
    ...options,
  });
};

useCreateCreditCheckoutMutation.fetcher = (
  variables: CreateCreditCheckoutMutationVariables,
) =>
  fetcher<CreateCreditCheckoutMutation, CreateCreditCheckoutMutationVariables>(
    CreateCreditCheckoutDocument,
    variables,
  );

export const CreateCustomerPortalDocument = `
    mutation CreateCustomerPortal {
  createCustomerPortal {
    url
  }
}
    `;

export const useCreateCustomerPortalMutation = <
  TError = unknown,
  TContext = unknown,
>(
  options?: UseMutationOptions<
    CreateCustomerPortalMutation,
    TError,
    CreateCustomerPortalMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateCustomerPortalMutation,
    TError,
    CreateCustomerPortalMutationVariables,
    TContext
  >({
    mutationKey: ["CreateCustomerPortal"],
    mutationFn: (variables?: CreateCustomerPortalMutationVariables) =>
      fetcher<
        CreateCustomerPortalMutation,
        CreateCustomerPortalMutationVariables
      >(CreateCustomerPortalDocument, variables)(),
    ...options,
  });
};

useCreateCustomerPortalMutation.fetcher = (
  variables?: CreateCustomerPortalMutationVariables,
) =>
  fetcher<CreateCustomerPortalMutation, CreateCustomerPortalMutationVariables>(
    CreateCustomerPortalDocument,
    variables,
  );

export const GetCreditBalanceDocument = `
    query GetCreditBalance {
  creditBalance {
    balance
    planId
    subscriptionStatus
    cancelAtPeriodEnd
    subscriptionEndDate
    currentPeriodEnd
  }
}
    `;

export const useGetCreditBalanceQuery = <
  TData = GetCreditBalanceQuery,
  TError = unknown,
>(
  variables?: GetCreditBalanceQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCreditBalanceQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetCreditBalanceQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetCreditBalanceQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetCreditBalance"]
        : ["GetCreditBalance", variables],
    queryFn: fetcher<GetCreditBalanceQuery, GetCreditBalanceQueryVariables>(
      GetCreditBalanceDocument,
      variables,
    ),
    ...options,
  });
};

useGetCreditBalanceQuery.getKey = (
  variables?: GetCreditBalanceQueryVariables,
) =>
  variables === undefined
    ? ["GetCreditBalance"]
    : ["GetCreditBalance", variables];

export const useInfiniteGetCreditBalanceQuery = <
  TData = InfiniteData<GetCreditBalanceQuery>,
  TError = unknown,
>(
  variables: GetCreditBalanceQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetCreditBalanceQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetCreditBalanceQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetCreditBalanceQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetCreditBalance.infinite"]
            : ["GetCreditBalance.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetCreditBalanceQuery, GetCreditBalanceQueryVariables>(
            GetCreditBalanceDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetCreditBalanceQuery.getKey = (
  variables?: GetCreditBalanceQueryVariables,
) =>
  variables === undefined
    ? ["GetCreditBalance.infinite"]
    : ["GetCreditBalance.infinite", variables];

useGetCreditBalanceQuery.fetcher = (
  variables?: GetCreditBalanceQueryVariables,
) =>
  fetcher<GetCreditBalanceQuery, GetCreditBalanceQueryVariables>(
    GetCreditBalanceDocument,
    variables,
  );

export const GetCreditHistoryDocument = `
    query GetCreditHistory($limit: Int) {
  creditHistory(limit: $limit) {
    id
    amount
    type
    description
    balanceAfter
    createdAt
    metadata
  }
}
    `;

export const useGetCreditHistoryQuery = <
  TData = GetCreditHistoryQuery,
  TError = unknown,
>(
  variables?: GetCreditHistoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCreditHistoryQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetCreditHistoryQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetCreditHistoryQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetCreditHistory"]
        : ["GetCreditHistory", variables],
    queryFn: fetcher<GetCreditHistoryQuery, GetCreditHistoryQueryVariables>(
      GetCreditHistoryDocument,
      variables,
    ),
    ...options,
  });
};

useGetCreditHistoryQuery.getKey = (
  variables?: GetCreditHistoryQueryVariables,
) =>
  variables === undefined
    ? ["GetCreditHistory"]
    : ["GetCreditHistory", variables];

export const useInfiniteGetCreditHistoryQuery = <
  TData = InfiniteData<GetCreditHistoryQuery>,
  TError = unknown,
>(
  variables: GetCreditHistoryQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetCreditHistoryQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetCreditHistoryQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetCreditHistoryQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetCreditHistory.infinite"]
            : ["GetCreditHistory.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetCreditHistoryQuery, GetCreditHistoryQueryVariables>(
            GetCreditHistoryDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetCreditHistoryQuery.getKey = (
  variables?: GetCreditHistoryQueryVariables,
) =>
  variables === undefined
    ? ["GetCreditHistory.infinite"]
    : ["GetCreditHistory.infinite", variables];

useGetCreditHistoryQuery.fetcher = (
  variables?: GetCreditHistoryQueryVariables,
) =>
  fetcher<GetCreditHistoryQuery, GetCreditHistoryQueryVariables>(
    GetCreditHistoryDocument,
    variables,
  );

export const GetBillingPlansDocument = `
    query GetBillingPlans {
  billingPlans {
    id
    name
    description
    priceMonthly
    priceYearly
    creditsPerMonth
    features
  }
}
    `;

export const useGetBillingPlansQuery = <
  TData = GetBillingPlansQuery,
  TError = unknown,
>(
  variables?: GetBillingPlansQueryVariables,
  options?: Omit<
    UseQueryOptions<GetBillingPlansQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetBillingPlansQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetBillingPlansQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetBillingPlans"]
        : ["GetBillingPlans", variables],
    queryFn: fetcher<GetBillingPlansQuery, GetBillingPlansQueryVariables>(
      GetBillingPlansDocument,
      variables,
    ),
    ...options,
  });
};

useGetBillingPlansQuery.getKey = (variables?: GetBillingPlansQueryVariables) =>
  variables === undefined
    ? ["GetBillingPlans"]
    : ["GetBillingPlans", variables];

export const useInfiniteGetBillingPlansQuery = <
  TData = InfiniteData<GetBillingPlansQuery>,
  TError = unknown,
>(
  variables: GetBillingPlansQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetBillingPlansQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetBillingPlansQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetBillingPlansQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetBillingPlans.infinite"]
            : ["GetBillingPlans.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetBillingPlansQuery, GetBillingPlansQueryVariables>(
            GetBillingPlansDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetBillingPlansQuery.getKey = (
  variables?: GetBillingPlansQueryVariables,
) =>
  variables === undefined
    ? ["GetBillingPlans.infinite"]
    : ["GetBillingPlans.infinite", variables];

useGetBillingPlansQuery.fetcher = (variables?: GetBillingPlansQueryVariables) =>
  fetcher<GetBillingPlansQuery, GetBillingPlansQueryVariables>(
    GetBillingPlansDocument,
    variables,
  );

export const GetCreditPacksDocument = `
    query GetCreditPacks {
  creditPacks {
    id
    name
    credits
    price
  }
}
    `;

export const useGetCreditPacksQuery = <
  TData = GetCreditPacksQuery,
  TError = unknown,
>(
  variables?: GetCreditPacksQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCreditPacksQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetCreditPacksQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetCreditPacksQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetCreditPacks"]
        : ["GetCreditPacks", variables],
    queryFn: fetcher<GetCreditPacksQuery, GetCreditPacksQueryVariables>(
      GetCreditPacksDocument,
      variables,
    ),
    ...options,
  });
};

useGetCreditPacksQuery.getKey = (variables?: GetCreditPacksQueryVariables) =>
  variables === undefined ? ["GetCreditPacks"] : ["GetCreditPacks", variables];

export const useInfiniteGetCreditPacksQuery = <
  TData = InfiniteData<GetCreditPacksQuery>,
  TError = unknown,
>(
  variables: GetCreditPacksQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetCreditPacksQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetCreditPacksQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetCreditPacksQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetCreditPacks.infinite"]
            : ["GetCreditPacks.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetCreditPacksQuery, GetCreditPacksQueryVariables>(
            GetCreditPacksDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetCreditPacksQuery.getKey = (
  variables?: GetCreditPacksQueryVariables,
) =>
  variables === undefined
    ? ["GetCreditPacks.infinite"]
    : ["GetCreditPacks.infinite", variables];

useGetCreditPacksQuery.fetcher = (variables?: GetCreditPacksQueryVariables) =>
  fetcher<GetCreditPacksQuery, GetCreditPacksQueryVariables>(
    GetCreditPacksDocument,
    variables,
  );

export const MarkNotificationReadDocument = `
    mutation MarkNotificationRead($notificationId: String!) {
  markNotificationRead(notificationId: $notificationId) {
    id
    read
    readAt
  }
}
    `;

export const useMarkNotificationReadMutation = <
  TError = unknown,
  TContext = unknown,
>(
  options?: UseMutationOptions<
    MarkNotificationReadMutation,
    TError,
    MarkNotificationReadMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    MarkNotificationReadMutation,
    TError,
    MarkNotificationReadMutationVariables,
    TContext
  >({
    mutationKey: ["MarkNotificationRead"],
    mutationFn: (variables?: MarkNotificationReadMutationVariables) =>
      fetcher<
        MarkNotificationReadMutation,
        MarkNotificationReadMutationVariables
      >(MarkNotificationReadDocument, variables)(),
    ...options,
  });
};

useMarkNotificationReadMutation.fetcher = (
  variables: MarkNotificationReadMutationVariables,
) =>
  fetcher<MarkNotificationReadMutation, MarkNotificationReadMutationVariables>(
    MarkNotificationReadDocument,
    variables,
  );

export const MarkAllNotificationsReadDocument = `
    mutation MarkAllNotificationsRead {
  markAllNotificationsRead
}
    `;

export const useMarkAllNotificationsReadMutation = <
  TError = unknown,
  TContext = unknown,
>(
  options?: UseMutationOptions<
    MarkAllNotificationsReadMutation,
    TError,
    MarkAllNotificationsReadMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    MarkAllNotificationsReadMutation,
    TError,
    MarkAllNotificationsReadMutationVariables,
    TContext
  >({
    mutationKey: ["MarkAllNotificationsRead"],
    mutationFn: (variables?: MarkAllNotificationsReadMutationVariables) =>
      fetcher<
        MarkAllNotificationsReadMutation,
        MarkAllNotificationsReadMutationVariables
      >(MarkAllNotificationsReadDocument, variables)(),
    ...options,
  });
};

useMarkAllNotificationsReadMutation.fetcher = (
  variables?: MarkAllNotificationsReadMutationVariables,
) =>
  fetcher<
    MarkAllNotificationsReadMutation,
    MarkAllNotificationsReadMutationVariables
  >(MarkAllNotificationsReadDocument, variables);

export const GetNotificationsDocument = `
    query GetNotifications($limit: Int) {
  notifications(limit: $limit) {
    id
    title
    message
    type
    link
    read
    createdAt
    readAt
  }
}
    `;

export const useGetNotificationsQuery = <
  TData = GetNotificationsQuery,
  TError = unknown,
>(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetNotificationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetNotificationsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetNotificationsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetNotifications"]
        : ["GetNotifications", variables],
    queryFn: fetcher<GetNotificationsQuery, GetNotificationsQueryVariables>(
      GetNotificationsDocument,
      variables,
    ),
    ...options,
  });
};

useGetNotificationsQuery.getKey = (
  variables?: GetNotificationsQueryVariables,
) =>
  variables === undefined
    ? ["GetNotifications"]
    : ["GetNotifications", variables];

export const useInfiniteGetNotificationsQuery = <
  TData = InfiniteData<GetNotificationsQuery>,
  TError = unknown,
>(
  variables: GetNotificationsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetNotificationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetNotificationsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetNotificationsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetNotifications.infinite"]
            : ["GetNotifications.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetNotificationsQuery, GetNotificationsQueryVariables>(
            GetNotificationsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetNotificationsQuery.getKey = (
  variables?: GetNotificationsQueryVariables,
) =>
  variables === undefined
    ? ["GetNotifications.infinite"]
    : ["GetNotifications.infinite", variables];

useGetNotificationsQuery.fetcher = (
  variables?: GetNotificationsQueryVariables,
) =>
  fetcher<GetNotificationsQuery, GetNotificationsQueryVariables>(
    GetNotificationsDocument,
    variables,
  );

export const GetUnreadNotificationCountDocument = `
    query GetUnreadNotificationCount {
  unreadNotificationCount {
    count
  }
}
    `;

export const useGetUnreadNotificationCountQuery = <
  TData = GetUnreadNotificationCountQuery,
  TError = unknown,
>(
  variables?: GetUnreadNotificationCountQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUnreadNotificationCountQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetUnreadNotificationCountQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetUnreadNotificationCountQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetUnreadNotificationCount"]
        : ["GetUnreadNotificationCount", variables],
    queryFn: fetcher<
      GetUnreadNotificationCountQuery,
      GetUnreadNotificationCountQueryVariables
    >(GetUnreadNotificationCountDocument, variables),
    ...options,
  });
};

useGetUnreadNotificationCountQuery.getKey = (
  variables?: GetUnreadNotificationCountQueryVariables,
) =>
  variables === undefined
    ? ["GetUnreadNotificationCount"]
    : ["GetUnreadNotificationCount", variables];

export const useInfiniteGetUnreadNotificationCountQuery = <
  TData = InfiniteData<GetUnreadNotificationCountQuery>,
  TError = unknown,
>(
  variables: GetUnreadNotificationCountQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetUnreadNotificationCountQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetUnreadNotificationCountQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetUnreadNotificationCountQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetUnreadNotificationCount.infinite"]
            : ["GetUnreadNotificationCount.infinite", variables],
        queryFn: (metaData) =>
          fetcher<
            GetUnreadNotificationCountQuery,
            GetUnreadNotificationCountQueryVariables
          >(GetUnreadNotificationCountDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetUnreadNotificationCountQuery.getKey = (
  variables?: GetUnreadNotificationCountQueryVariables,
) =>
  variables === undefined
    ? ["GetUnreadNotificationCount.infinite"]
    : ["GetUnreadNotificationCount.infinite", variables];

useGetUnreadNotificationCountQuery.fetcher = (
  variables?: GetUnreadNotificationCountQueryVariables,
) =>
  fetcher<
    GetUnreadNotificationCountQuery,
    GetUnreadNotificationCountQueryVariables
  >(GetUnreadNotificationCountDocument, variables);

export const GetUserOrganizationsDocument = `
    query GetUserOrganizations {
  userOrganizations {
    id
    name
    slug
    role
    logo
  }
}
    `;

export const useGetUserOrganizationsQuery = <
  TData = GetUserOrganizationsQuery,
  TError = unknown,
>(
  variables?: GetUserOrganizationsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserOrganizationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetUserOrganizationsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useQuery<GetUserOrganizationsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetUserOrganizations"]
        : ["GetUserOrganizations", variables],
    queryFn: fetcher<
      GetUserOrganizationsQuery,
      GetUserOrganizationsQueryVariables
    >(GetUserOrganizationsDocument, variables),
    ...options,
  });
};

useGetUserOrganizationsQuery.getKey = (
  variables?: GetUserOrganizationsQueryVariables,
) =>
  variables === undefined
    ? ["GetUserOrganizations"]
    : ["GetUserOrganizations", variables];

export const useInfiniteGetUserOrganizationsQuery = <
  TData = InfiniteData<GetUserOrganizationsQuery>,
  TError = unknown,
>(
  variables: GetUserOrganizationsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetUserOrganizationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetUserOrganizationsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetUserOrganizationsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetUserOrganizations.infinite"]
            : ["GetUserOrganizations.infinite", variables],
        queryFn: (metaData) =>
          fetcher<
            GetUserOrganizationsQuery,
            GetUserOrganizationsQueryVariables
          >(GetUserOrganizationsDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetUserOrganizationsQuery.getKey = (
  variables?: GetUserOrganizationsQueryVariables,
) =>
  variables === undefined
    ? ["GetUserOrganizations.infinite"]
    : ["GetUserOrganizations.infinite", variables];

useGetUserOrganizationsQuery.fetcher = (
  variables?: GetUserOrganizationsQueryVariables,
) =>
  fetcher<GetUserOrganizationsQuery, GetUserOrganizationsQueryVariables>(
    GetUserOrganizationsDocument,
    variables,
  );

export const CreateProjectDocument = `
    mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    description
    organizationId
    createdAt
    updatedAt
  }
}
    `;

export const useCreateProjectMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateProjectMutation,
    TError,
    CreateProjectMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateProjectMutation,
    TError,
    CreateProjectMutationVariables,
    TContext
  >({
    mutationKey: ["CreateProject"],
    mutationFn: (variables?: CreateProjectMutationVariables) =>
      fetcher<CreateProjectMutation, CreateProjectMutationVariables>(
        CreateProjectDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateProjectMutation.fetcher = (
  variables: CreateProjectMutationVariables,
) =>
  fetcher<CreateProjectMutation, CreateProjectMutationVariables>(
    CreateProjectDocument,
    variables,
  );

export const UpdateProjectDocument = `
    mutation UpdateProject($id: String!, $input: UpdateProjectInput!) {
  updateProject(id: $id, input: $input) {
    id
    name
    description
    organizationId
    createdAt
    updatedAt
  }
}
    `;

export const useUpdateProjectMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateProjectMutation,
    TError,
    UpdateProjectMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateProjectMutation,
    TError,
    UpdateProjectMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateProject"],
    mutationFn: (variables?: UpdateProjectMutationVariables) =>
      fetcher<UpdateProjectMutation, UpdateProjectMutationVariables>(
        UpdateProjectDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateProjectMutation.fetcher = (
  variables: UpdateProjectMutationVariables,
) =>
  fetcher<UpdateProjectMutation, UpdateProjectMutationVariables>(
    UpdateProjectDocument,
    variables,
  );

export const DeleteProjectDocument = `
    mutation DeleteProject($id: String!) {
  deleteProject(id: $id)
}
    `;

export const useDeleteProjectMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteProjectMutation,
    TError,
    DeleteProjectMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    DeleteProjectMutation,
    TError,
    DeleteProjectMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteProject"],
    mutationFn: (variables?: DeleteProjectMutationVariables) =>
      fetcher<DeleteProjectMutation, DeleteProjectMutationVariables>(
        DeleteProjectDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteProjectMutation.fetcher = (
  variables: DeleteProjectMutationVariables,
) =>
  fetcher<DeleteProjectMutation, DeleteProjectMutationVariables>(
    DeleteProjectDocument,
    variables,
  );

export const GetProjectsDocument = `
    query GetProjects {
  projects {
    id
    name
    description
    organizationId
    createdAt
    updatedAt
  }
}
    `;

export const useGetProjectsQuery = <TData = GetProjectsQuery, TError = unknown>(
  variables?: GetProjectsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetProjectsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetProjectsQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetProjectsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ["GetProjects"] : ["GetProjects", variables],
    queryFn: fetcher<GetProjectsQuery, GetProjectsQueryVariables>(
      GetProjectsDocument,
      variables,
    ),
    ...options,
  });
};

useGetProjectsQuery.getKey = (variables?: GetProjectsQueryVariables) =>
  variables === undefined ? ["GetProjects"] : ["GetProjects", variables];

export const useInfiniteGetProjectsQuery = <
  TData = InfiniteData<GetProjectsQuery>,
  TError = unknown,
>(
  variables: GetProjectsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetProjectsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetProjectsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetProjectsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetProjects.infinite"]
            : ["GetProjects.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetProjectsQuery, GetProjectsQueryVariables>(
            GetProjectsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetProjectsQuery.getKey = (variables?: GetProjectsQueryVariables) =>
  variables === undefined
    ? ["GetProjects.infinite"]
    : ["GetProjects.infinite", variables];

useGetProjectsQuery.fetcher = (variables?: GetProjectsQueryVariables) =>
  fetcher<GetProjectsQuery, GetProjectsQueryVariables>(
    GetProjectsDocument,
    variables,
  );

export const GetProjectDocument = `
    query GetProject($id: String!) {
  project(id: $id) {
    id
    name
    description
    organizationId
    createdAt
    updatedAt
  }
}
    `;

export const useGetProjectQuery = <TData = GetProjectQuery, TError = unknown>(
  variables: GetProjectQueryVariables,
  options?: Omit<
    UseQueryOptions<GetProjectQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetProjectQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetProjectQuery, TError, TData>({
    queryKey: ["GetProject", variables],
    queryFn: fetcher<GetProjectQuery, GetProjectQueryVariables>(
      GetProjectDocument,
      variables,
    ),
    ...options,
  });
};

useGetProjectQuery.getKey = (variables: GetProjectQueryVariables) => [
  "GetProject",
  variables,
];

export const useInfiniteGetProjectQuery = <
  TData = InfiniteData<GetProjectQuery>,
  TError = unknown,
>(
  variables: GetProjectQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetProjectQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetProjectQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetProjectQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? ["GetProject.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetProjectQuery, GetProjectQueryVariables>(
            GetProjectDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetProjectQuery.getKey = (variables: GetProjectQueryVariables) => [
  "GetProject.infinite",
  variables,
];

useGetProjectQuery.fetcher = (variables: GetProjectQueryVariables) =>
  fetcher<GetProjectQuery, GetProjectQueryVariables>(
    GetProjectDocument,
    variables,
  );

export const CreateTaskDocument = `
    mutation CreateTask($input: CreateTaskInput!) {
  createTask(input: $input) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
    `;

export const useCreateTaskMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateTaskMutation,
    TError,
    CreateTaskMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateTaskMutation,
    TError,
    CreateTaskMutationVariables,
    TContext
  >({
    mutationKey: ["CreateTask"],
    mutationFn: (variables?: CreateTaskMutationVariables) =>
      fetcher<CreateTaskMutation, CreateTaskMutationVariables>(
        CreateTaskDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateTaskMutation.fetcher = (variables: CreateTaskMutationVariables) =>
  fetcher<CreateTaskMutation, CreateTaskMutationVariables>(
    CreateTaskDocument,
    variables,
  );

export const UpdateTaskDocument = `
    mutation UpdateTask($id: String!, $input: UpdateTaskInput!) {
  updateTask(id: $id, input: $input) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
    `;

export const useUpdateTaskMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateTaskMutation,
    TError,
    UpdateTaskMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateTaskMutation,
    TError,
    UpdateTaskMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateTask"],
    mutationFn: (variables?: UpdateTaskMutationVariables) =>
      fetcher<UpdateTaskMutation, UpdateTaskMutationVariables>(
        UpdateTaskDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateTaskMutation.fetcher = (variables: UpdateTaskMutationVariables) =>
  fetcher<UpdateTaskMutation, UpdateTaskMutationVariables>(
    UpdateTaskDocument,
    variables,
  );

export const DeleteTaskDocument = `
    mutation DeleteTask($id: String!) {
  deleteTask(id: $id) {
    id
    name
  }
}
    `;

export const useDeleteTaskMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteTaskMutation,
    TError,
    DeleteTaskMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    DeleteTaskMutation,
    TError,
    DeleteTaskMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteTask"],
    mutationFn: (variables?: DeleteTaskMutationVariables) =>
      fetcher<DeleteTaskMutation, DeleteTaskMutationVariables>(
        DeleteTaskDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteTaskMutation.fetcher = (variables: DeleteTaskMutationVariables) =>
  fetcher<DeleteTaskMutation, DeleteTaskMutationVariables>(
    DeleteTaskDocument,
    variables,
  );

export const GetTasksDocument = `
    query GetTasks {
  tasks {
    id
    name
    description
    createdAt
    updatedAt
  }
}
    `;

export const useGetTasksQuery = <TData = GetTasksQuery, TError = unknown>(
  variables?: GetTasksQueryVariables,
  options?: Omit<UseQueryOptions<GetTasksQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetTasksQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetTasksQuery, TError, TData>({
    queryKey: variables === undefined ? ["GetTasks"] : ["GetTasks", variables],
    queryFn: fetcher<GetTasksQuery, GetTasksQueryVariables>(
      GetTasksDocument,
      variables,
    ),
    ...options,
  });
};

useGetTasksQuery.getKey = (variables?: GetTasksQueryVariables) =>
  variables === undefined ? ["GetTasks"] : ["GetTasks", variables];

export const useInfiniteGetTasksQuery = <
  TData = InfiniteData<GetTasksQuery>,
  TError = unknown,
>(
  variables: GetTasksQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetTasksQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetTasksQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetTasksQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetTasks.infinite"]
            : ["GetTasks.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetTasksQuery.getKey = (variables?: GetTasksQueryVariables) =>
  variables === undefined
    ? ["GetTasks.infinite"]
    : ["GetTasks.infinite", variables];

useGetTasksQuery.fetcher = (variables?: GetTasksQueryVariables) =>
  fetcher<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, variables);

export const GetTaskDocument = `
    query GetTask($id: String!) {
  task(id: $id) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
    `;

export const useGetTaskQuery = <TData = GetTaskQuery, TError = unknown>(
  variables: GetTaskQueryVariables,
  options?: Omit<UseQueryOptions<GetTaskQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetTaskQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetTaskQuery, TError, TData>({
    queryKey: ["GetTask", variables],
    queryFn: fetcher<GetTaskQuery, GetTaskQueryVariables>(
      GetTaskDocument,
      variables,
    ),
    ...options,
  });
};

useGetTaskQuery.getKey = (variables: GetTaskQueryVariables) => [
  "GetTask",
  variables,
];

export const useInfiniteGetTaskQuery = <
  TData = InfiniteData<GetTaskQuery>,
  TError = unknown,
>(
  variables: GetTaskQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetTaskQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<GetTaskQuery, TError, TData>["queryKey"];
  },
) => {
  return useInfiniteQuery<GetTaskQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? ["GetTask.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, {
            ...variables,
            ...(metaData.pageParam ?? {}),
          })(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetTaskQuery.getKey = (variables: GetTaskQueryVariables) => [
  "GetTask.infinite",
  variables,
];

useGetTaskQuery.fetcher = (variables: GetTaskQueryVariables) =>
  fetcher<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, variables);

export const StartTimerDocument = `
    mutation StartTimer($input: StartTimerInput) {
  startTimer(input: $input) {
    ...TimeEntryFields
  }
}
    ${TimeEntryFieldsFragmentDoc}`;

export const useStartTimerMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    StartTimerMutation,
    TError,
    StartTimerMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    StartTimerMutation,
    TError,
    StartTimerMutationVariables,
    TContext
  >({
    mutationKey: ["StartTimer"],
    mutationFn: (variables?: StartTimerMutationVariables) =>
      fetcher<StartTimerMutation, StartTimerMutationVariables>(
        StartTimerDocument,
        variables,
      )(),
    ...options,
  });
};

useStartTimerMutation.fetcher = (variables?: StartTimerMutationVariables) =>
  fetcher<StartTimerMutation, StartTimerMutationVariables>(
    StartTimerDocument,
    variables,
  );

export const StopTimerDocument = `
    mutation StopTimer {
  stopTimer {
    ...TimeEntryFields
  }
}
    ${TimeEntryFieldsFragmentDoc}`;

export const useStopTimerMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    StopTimerMutation,
    TError,
    StopTimerMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    StopTimerMutation,
    TError,
    StopTimerMutationVariables,
    TContext
  >({
    mutationKey: ["StopTimer"],
    mutationFn: (variables?: StopTimerMutationVariables) =>
      fetcher<StopTimerMutation, StopTimerMutationVariables>(
        StopTimerDocument,
        variables,
      )(),
    ...options,
  });
};

useStopTimerMutation.fetcher = (variables?: StopTimerMutationVariables) =>
  fetcher<StopTimerMutation, StopTimerMutationVariables>(
    StopTimerDocument,
    variables,
  );

export const CreateEntryDocument = `
    mutation CreateEntry($input: CreateEntryInput!) {
  createEntry(input: $input) {
    ...TimeEntryFields
  }
}
    ${TimeEntryFieldsFragmentDoc}`;

export const useCreateEntryMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateEntryMutation,
    TError,
    CreateEntryMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateEntryMutation,
    TError,
    CreateEntryMutationVariables,
    TContext
  >({
    mutationKey: ["CreateEntry"],
    mutationFn: (variables?: CreateEntryMutationVariables) =>
      fetcher<CreateEntryMutation, CreateEntryMutationVariables>(
        CreateEntryDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateEntryMutation.fetcher = (variables: CreateEntryMutationVariables) =>
  fetcher<CreateEntryMutation, CreateEntryMutationVariables>(
    CreateEntryDocument,
    variables,
  );

export const UpdateEntryDocument = `
    mutation UpdateEntry($id: String!, $input: UpdateEntryInput!) {
  updateEntry(id: $id, input: $input) {
    ...TimeEntryFields
  }
}
    ${TimeEntryFieldsFragmentDoc}`;

export const useUpdateEntryMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateEntryMutation,
    TError,
    UpdateEntryMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateEntryMutation,
    TError,
    UpdateEntryMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateEntry"],
    mutationFn: (variables?: UpdateEntryMutationVariables) =>
      fetcher<UpdateEntryMutation, UpdateEntryMutationVariables>(
        UpdateEntryDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateEntryMutation.fetcher = (variables: UpdateEntryMutationVariables) =>
  fetcher<UpdateEntryMutation, UpdateEntryMutationVariables>(
    UpdateEntryDocument,
    variables,
  );

export const DeleteEntryDocument = `
    mutation DeleteEntry($id: String!) {
  deleteEntry(id: $id)
}
    `;

export const useDeleteEntryMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteEntryMutation,
    TError,
    DeleteEntryMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    DeleteEntryMutation,
    TError,
    DeleteEntryMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteEntry"],
    mutationFn: (variables?: DeleteEntryMutationVariables) =>
      fetcher<DeleteEntryMutation, DeleteEntryMutationVariables>(
        DeleteEntryDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteEntryMutation.fetcher = (variables: DeleteEntryMutationVariables) =>
  fetcher<DeleteEntryMutation, DeleteEntryMutationVariables>(
    DeleteEntryDocument,
    variables,
  );

export const GetCurrentEntryDocument = `
    query GetCurrentEntry {
  currentEntry {
    ...TimeEntryFields
  }
}
    ${TimeEntryFieldsFragmentDoc}`;

export const useGetCurrentEntryQuery = <
  TData = GetCurrentEntryQuery,
  TError = unknown,
>(
  variables?: GetCurrentEntryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCurrentEntryQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetCurrentEntryQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetCurrentEntryQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetCurrentEntry"]
        : ["GetCurrentEntry", variables],
    queryFn: fetcher<GetCurrentEntryQuery, GetCurrentEntryQueryVariables>(
      GetCurrentEntryDocument,
      variables,
    ),
    ...options,
  });
};

useGetCurrentEntryQuery.getKey = (variables?: GetCurrentEntryQueryVariables) =>
  variables === undefined
    ? ["GetCurrentEntry"]
    : ["GetCurrentEntry", variables];

export const useInfiniteGetCurrentEntryQuery = <
  TData = InfiniteData<GetCurrentEntryQuery>,
  TError = unknown,
>(
  variables: GetCurrentEntryQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetCurrentEntryQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetCurrentEntryQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetCurrentEntryQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetCurrentEntry.infinite"]
            : ["GetCurrentEntry.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetCurrentEntryQuery, GetCurrentEntryQueryVariables>(
            GetCurrentEntryDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetCurrentEntryQuery.getKey = (
  variables?: GetCurrentEntryQueryVariables,
) =>
  variables === undefined
    ? ["GetCurrentEntry.infinite"]
    : ["GetCurrentEntry.infinite", variables];

useGetCurrentEntryQuery.fetcher = (variables?: GetCurrentEntryQueryVariables) =>
  fetcher<GetCurrentEntryQuery, GetCurrentEntryQueryVariables>(
    GetCurrentEntryDocument,
    variables,
  );

export const GetEntriesDocument = `
    query GetEntries($from: DateTime!, $to: DateTime!) {
  entries(from: $from, to: $to) {
    ...TimeEntryFields
  }
}
    ${TimeEntryFieldsFragmentDoc}`;

export const useGetEntriesQuery = <TData = GetEntriesQuery, TError = unknown>(
  variables: GetEntriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEntriesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetEntriesQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetEntriesQuery, TError, TData>({
    queryKey: ["GetEntries", variables],
    queryFn: fetcher<GetEntriesQuery, GetEntriesQueryVariables>(
      GetEntriesDocument,
      variables,
    ),
    ...options,
  });
};

useGetEntriesQuery.getKey = (variables: GetEntriesQueryVariables) => [
  "GetEntries",
  variables,
];

export const useInfiniteGetEntriesQuery = <
  TData = InfiniteData<GetEntriesQuery>,
  TError = unknown,
>(
  variables: GetEntriesQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetEntriesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetEntriesQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetEntriesQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? ["GetEntries.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetEntriesQuery, GetEntriesQueryVariables>(
            GetEntriesDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetEntriesQuery.getKey = (variables: GetEntriesQueryVariables) => [
  "GetEntries.infinite",
  variables,
];

useGetEntriesQuery.fetcher = (variables: GetEntriesQueryVariables) =>
  fetcher<GetEntriesQuery, GetEntriesQueryVariables>(
    GetEntriesDocument,
    variables,
  );

export const GetDailyTotalsDocument = `
    query GetDailyTotals($from: DateTime!, $to: DateTime!) {
  dailyTotals(from: $from, to: $to) {
    date
    totalMinutes
  }
}
    `;

export const useGetDailyTotalsQuery = <
  TData = GetDailyTotalsQuery,
  TError = unknown,
>(
  variables: GetDailyTotalsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetDailyTotalsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetDailyTotalsQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetDailyTotalsQuery, TError, TData>({
    queryKey: ["GetDailyTotals", variables],
    queryFn: fetcher<GetDailyTotalsQuery, GetDailyTotalsQueryVariables>(
      GetDailyTotalsDocument,
      variables,
    ),
    ...options,
  });
};

useGetDailyTotalsQuery.getKey = (variables: GetDailyTotalsQueryVariables) => [
  "GetDailyTotals",
  variables,
];

export const useInfiniteGetDailyTotalsQuery = <
  TData = InfiniteData<GetDailyTotalsQuery>,
  TError = unknown,
>(
  variables: GetDailyTotalsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetDailyTotalsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetDailyTotalsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetDailyTotalsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey: optionsQueryKey ?? ["GetDailyTotals.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetDailyTotalsQuery, GetDailyTotalsQueryVariables>(
            GetDailyTotalsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetDailyTotalsQuery.getKey = (
  variables: GetDailyTotalsQueryVariables,
) => ["GetDailyTotals.infinite", variables];

useGetDailyTotalsQuery.fetcher = (variables: GetDailyTotalsQueryVariables) =>
  fetcher<GetDailyTotalsQuery, GetDailyTotalsQueryVariables>(
    GetDailyTotalsDocument,
    variables,
  );

export const UpdateUserSettingsDocument = `
    mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
  updateUserSettings(input: $input) {
    ...UserSettingsFields
  }
}
    ${UserSettingsFieldsFragmentDoc}`;

export const useUpdateUserSettingsMutation = <
  TError = unknown,
  TContext = unknown,
>(
  options?: UseMutationOptions<
    UpdateUserSettingsMutation,
    TError,
    UpdateUserSettingsMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateUserSettingsMutation,
    TError,
    UpdateUserSettingsMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateUserSettings"],
    mutationFn: (variables?: UpdateUserSettingsMutationVariables) =>
      fetcher<UpdateUserSettingsMutation, UpdateUserSettingsMutationVariables>(
        UpdateUserSettingsDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateUserSettingsMutation.fetcher = (
  variables: UpdateUserSettingsMutationVariables,
) =>
  fetcher<UpdateUserSettingsMutation, UpdateUserSettingsMutationVariables>(
    UpdateUserSettingsDocument,
    variables,
  );

export const GetUserSettingsDocument = `
    query GetUserSettings {
  userSettings {
    ...UserSettingsFields
  }
}
    ${UserSettingsFieldsFragmentDoc}`;

export const useGetUserSettingsQuery = <
  TData = GetUserSettingsQuery,
  TError = unknown,
>(
  variables?: GetUserSettingsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserSettingsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetUserSettingsQuery, TError, TData>["queryKey"];
  },
) => {
  return useQuery<GetUserSettingsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetUserSettings"]
        : ["GetUserSettings", variables],
    queryFn: fetcher<GetUserSettingsQuery, GetUserSettingsQueryVariables>(
      GetUserSettingsDocument,
      variables,
    ),
    ...options,
  });
};

useGetUserSettingsQuery.getKey = (variables?: GetUserSettingsQueryVariables) =>
  variables === undefined
    ? ["GetUserSettings"]
    : ["GetUserSettings", variables];

export const useInfiniteGetUserSettingsQuery = <
  TData = InfiniteData<GetUserSettingsQuery>,
  TError = unknown,
>(
  variables: GetUserSettingsQueryVariables,
  options: Omit<
    UseInfiniteQueryOptions<GetUserSettingsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseInfiniteQueryOptions<
      GetUserSettingsQuery,
      TError,
      TData
    >["queryKey"];
  },
) => {
  return useInfiniteQuery<GetUserSettingsQuery, TError, TData>(
    (() => {
      const { queryKey: optionsQueryKey, ...restOptions } = options;
      return {
        queryKey:
          (optionsQueryKey ?? variables === undefined)
            ? ["GetUserSettings.infinite"]
            : ["GetUserSettings.infinite", variables],
        queryFn: (metaData) =>
          fetcher<GetUserSettingsQuery, GetUserSettingsQueryVariables>(
            GetUserSettingsDocument,
            { ...variables, ...(metaData.pageParam ?? {}) },
          )(),
        ...restOptions,
      };
    })(),
  );
};

useInfiniteGetUserSettingsQuery.getKey = (
  variables?: GetUserSettingsQueryVariables,
) =>
  variables === undefined
    ? ["GetUserSettings.infinite"]
    : ["GetUserSettings.infinite", variables];

useGetUserSettingsQuery.fetcher = (variables?: GetUserSettingsQueryVariables) =>
  fetcher<GetUserSettingsQuery, GetUserSettingsQueryVariables>(
    GetUserSettingsDocument,
    variables,
  );
