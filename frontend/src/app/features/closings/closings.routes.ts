import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { ClosingCreatePageComponent } from './pages/closing-create-page/closing-create-page.component';
import { ClosingDetailPageComponent } from './pages/closing-detail-page/closing-detail-page.component';
import { ClosingEditPageComponent } from './pages/closing-edit-page/closing-edit-page.component';
import { ClosingListPageComponent } from './pages/closing-list-page/closing-list-page.component';

export const closingsRoutes: Routes = [
  { path: 'cierres', component: ClosingListPageComponent },
  {
    path: 'cierres/nuevo',
    component: ClosingCreatePageComponent,
    canActivate: [roleGuard],
    data: { roles: ['gerencia', 'administrador'] },
  },
  { path: 'cierres/:id', component: ClosingDetailPageComponent },
  {
    path: 'cierres/:id/editar',
    component: ClosingEditPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['gerencia', 'administrador'] },
  },
];
