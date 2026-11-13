import { Routes } from '@angular/router';
import { AppointmentsPageComponent } from './pages/appointment-list-page/appointments-page.component';
import { AppointmentCreatePageComponent } from './pages/appointment-create-page/appointment-create-page.component';
import { AppointmentDetailPageComponent } from './pages/appointment-detail-page/appointment-detail-page.component';
import { AppointmentEditPageComponent } from './pages/appointment-edit-page/appointment-edit-page.component';

export const appointmentsRoutes: Routes = [
  { path: 'citas', component: AppointmentsPageComponent },
  { path: 'citas/nueva', component: AppointmentCreatePageComponent },
  { path: 'citas/:id', component: AppointmentDetailPageComponent },
  { path: 'citas/:id/editar', component: AppointmentEditPageComponent },
];
