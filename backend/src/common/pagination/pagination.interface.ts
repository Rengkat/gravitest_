export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationLinks {
  first: string;
  previous: string | null;
  current: string;
  next: string | null;
  last: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}
