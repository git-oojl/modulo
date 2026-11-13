export type UserRole = 'asesor' | 'gerencia' | 'administrador';

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  role: UserRole;
}
