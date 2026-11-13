import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UserRole } from './auth.models';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const roles = (route.data['roles'] ?? []) as UserRole[];
  return inject(AuthService).hasAnyRole(roles) || inject(Router).createUrlTree(['/403']);
};
