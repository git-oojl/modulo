import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
  busqueda = '';
  selectedStatus = 'todos'; selectedPurpose = 'todos'; selectedAgent = 'todos';
  citas: ReturnType<AppointmentsPageComponent['toRow']>[] = [];
  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: ({ results }) => this.citas = results.map((item) => this.toRow(item)) }); }

  limpiarFiltros() {
    this.busqueda = '';
    this.selectedStatus = 'todos'; this.selectedPurpose = 'todos'; this.selectedAgent = 'todos';
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
    void this.router.navigate(['/app/citas/nueva']);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abrirModalEditar(cita: any) {
    void this.router.navigate(['/app/citas', cita.id, 'editar']);
  }

  get filteredCitas() {
    const query = this.busqueda.trim().toLowerCase();
    return this.citas.filter((item) => (!query || [item.contacto, item.propiedad, item.agente].join(' ').toLowerCase().includes(query)) && (this.selectedStatus === 'todos' || item.status === this.selectedStatus) && (this.selectedPurpose === 'todos' || item.proposito === this.selectedPurpose) && (this.selectedAgent === 'todos' || item.advisorId === this.selectedAgent));
  }

  eliminarCita(id: string) {
    this.api.cancel(id).subscribe({ next: () => this.load() });
  }

  private toRow(item: AppointmentDto) {
    const date = new Date(item.starts_at);
    return { id: item.id, fecha: item.starts_at.slice(0, 16), fechaDisplay: date.toLocaleString('es-MX'), contacto: item.contact_detail?.name ?? item.contact, propiedad: item.property_detail?.title ?? '', proposito: item.purpose, status: item.status, agente: item.advisor.display_name, advisorId: item.advisor.id };
  }
}
