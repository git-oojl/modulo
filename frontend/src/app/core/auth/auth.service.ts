import { Injectable, computed, isDevMode, signal } from '@angular/core';
import { AuthenticatedUser, UserRole } from './auth.models';

export type DevelopmentMode = 'normal' | 'preview';
export type PreviewViewer = UserRole | 'publico';

/**
 * The application always consumes one effective session. In development, that
 * session can be the real Django-backed session (normal) or a temporary local
 * identity (preview). Production never enables preview mode.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly realUserState = signal<AuthenticatedUser | null>(null);
  private readonly previewViewerState = signal<PreviewViewer>('administrador');
  readonly developmentMode = signal<DevelopmentMode>('normal');
  readonly previewViewer = this.previewViewerState.asReadonly();
  readonly isPreviewMode = computed(() => this.developmentMode() === 'preview');
  readonly user = computed<AuthenticatedUser | null>(() => {
    if (!this.isPreviewMode()) {
      return this.realUserState();
    }

    const viewer = this.previewViewerState();
    return viewer === 'publico'
      ? null
      : {
          id: `preview-${viewer}`,
          displayName: `Preview ${viewer}`,
          role: viewer,
        };
  });

  isAuthenticated(): boolean {
    return this.user() !== null;
  }

  hasAnyRole(roles: readonly string[]): boolean {
    const user = this.user();
    return user !== null && roles.includes(user.role);
  }

  /** Called by the future CSRF-aware session endpoint after a real login. */
  setRealUser(user: AuthenticatedUser | null): void {
    this.realUserState.set(user);
  }

  enterPreview(viewer: PreviewViewer): void {
    if (!isDevMode()) {
      return;
    }

    this.previewViewerState.set(viewer);
    this.developmentMode.set('preview');
  }

  leavePreview(): void {
    if (isDevMode()) {
      this.developmentMode.set('normal');
    }
  }

  setPreviewViewer(viewer: PreviewViewer): void {
    if (isDevMode()) {
      this.previewViewerState.set(viewer);
    }
  }

  clearLocalSession(): void {
    this.realUserState.set(null);
    this.leavePreview();
  }
}
