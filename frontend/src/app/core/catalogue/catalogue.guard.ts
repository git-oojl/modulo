import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { appFeatures } from '../config/app-features.config';

export const catalogueEnabledGuard: CanMatchFn = () =>
  appFeatures.publicCatalogueEnabled || inject(Router).createUrlTree(['/login']);
