import { Routes } from '@angular/router';
import { PropertiesPageComponent } from './pages/property-list-page/properties-page.component';
import { PropertyCreatePageComponent } from './pages/property-create-page/property-create-page.component';
import { PropertyDetailPageComponent } from './pages/property-detail-page/property-detail-page.component';
import { PropertyEditPageComponent } from './pages/property-edit-page/property-edit-page.component';

export const propertiesRoutes: Routes = [
  { path: 'propiedades', component: PropertiesPageComponent },
  { path: 'propiedades/nueva', component: PropertyCreatePageComponent },
  { path: 'propiedades/:id', component: PropertyDetailPageComponent },
  { path: 'propiedades/:id/editar', component: PropertyEditPageComponent },
];
