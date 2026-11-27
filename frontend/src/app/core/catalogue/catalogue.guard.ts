import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { FeatureFlagsService } from '../config/feature-flags.service';

export const catalogueEnabledGuard: CanMatchFn = () => {
  const featureFlags = inject(FeatureFlagsService);
  const router = inject(Router);
  return featureFlags
    .refreshPublicCatalogueStatus()
    .pipe(map((enabled) => enabled || router.createUrlTree(['/login'])));
};
