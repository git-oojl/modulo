import { Routes } from '@angular/router';
import { ContactsPageComponent } from './pages/contact-list-page/contacts-page.component';
import { ContactCreatePageComponent } from './pages/contact-create-page/contact-create-page.component';
import { ContactDetailPageComponent } from './pages/contact-detail-page/contact-detail-page.component';
import { ContactEditPageComponent } from './pages/contact-edit-page/contact-edit-page.component';

export const contactsRoutes: Routes = [
  { path: 'contactos', component: ContactsPageComponent },
  { path: 'contactos/nuevo', component: ContactCreatePageComponent },
  { path: 'contactos/:id', component: ContactDetailPageComponent },
  { path: 'contactos/:id/editar', component: ContactEditPageComponent },
];
