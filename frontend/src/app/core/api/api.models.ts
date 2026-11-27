export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserReference {
  id: string;
  display_name: string;
  role: 'asesor' | 'gerencia' | 'administrador';
}

export interface ApiError {
  detail?: string;
  [field: string]: unknown;
}
