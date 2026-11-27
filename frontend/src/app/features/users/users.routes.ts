import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { AccessRequestListPageComponent } from './pages/access-request-list-page/access-request-list-page.component';
import { UserListPageComponent } from './pages/user-list-page/user-list-page.component';

export const usersRoutes: Routes = [
  {
    path: 'usuarios',
    component: UserListPageComponent,
    canActivate: [roleGuard],
    runGuardsAndResolvers: 'always',
    data: { roles: ['administrador'] },
  },
  {
    path: 'usuarios/solicitudes',
    component: AccessRequestListPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
  },
];
