import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AuthService } from './core/auth/auth.service';
import { agentsRoutes } from './features/agents/agents.routes';
import { appointmentsRoutes } from './features/appointments/appointments.routes';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { AccessRequestPageComponent } from './features/auth/pages/access-request-page/access-request-page.component';
import { PrivacyNoticePageComponent } from './features/auth/pages/privacy-notice-page/privacy-notice-page.component';
import { RequestConfirmationPageComponent } from './features/auth/pages/request-confirmation-page/request-confirmation-page.component';
import { catalogRoutes } from './features/catalog/catalog.routes';
import { closingsRoutes } from './features/closings/closings.routes';
import { contactsRoutes } from './features/contacts/contacts.routes';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { propertiesRoutes } from './features/properties/properties.routes';
import { settingsRoutes } from './features/settings/settings.routes';
import { ForbiddenPageComponent } from './features/system/pages/forbidden-page/forbidden-page.component';
import { NotFoundPageComponent } from './features/system/pages/not-found-page/not-found-page.component';
import { OfflinePageComponent } from './features/system/pages/offline-page/offline-page.component';
import { usersRoutes } from './features/users/users.routes';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

const rootRedirect = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.isAuthenticated() ? '/app/dashboard' : '/login']);
};

/**
 * Internal routes live below /app and are protected at the shell boundary.
 * The public catalogue is isolated so it can remain disabled without changing
 * employee-facing navigation.
 */
export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Iniciar sesión | Modulo' },
  {
    path: 'solicitar-acceso',
    component: AccessRequestPageComponent,
    title: 'Solicitar acceso | Modulo',
  },
  {
    path: 'aviso-de-privacidad',
    component: PrivacyNoticePageComponent,
    title: 'Aviso de privacidad | Modulo',
  },
  {
    path: 'solicitud-enviada',
    component: RequestConfirmationPageComponent,
    title: 'Solicitud enviada | Modulo',
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
    children: [
      ...dashboardRoutes,
      ...contactsRoutes,
      ...propertiesRoutes,
      ...appointmentsRoutes,
      ...closingsRoutes,
      ...agentsRoutes,
      ...usersRoutes,
      ...settingsRoutes,
      { path: 'sin-conexion', component: OfflinePageComponent, title: 'Sin conexión | Modulo' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '403', component: ForbiddenPageComponent, title: 'Sin acceso | Modulo' },
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'app/dashboard' },
  { path: 'contactos', pathMatch: 'full', redirectTo: 'app/contactos' },
  { path: 'propiedades', pathMatch: 'full', redirectTo: 'app/propiedades' },
  { path: 'citas', pathMatch: 'full', redirectTo: 'app/citas' },
  { path: '', pathMatch: 'full', canMatch: [rootRedirect], redirectTo: 'login' },
  ...catalogRoutes,
  { path: '**', component: NotFoundPageComponent, title: 'No encontrada | Modulo' },
];
