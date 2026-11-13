import { Injectable, isDevMode, signal } from '@angular/core';
import { AuthenticatedUser } from './auth.models';

/**
 * Session boundary placeholder. It must be backed by Django's session endpoints
 * before real users can access the application.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userState = signal<AuthenticatedUser | null>({
    id: 'scaffold-user',
    displayName: 'Vista de preparación',
    role: 'administrador',
  });

  readonly user = this.userState.asReadonly();

  isAuthenticated(): boolean {
    return this.userState() !== null;
  }

  hasAnyRole(roles: readonly string[]): boolean {
    const user = this.userState();
    return user !== null && roles.includes(user.role);
  }

  /** Development-preview control only; backend permissions remain authoritative. */
  setDevelopmentRole(role: AuthenticatedUser['role'] | 'publico'): void {
    if (!isDevMode()) {
      return;
    }

    if (role === 'publico') {
      this.userState.set(null);
      return;
    }

    this.userState.update((user) => ({
      id: user?.id ?? 'scaffold-user',
      displayName: user?.displayName ?? 'Vista de preparación',
      role,
    }));
  }

  // TODO(auth): replace with CSRF-aware calls to /api/v1/auth/.
  clearLocalSession(): void {
    this.userState.set(null);
  }
}
