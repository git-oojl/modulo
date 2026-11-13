import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { AgentDirectoryPageComponent } from './pages/agent-directory-page/agent-directory-page.component';

export const agentsRoutes: Routes = [
  {
    path: 'asesores',
    component: AgentDirectoryPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['gerencia', 'administrador'] },
  },
];
