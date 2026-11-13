import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { FeatureFlagsService } from '../config/feature-flags.service';

export const catalogueEnabledGuard: CanMatchFn = () =>
  inject(FeatureFlagsService).publicCatalogueEnabled() || inject(Router).createUrlTree(['/login']);
