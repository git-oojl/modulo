// main-navigation.component.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  templateUrl: './main-navigation.component.html',
  styleUrl: './main-navigation.component.scss',
})
export class MainNavigationComponent {
  private router = inject(Router);

  menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Contactos', path: '/contactos', icon: 'people' },
    { label: 'Propiedades', path: '/propiedades', icon: 'home_work' },
    { label: 'Citas', path: '/citas', icon: 'calendar_today' },
    { label: 'Cierres', path: '/cierres', icon: 'handshake' },
    { label: 'Usuarios', path: '/usuarios', icon: 'manage_accounts' },
    { label: 'Configuración', path: '/configuracion', icon: 'settings' },
  ];

  logout() {
    this.router.navigate(['/login']);
  }
}