export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedOrdersResponse<T> {
  orders: T[];
  total: number;
  page: number;
  totalPages: number;
}
