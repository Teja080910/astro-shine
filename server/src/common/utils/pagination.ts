export interface Pagination {
  page: number;
  limit: number;
  offset: number;
  enabled: boolean;
  q?: string;
}

export function parsePagination(
  query: any,
  defaultLimit = 20,
  maxLimit = 100,
): Pagination {
  const pageNum = Number(query?.page);
  const limitNum = Number(query?.limit);
  const q =
    typeof query?.q === 'string' && query.q.trim() ? query.q.trim() : undefined;
  const enabled = Number.isFinite(pageNum) || Number.isFinite(limitNum) || !!q;

  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
  const limit =
    Number.isFinite(limitNum) && limitNum > 0
      ? Math.min(Math.floor(limitNum), maxLimit)
      : defaultLimit;

  return { page, limit, offset: (page - 1) * limit, enabled, q };
}

export function paginated<T>(data: T[], total: number, p: Pagination) {
  return {
    data,
    total,
    page: p.page,
    limit: p.limit,
    totalPages: Math.max(1, Math.ceil(total / p.limit)),
    hasMore: p.page * p.limit < total,
  };
}
