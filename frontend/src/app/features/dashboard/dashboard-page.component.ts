import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  nombreUsuario = 'Ana';
  fechaActual = new Date();
  
  proximasCitas = [
    { dia: '15', mes: 'Oct', nombre: 'Juan Fernandez', propiedad: 'Roma Norte', hora: '11:00' },
    { dia: '16', mes: 'Oct', nombre: 'Jose Luis', propiedad: 'Casa en Polanco', hora: '14:00' }
  ];

  // Solo dejamos 2 para el resumen, o los recortamos en el HTML
  actividadReciente = [
    { icono: '📞', titulo: 'Llamar a María', tipo: 'Prospecto', fecha: '21 Oct 2026' },
    { icono: '📄', titulo: 'Enviar ficha', tipo: 'Cliente activo', fecha: '22 Dic 2026' }
  ];
}