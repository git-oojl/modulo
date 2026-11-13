import { Routes } from '@angular/router';
import { catalogueEnabledGuard } from '../../core/catalogue/catalogue.guard';
import { PublicShellComponent } from '../../layout/public-shell/public-shell.component';
import { CataloguePageComponent } from './pages/catalogue-page/catalogue-page.component';
import { PrivacyNoticePageComponent } from './pages/privacy-notice-page/privacy-notice-page.component';
import { PublicPropertyDetailPageComponent } from './pages/public-property-detail-page/public-property-detail-page.component';

export const catalogRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PublicShellComponent,
    canMatch: [catalogueEnabledGuard],
    children: [{ path: '', component: CataloguePageComponent }],
  },
  {
    path: 'propiedades/:id',
    component: PublicShellComponent,
    canMatch: [catalogueEnabledGuard],
    children: [{ path: '', component: PublicPropertyDetailPageComponent }],
  },
  {
    path: 'aviso-de-privacidad',
    component: PublicShellComponent,
    canMatch: [catalogueEnabledGuard],
    children: [{ path: '', component: PrivacyNoticePageComponent }],
  },
];
