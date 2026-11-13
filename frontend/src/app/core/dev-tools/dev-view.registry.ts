import { UserRole } from '../auth/auth.models';

export interface DevView {
  id: string;
  group: string;
  label: string;
  path: string;
  filePath: string;
  roles?: UserRole[];
  publicPreview?: boolean;
}

const allRoles: UserRole[] = ['asesor', 'gerencia', 'administrador'];

/**
 * Development-only navigation catalogue. Keep this in sync when adding a page
 * so teammates can discover its route and canonical source file immediately.
 */
export const devViews: DevView[] = [
  {
    id: 'login',
    group: 'Acceso',
    label: 'Iniciar sesión',
    path: '/login',
    filePath: 'frontend/src/app/features/auth/pages/login-page/login-page.component.ts',
    publicPreview: true,
  },
  {
    id: 'catalogue',
    group: 'Catálogo opcional',
    label: 'Catálogo público',
    path: '/',
    filePath: 'frontend/src/app/features/catalog/pages/catalogue-page/catalogue-page.component.ts',
    publicPreview: true,
  },
  {
    id: 'public-property',
    group: 'Catálogo opcional',
    label: 'Ficha pública de propiedad',
    path: '/propiedades/demo-propiedad',
    filePath:
      'frontend/src/app/features/catalog/pages/public-property-detail-page/public-property-detail-page.component.ts',
    publicPreview: true,
  },
  {
    id: 'privacy-notice',
    group: 'Catálogo opcional',
    label: 'Aviso de privacidad',
    path: '/aviso-de-privacidad',
    filePath:
      'frontend/src/app/features/catalog/pages/privacy-notice-page/privacy-notice-page.component.ts',
    publicPreview: true,
  },
  {
    id: 'dashboard',
    group: 'Operación',
    label: 'Dashboard',
    path: '/app/dashboard',
    filePath:
      'frontend/src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'contacts',
    group: 'Operación',
    label: 'Contactos',
    path: '/app/contactos',
    filePath:
      'frontend/src/app/features/contacts/pages/contact-list-page/contacts-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'contact-create',
    group: 'Operación',
    label: 'Nuevo contacto',
    path: '/app/contactos/nuevo',
    filePath:
      'frontend/src/app/features/contacts/pages/contact-create-page/contact-create-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'contact-detail',
    group: 'Operación',
    label: 'Detalle de contacto',
    path: '/app/contactos/demo-contacto',
    filePath:
      'frontend/src/app/features/contacts/pages/contact-detail-page/contact-detail-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'contact-edit',
    group: 'Operación',
    label: 'Editar contacto',
    path: '/app/contactos/demo-contacto/editar',
    filePath:
      'frontend/src/app/features/contacts/pages/contact-edit-page/contact-edit-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'properties',
    group: 'Inventario',
    label: 'Propiedades',
    path: '/app/propiedades',
    filePath:
      'frontend/src/app/features/properties/pages/property-list-page/properties-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'property-create',
    group: 'Inventario',
    label: 'Nueva propiedad',
    path: '/app/propiedades/nueva',
    filePath:
      'frontend/src/app/features/properties/pages/property-create-page/property-create-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'property-detail',
    group: 'Inventario',
    label: 'Detalle de propiedad',
    path: '/app/propiedades/demo-propiedad',
    filePath:
      'frontend/src/app/features/properties/pages/property-detail-page/property-detail-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'property-edit',
    group: 'Inventario',
    label: 'Editar propiedad',
    path: '/app/propiedades/demo-propiedad/editar',
    filePath:
      'frontend/src/app/features/properties/pages/property-edit-page/property-edit-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'appointments',
    group: 'Agenda',
    label: 'Citas',
    path: '/app/citas',
    filePath:
      'frontend/src/app/features/appointments/pages/appointment-list-page/appointments-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'appointment-create',
    group: 'Agenda',
    label: 'Nueva cita',
    path: '/app/citas/nueva',
    filePath:
      'frontend/src/app/features/appointments/pages/appointment-create-page/appointment-create-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'appointment-detail',
    group: 'Agenda',
    label: 'Detalle de cita',
    path: '/app/citas/demo-cita',
    filePath:
      'frontend/src/app/features/appointments/pages/appointment-detail-page/appointment-detail-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'appointment-edit',
    group: 'Agenda',
    label: 'Editar cita',
    path: '/app/citas/demo-cita/editar',
    filePath:
      'frontend/src/app/features/appointments/pages/appointment-edit-page/appointment-edit-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'closings',
    group: 'Administración operativa',
    label: 'Cierres',
    path: '/app/cierres',
    filePath:
      'frontend/src/app/features/closings/pages/closing-list-page/closing-list-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'closing-create',
    group: 'Administración operativa',
    label: 'Registrar cierre',
    path: '/app/cierres/nuevo',
    filePath:
      'frontend/src/app/features/closings/pages/closing-create-page/closing-create-page.component.ts',
    roles: ['gerencia', 'administrador'],
  },
  {
    id: 'closing-detail',
    group: 'Administración operativa',
    label: 'Detalle de cierre',
    path: '/app/cierres/demo-cierre',
    filePath:
      'frontend/src/app/features/closings/pages/closing-detail-page/closing-detail-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'closing-edit',
    group: 'Administración operativa',
    label: 'Editar cierre',
    path: '/app/cierres/demo-cierre/editar',
    filePath:
      'frontend/src/app/features/closings/pages/closing-edit-page/closing-edit-page.component.ts',
    roles: ['gerencia', 'administrador'],
  },
  {
    id: 'agents',
    group: 'Administración operativa',
    label: 'Asesores',
    path: '/app/asesores',
    filePath:
      'frontend/src/app/features/agents/pages/agent-directory-page/agent-directory-page.component.ts',
    roles: ['gerencia', 'administrador'],
  },
  {
    id: 'users',
    group: 'Administración',
    label: 'Usuarios',
    path: '/app/usuarios',
    filePath: 'frontend/src/app/features/users/pages/user-list-page/user-list-page.component.ts',
    roles: ['administrador'],
  },
  {
    id: 'settings',
    group: 'Administración',
    label: 'Configuración',
    path: '/app/configuracion',
    filePath: 'frontend/src/app/features/settings/pages/settings-page/settings-page.component.ts',
    roles: ['administrador'],
  },
  {
    id: 'offline',
    group: 'Sistema',
    label: 'Sin conexión',
    path: '/app/sin-conexion',
    filePath: 'frontend/src/app/features/system/pages/offline-page/offline-page.component.ts',
    roles: allRoles,
  },
  {
    id: 'forbidden',
    group: 'Sistema',
    label: 'Sin acceso',
    path: '/403',
    filePath: 'frontend/src/app/features/system/pages/forbidden-page/forbidden-page.component.ts',
  },
  {
    id: 'not-found',
    group: 'Sistema',
    label: 'No encontrada',
    path: '/ruta-inexistente',
    filePath: 'frontend/src/app/features/system/pages/not-found-page/not-found-page.component.ts',
  },
];
