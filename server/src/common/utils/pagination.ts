export interface Pagination {
  page: number;
  limit: number;
  offset: number;
  enabled: boolean;
  q?: string;
  /** Inclusive lower bound (YYYY-MM-DD), when supplied by the caller. */
  from?: string;
  /** Inclusive upper bound (YYYY-MM-DD), when supplied by the caller. */
  to?: string;
}

/** Accepts YYYY-MM-DD (optionally with a time) and rejects anything unparseable. */
function parseDateParam(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Date-only or ISO datetime; guard against garbage reaching the SQL layer.
  if (!/^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?)?$/.test(trimmed)) return undefined;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? undefined : trimmed;
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

  const from = parseDateParam(query?.from);
  const to = parseDateParam(query?.to);

  const enabled =
    Number.isFinite(pageNum) ||
    Number.isFinite(limitNum) ||
    !!q ||
    !!from ||
    !!to;

  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
  const limit =
    Number.isFinite(limitNum) && limitNum > 0
      ? Math.min(Math.floor(limitNum), maxLimit)
      : defaultLimit;

  return { page, limit, offset: (page - 1) * limit, enabled, q, from, to };
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
