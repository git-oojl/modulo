import { Injectable, isDevMode, signal } from '@angular/core';
import { appFeatures } from './app-features.config';

/** Runtime flags are only mutable from the development switcher. */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  readonly publicCatalogueEnabled = signal<boolean>(appFeatures.publicCatalogueEnabled);

  setDevelopmentCatalogueEnabled(enabled: boolean): void {
    if (isDevMode()) {
      this.publicCatalogueEnabled.set(enabled);
    }
  }
}
