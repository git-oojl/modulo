import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthenticatedUser } from './auth.models';
import {
  DevelopmentMode,
  PreviewViewer,
  readDevelopmentPreviewState,
  writeDevelopmentPreviewState,
} from './development-preview.storage';

export type { DevelopmentMode, PreviewViewer } from './development-preview.storage';

/**
 * The application always consumes one effective session. In development, that
 * session can be the real Django-backed session (normal) or a temporary local
 * identity (preview). Production never enables preview mode.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly savedPreviewState = readDevelopmentPreviewState();
  private readonly realUserState = signal<AuthenticatedUser | null>(null);
  private readonly previewViewerState = signal<PreviewViewer>(this.savedPreviewState.viewer);
  readonly developmentMode = signal<DevelopmentMode>(this.savedPreviewState.mode);
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
    this.savePreviewState();
  }

  leavePreview(): void {
    if (isDevMode()) {
      this.developmentMode.set('normal');
      this.savePreviewState();
    }
  }

  setPreviewViewer(viewer: PreviewViewer): void {
    if (isDevMode()) {
      this.previewViewerState.set(viewer);
      this.savePreviewState();
    }
  }

  clearLocalSession(): void {
    this.realUserState.set(null);
    this.leavePreview();
  }

  login(username: string, password: string): Observable<AuthenticatedUser> {
    return this.http.get('/api/v1/auth/csrf/').pipe(
      switchMap(() =>
        this.http.post<AuthenticatedUser>('/api/v1/auth/login/', { username, password }),
      ),
      tap((user) => this.setRealUser(user)),
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/api/v1/auth/logout/', {})
      .pipe(tap(() => this.clearLocalSession()));
  }

  restoreSession(): Observable<void> {
    if (this.isPreviewMode()) {
      return of(void 0);
    }
    return this.http.get<AuthenticatedUser>('/api/v1/auth/me/').pipe(
      tap((user) => this.setRealUser(user)),
      map(() => void 0),
      catchError(() => {
        this.realUserState.set(null);
        return of(void 0);
      }),
    );
  }

  private savePreviewState(): void {
    writeDevelopmentPreviewState({
      mode: this.developmentMode(),
      viewer: this.previewViewerState(),
    });
  }
}
