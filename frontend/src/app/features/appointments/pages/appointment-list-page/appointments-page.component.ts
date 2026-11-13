import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss',
})
export class AppointmentsPageComponent {
  busqueda = '';

  // Datos simulados (Mock) basados en tu imagen
  citas = [
    {
      id: '01',
      nombre: 'Mya Flores Castañón',
      tipo: 'Residencial',
      precio: '$1,500 USD',
      agente: 'Karina Torres',
    },
    {
      id: '02',
      nombre: 'Jennifer Estrada Avendaño',
      tipo: 'Terreno',
      precio: '$500k MXN',
      agente: 'Paola Suarez',
    },
    {
      id: '03',
      nombre: 'Renta Depto',
      tipo: 'Departamento',
      precio: '$2,200 MXN',
      agente: 'Wendy Guevara',
    },
    // Agrego un par más para que se vea la tabla
    {
      id: '04',
      nombre: 'Casa en Polanco',
      tipo: 'Casa',
      precio: '$8,000,000 MXN',
      agente: 'Ana Barajas',
    },
    {
      id: '05',
      nombre: 'Oficina Roma Norte',
      tipo: 'Comercial',
      precio: '$25,000 MXN',
      agente: 'Karina Torres',
    },
  ];

  // Métodos de acción (Para el futuro backend)
  editarCita(id: string) {
    console.log('Editando cita:', id);
  }

  eliminarCita(id: string) {
    console.log('Eliminando cita:', id);
  }

  crearCita() {
    console.log('Crear nueva cita');
  }
}
