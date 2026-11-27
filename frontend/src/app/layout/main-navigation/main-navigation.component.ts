// main-navigation.component.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  templateUrl: './main-navigation.component.html',
  styleUrl: './main-navigation.component.scss',
})
export class MainNavigationComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  private readonly allMenuItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
    { label: 'Contactos', path: '/app/contactos', icon: 'people' },
    { label: 'Propiedades', path: '/app/propiedades', icon: 'home_work' },
    { label: 'Citas', path: '/app/citas', icon: 'calendar_today' },
    { label: 'Cierres', path: '/app/cierres', icon: 'handshake' },
    { label: 'Asesores', path: '/app/asesores', icon: 'groups' },
    { label: 'Usuarios', path: '/app/usuarios', icon: 'manage_accounts' },
    { label: 'Configuración', path: '/app/configuracion', icon: 'settings' },
  ];

  get menuItems() {
    const role = this.auth.user()?.role;
    return this.allMenuItems.filter((item) => {
      if (['Asesores'].includes(item.label)) return role === 'gerencia' || role === 'administrador';
      if (['Usuarios', 'Configuración'].includes(item.label)) return role === 'administrador';
      return true;
    });
  }

  get displayName(): string { return this.auth.user()?.displayName ?? 'Usuario'; }
  get roleLabel(): string { return this.auth.user()?.role ?? 'Sin sesión'; }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => {
        this.auth.clearLocalSession();
        void this.router.navigate(['/login']);
      },
    });
  }
}
