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
  private pendingDevNavigation = 0;
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
      .subscribe((event) => {
        if (this.pendingDevNavigation === 0) {
          this.syncSelectedView(event.urlAfterRedirects);
        }
      });
    void this.backend.refresh();
  }

  setMode(mode: DevelopmentMode): void {
    if (mode === 'preview') {
      this.auth.enterPreview(this.auth.previewViewer());
      this.featureFlags.setDevelopmentCatalogueEnabled(true);
    } else {
      this.auth.leavePreview();
      this.featureFlags.setDevelopmentCatalogueEnabled(false);
    }

    this.navigateToSelectedView();
  }

  selectView(viewId: string): void {
    this.selectedViewId.set(viewId);
    this.navigateToSelectedView();
  }

  selectPreviewViewer(viewer: string): void {
    const selectedViewer = viewer as PreviewViewer;
    this.auth.setPreviewViewer(selectedViewer);
    this.navigateToSelectedView();
  }

  selectedView() {
    return devViews.find((view) => view.id === this.selectedViewId()) ?? devViews[0];
  }

  private navigateToSelectedView(): void {
    const navigationId = ++this.pendingDevNavigation;
    void this.router.navigateByUrl(this.selectedView().path).finally(() => {
      if (navigationId === this.pendingDevNavigation) {
        this.pendingDevNavigation = 0;
      }
    });
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
