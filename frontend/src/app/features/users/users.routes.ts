import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { UserListPageComponent } from './pages/user-list-page/user-list-page.component';

export const usersRoutes: Routes = [
  {
    path: 'usuarios',
    component: UserListPageComponent,
    canActivate: [roleGuard],
    runGuardsAndResolvers: 'always',
    data: { roles: ['administrador'] },
  },
];
