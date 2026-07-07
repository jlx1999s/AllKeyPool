export interface PageQuery {
  limit?: number;
  cursor?: string;
}

export interface PageInfo {
  limit: number;
  nextCursor?: string;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  page: PageInfo;
}

export function offsetFromCursor(cursor: string | undefined): number {
  if (cursor === undefined) return 0;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const offset = (parsed as Record<string, unknown>).offset;
      if (typeof offset === "number" && Number.isInteger(offset) && offset >= 0) {
        return offset;
      }
    }
  } catch {
    return 0;
  }

  return 0;
}

export function cursorFromOffset(offset: number): string {
  return Buffer.from(JSON.stringify({ offset })).toString("base64url");
}

export function pageFromItems<T>(items: T[], limit: number, offset: number): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const page: PageInfo = {
    limit,
    hasMore
  };

  if (hasMore) {
    page.nextCursor = cursorFromOffset(offset + limit);
  }

  return {
    items: pageItems,
    page
  };
}
