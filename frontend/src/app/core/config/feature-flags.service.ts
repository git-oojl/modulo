import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { readDevelopmentPreviewState } from '../auth/development-preview.storage';
import { appFeatures } from './app-features.config';

/** Runtime flags combine the public backend state with development preview. */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly http = inject(HttpClient);
  private readonly backendCatalogueEnabled = signal<boolean>(appFeatures.publicCatalogueEnabled);
  private readonly developmentCatalogueEnabled = signal<boolean>(
    readDevelopmentPreviewState().mode === 'preview',
  );
  readonly publicCatalogueEnabled = computed(
    () => this.backendCatalogueEnabled() || (isDevMode() && this.developmentCatalogueEnabled()),
  );

  refreshPublicCatalogueStatus(): Observable<boolean> {
    return this.http.get<{ enabled: boolean }>('/api/v1/public/catalogue-status/').pipe(
      map((response) => response.enabled),
      tap((enabled) => this.backendCatalogueEnabled.set(enabled)),
      catchError(() => of(this.publicCatalogueEnabled())),
    );
  }

  setBackendCatalogueEnabled(enabled: boolean): void {
    this.backendCatalogueEnabled.set(enabled);
  }

  setDevelopmentCatalogueEnabled(enabled: boolean): void {
    if (isDevMode()) {
      this.developmentCatalogueEnabled.set(enabled);
    }
  }
}
