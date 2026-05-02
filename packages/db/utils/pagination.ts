import { SQL } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";
import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export async function withPagination<T extends PgSelect>(
  qb: T,
  page: number = 1,
  pageSize: number = 20
) {
  return qb.limit(pageSize).offset((page - 1) * pageSize);
}
