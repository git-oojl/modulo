import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
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
  private readonly destroyRef = inject(DestroyRef);
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
    if (view.publicPreview && viewer !== 'publico') {
      return 'Vista pública: se abre como visitante sin sesión.';
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
    this.syncSelectedView(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.syncSelectedView(event.urlAfterRedirects));
    void this.backend.refresh();
  }

  selectView(viewId: string): void {
    this.selectedViewId.set(viewId);
    const view = this.selectedView();
    if (view.publicPreview) {
      this.featureFlags.setDevelopmentCatalogueEnabled(true);
      this.selectRole('publico');
    }
    void this.router.navigateByUrl(view.path);
  }

  selectRole(role: string): void {
    const viewer = role as UserRole | 'publico';
    this.selectedViewer.set(viewer);
    this.auth.setDevelopmentRole(viewer);
  }

  private syncSelectedView(url: string): void {
    const currentPath = url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
    const currentView = devViews
      .filter((view) => this.viewMatchesPath(view.path, currentPath))
      .sort((left, right) => right.path.length - left.path.length)[0];

    if (currentView) {
      this.selectedViewId.set(currentView.id);
    }
  }

  private viewMatchesPath(viewPath: string, currentPath: string): boolean {
    if (viewPath === '/') {
      return currentPath === '/';
    }

    const viewSegments = viewPath.split('/').filter(Boolean);
    const currentSegments = currentPath.split('/').filter(Boolean);
    return (
      viewSegments.length === currentSegments.length &&
      viewSegments.every(
        (segment, index) => segment.startsWith('demo-') || segment === currentSegments[index],
      )
    );
  }
}
