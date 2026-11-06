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
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contacto', path: '/contactos' }, // Singular según tu Figma
    { label: 'Propiedades', path: '/propiedades' },
    { label: 'Citas', path: '/citas' },
    { label: 'Cierres', path: '/cierres' },
    { label: 'Usuarios', path: '/usuarios' },
    { label: 'Configuracion', path: '/configuracion' },
  ];

  logout() {
    // Lógica de logout (limpiar tokens, etc.)
    this.router.navigate(['/login']);
  }
}