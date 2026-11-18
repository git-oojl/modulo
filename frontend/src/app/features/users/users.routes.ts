import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { AccessRequestListPageComponent } from './pages/access-request-list-page/access-request-list-page.component';

export const usersRoutes: Routes = [
  {
    path: 'usuarios',
    component: AccessRequestListPageComponent,
    canActivate: [roleGuard],
    runGuardsAndResolvers: 'always',
    data: { roles: ['administrador'] },
  },
];
