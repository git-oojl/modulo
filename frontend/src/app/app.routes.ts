import { Routes } from '@angular/router';
import { AppointmentsPageComponent } from './features/appointments/appointments-page.component';
import { ContactsPageComponent } from './features/contacts/contacts-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { PropertiesPageComponent } from './features/properties/properties-page.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'dashboard', component: DashboardPageComponent, title: 'Panel | Modulo' },
      { path: 'contactos', component: ContactsPageComponent, title: 'Contactos | Modulo' },
      { path: 'propiedades', component: PropertiesPageComponent, title: 'Propiedades | Modulo' },
      { path: 'citas', component: AppointmentsPageComponent, title: 'Citas | Modulo' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
