import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, DevelopmentMode, PreviewViewer } from '../auth/auth.service';
import { FeatureFlagsService } from '../config/feature-flags.service';
import { BackendHealthService } from './backend-health.service';
import { devViews } from './dev-view.registry';

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
  readonly views = devViews;
  readonly viewers: { value: PreviewViewer; label: string }[] = [
    { value: 'asesor', label: 'Asesor' },
    { value: 'gerencia', label: 'Gerencia' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'publico', label: 'Público (sin sesión)' },
  ];

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

  setMode(mode: DevelopmentMode): void {
    if (mode === 'preview') {
      this.auth.enterPreview(this.auth.previewViewer());
      if (this.auth.previewViewer() === 'publico') {
        this.featureFlags.setDevelopmentCatalogueEnabled(true);
      }
    } else {
      this.auth.leavePreview();
      this.featureFlags.setDevelopmentCatalogueEnabled(false);
    }

    void this.router.navigateByUrl(this.router.url);
  }

  selectView(viewId: string): void {
    this.selectedViewId.set(viewId);
    const view = devViews.find((candidate) => candidate.id === viewId) ?? devViews[0];
    if (this.auth.isPreviewMode() && view.publicPreview) {
      this.featureFlags.setDevelopmentCatalogueEnabled(true);
      this.auth.setPreviewViewer('publico');
    }
    void this.router.navigateByUrl(view.path);
  }

  selectPreviewViewer(viewer: string): void {
    const selectedViewer = viewer as PreviewViewer;
    this.auth.setPreviewViewer(selectedViewer);
    if (selectedViewer === 'publico') {
      this.featureFlags.setDevelopmentCatalogueEnabled(true);
      this.selectedViewId.set('catalogue');
      void this.router.navigateByUrl('/');
    }
  }

  selectedView() {
    return devViews.find((view) => view.id === this.selectedViewId()) ?? devViews[0];
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
