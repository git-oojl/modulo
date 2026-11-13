import { Injectable, isDevMode, signal } from '@angular/core';
import { readDevelopmentPreviewState } from '../auth/development-preview.storage';
import { appFeatures } from './app-features.config';

/** Runtime flags are only mutable from the development switcher. */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  readonly publicCatalogueEnabled = signal<boolean>(
    appFeatures.publicCatalogueEnabled || readDevelopmentPreviewState().mode === 'preview',
  );

  setDevelopmentCatalogueEnabled(enabled: boolean): void {
    if (isDevMode()) {
      this.publicCatalogueEnabled.set(appFeatures.publicCatalogueEnabled || enabled);
    }
  }
}
