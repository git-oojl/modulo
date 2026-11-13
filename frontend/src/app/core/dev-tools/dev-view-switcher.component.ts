import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/auth.models';
import { FeatureFlagsService } from '../config/feature-flags.service';
import { BackendHealthService } from './backend-health.service';
import { DevView, devViews } from './dev-view.registry';

@Component({
  selector: 'app-dev-view-switcher',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dev-view-switcher.component.html',
  styleUrl: './dev-view-switcher.component.scss',
})
export class DevViewSwitcherComponent implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly backend = inject(BackendHealthService);
  readonly featureFlags = inject(FeatureFlagsService);
  readonly isOpen = signal(false);
  readonly selectedViewId = signal(devViews[0].id);
  readonly selectedViewer = signal<UserRole | 'publico'>(this.auth.user()?.role ?? 'administrador');
  readonly views = devViews;
  readonly roles: { value: UserRole | 'publico'; label: string }[] = [
    { value: 'asesor', label: 'Asesor' },
    { value: 'gerencia', label: 'Gerencia' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'publico', label: 'Público (sin sesión)' },
  ];
  readonly selectedView = computed<DevView>(
    () => devViews.find((view) => view.id === this.selectedViewId()) ?? devViews[0],
  );
  readonly viewIsAllowed = computed(() => {
    const view = this.selectedView();
    const viewer = this.selectedViewer();
    if (view.publicPreview) {
      return viewer === 'publico' && this.featureFlags.publicCatalogueEnabled();
    }

    return viewer !== 'publico' && (!view.roles || view.roles.includes(viewer));
  });
  readonly accessMessage = computed(() => {
    const view = this.selectedView();
    const viewer = this.selectedViewer();
    if (view.publicPreview && !this.featureFlags.publicCatalogueEnabled()) {
      return 'El catálogo público está desactivado; actívalo abajo para hacer este preview.';
    }
    if (view.publicPreview && viewer !== 'publico') {
      return 'Vista pública: selecciona Público (sin sesión) para probarla como visitante.';
    }
    if (!view.publicPreview && viewer === 'publico') {
      return 'Sin sesión: una ruta interna redirige al inicio de sesión.';
    }
    if (!this.viewIsAllowed()) {
      return 'Este rol no tiene acceso: la guarda de rol mostrará 403.';
    }
    return 'El perfil seleccionado puede abrir esta ruta.';
  });

  ngOnInit(): void {
    const currentView = devViews.find((view) => this.router.url.startsWith(view.path));
    if (currentView) {
      this.selectedViewId.set(currentView.id);
    }
    void this.backend.refresh();
  }

  selectView(viewId: string): void {
    this.selectedViewId.set(viewId);
    const view = this.selectedView();
    if (view.publicPreview) {
      this.featureFlags.setDevelopmentCatalogueEnabled(true);
    }
    void this.router.navigateByUrl(view.path);
  }

  selectRole(role: string): void {
    const viewer = role as UserRole | 'publico';
    this.selectedViewer.set(viewer);
    this.auth.setDevelopmentRole(viewer);
  }
}
