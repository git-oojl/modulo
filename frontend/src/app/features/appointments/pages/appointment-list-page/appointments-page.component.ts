import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentsApiService, AppointmentDto } from '../../data-access/appointments-api.service';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss',
})
export class AppointmentsPageComponent {
  private readonly api = inject(AppointmentsApiService);
  busqueda = '';
  isModalOpen = false;
  isEditMode = false;

  // Objeto que almacena los datos de la cita en creación o edición
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentCita: any = {
    id: '',
    contacto: '',
    propiedad: '',
    agente: '',
    origen: 'guardia',
    fecha: '',
    proposito: 'Visita',
    observaciones: ''
  };

  citas = [
    {
      id: 'CIT-01',
      fecha: '2026-11-17T10:00',
      fechaDisplay: '17 Nov 2026, 10:00',
      contacto: 'Mya Flores Castañón',
      propiedad: 'RCR692950',
      proposito: 'Visita',
      status: 'Confirmada',
      agente: 'Karina Torres',
      origen: 'guardia',
      observaciones: 'Cliente muy interesado en la zona.'
    },
    {
      id: 'CIT-02',
      fecha: '2026-11-18T12:30',
      fechaDisplay: '18 Nov 2026, 12:30',
      contacto: 'Jennifer Estrada Avendaño',
      propiedad: 'CBR598555',
      proposito: 'Captación',
      status: 'Programada',
      agente: 'Paola Suarez',
      origen: 'sitio_web',
      observaciones: 'Revisar documentos del terreno.'
    },
    {
      id: 'CIT-03',
      fecha: '2026-11-19T16:00',
      fechaDisplay: '19 Nov 2026, 16:00',
      contacto: 'Carlos Mendez',
      propiedad: '',
      proposito: 'Cierre',
      status: 'Completada',
      agente: 'Wendy Guevara',
      origen: 'recomendacion',
      observaciones: 'Firma de contratos.'
    },
  ];
  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: ({ results }) => this.citas = results.map((item) => this.toRow(item)) }); }

  limpiarFiltros() {
    this.busqueda = '';
  }

  getCitaStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmada': return 'badge-success';
      case 'programada': return 'badge-info';
      case 'completada': return 'badge-completed';
      default: return 'badge-default';
    }
  }

  abrirModalNuevo() {
    this.isEditMode = false;
    this.currentCita = {
      id: 'CIT-0' + (this.citas.length + 1),
      contacto: '',
      propiedad: '',
      agente: '',
      origen: 'guardia',
      fecha: '',
      proposito: 'Visita',
      observaciones: ''
    };
    this.isModalOpen = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abrirModalEditar(cita: any) {
    this.isEditMode = true;
    // Clonamos la cita seleccionada para no mutar la tabla en tiempo real antes de guardar
    this.currentCita = { ...cita };
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  guardarCita() {
    if (this.isEditMode) {
      // Actualizar cita existente
      const index = this.citas.findIndex(c => c.id === this.currentCita.id);
      if (index !== -1) {
        this.currentCita.fechaDisplay = this.currentCita.fecha ? new Date(this.currentCita.fecha).toLocaleString() : this.currentCita.fechaDisplay;
        this.citas[index] = { ...this.currentCita };
      }
      console.log('Cita actualizada:', this.currentCita);
    } else {
      // Crear nueva cita
      this.currentCita.fechaDisplay = this.currentCita.fecha ? new Date(this.currentCita.fecha).toLocaleString() : 'Pendiente';
      this.currentCita.status = 'Programada';
      this.citas.push({ ...this.currentCita });
      console.log('Nueva cita creada:', this.currentCita);
    }
    this.isModalOpen = false;
  }

  eliminarCita(id: string) {
    this.api.cancel(id).subscribe({ next: () => this.load() });
  }

  private toRow(item: AppointmentDto) {
    const date = new Date(item.starts_at);
    return { id: item.id, fecha: item.starts_at.slice(0, 16), fechaDisplay: date.toLocaleString('es-MX'), contacto: item.contact_detail?.name ?? item.contact, propiedad: item.property_detail?.title ?? '', proposito: item.purpose, status: item.status, agente: item.advisor.display_name, origen: item.source ?? '', observaciones: item.notes };
  }
}
