import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';

export const settingsRoutes: Routes = [
  {
    path: 'configuracion',
    component: SettingsPageComponent,
    canActivate: [roleGuard],
    runGuardsAndResolvers: 'always',
    data: { roles: ['administrador'] },
  },
];
