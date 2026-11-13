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
  readonly isOpen = signal(false);
  readonly selectedViewId = signal(devViews[0].id);
  readonly views = devViews;
  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'asesor', label: 'Asesor' },
    { value: 'gerencia', label: 'Gerencia' },
    { value: 'administrador', label: 'Administrador' },
  ];
  readonly selectedView = computed<DevView>(
    () => devViews.find((view) => view.id === this.selectedViewId()) ?? devViews[0],
  );
  readonly viewIsAllowed = computed(() => {
    const allowedRoles = this.selectedView().roles;
    return !allowedRoles || allowedRoles.includes(this.auth.user()?.role ?? 'asesor');
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
    void this.router.navigateByUrl(view.path);
  }

  selectRole(role: string): void {
    this.auth.setDevelopmentRole(role as UserRole);
  }
}
