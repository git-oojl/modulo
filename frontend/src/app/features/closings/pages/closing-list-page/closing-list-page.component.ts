import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ClosingDto, ClosingsApiService } from '../../data-access/closings-api.service';

@Component({
  selector: 'app-closing-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './closing-list-page.component.html',
  styleUrl: './closing-list-page.component.scss',
})
export class ClosingListPageComponent {
  private readonly api = inject(ClosingsApiService);
  private readonly router = inject(Router);
  readonly page = {
    eyebrow: 'Operaciones',
    title: 'Cierres',
    description: 'Ventas y rentas concretadas, con filtros y comisión estimada.',
  };

  busqueda = '';
  selectedOperation = 'todas'; selectedStatus = 'todos'; selectedCommissionStatus = 'todos';
  cierres: ReturnType<ClosingListPageComponent['toRow']>[] = [];
  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: ({ results }) => this.cierres = results.map((item) => this.toRow(item)) }); }

  limpiarFiltros() {
    this.busqueda = '';
    this.selectedOperation = 'todas'; this.selectedStatus = 'todos'; this.selectedCommissionStatus = 'todos';
  }

  getStatusClass(status: string): string {
    return status === 'vigente' ? 'badge-success' : 'badge-danger';
  }

  getComisionStatusClass(estado: string): string {
    return estado === 'reportada_pagada' ? 'badge-success' : 'badge-warning';
  }

  abrirModalNuevo() {
    void this.router.navigate(['/app/cierres/nuevo']);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abrirModalEditar(cierre: any) {
    void this.router.navigate(['/app/cierres', cierre.id, 'editar']);
  }

  eliminarCierre(id: string) {
    this.api.void(id).subscribe({ next: () => this.load() });
  }

  get filteredCierres() {
    const query = this.busqueda.trim().toLowerCase();
    return this.cierres.filter((item) => (!query || [item.propiedad, item.contacto, item.asesor].join(' ').toLowerCase().includes(query)) && (this.selectedOperation === 'todas' || item.operation === this.selectedOperation) && (this.selectedStatus === 'todos' || item.status === this.selectedStatus) && (this.selectedCommissionStatus === 'todos' || item.estadoComision === this.selectedCommissionStatus));
  }

  private toRow(item: ClosingDto) {
    const commission = item.commission?.amount ?? '—';
    const percentage = item.commission?.percentage ? ' (' + item.commission.percentage + '%)' : '';
    return { id: item.id, fecha: new Date(item.closed_on).toLocaleDateString('es-MX'), propiedad: item.property_detail?.title ?? item.property, contacto: item.contact_detail?.name ?? item.contact, asesor: item.advisor.display_name, operation: item.operation, tipoOperacion: item.operation === 'venta' ? 'Venta' : 'Renta', monto: item.amount + ' ' + item.currency, comision: commission + percentage, status: item.status, estadoComision: item.commission?.status ?? 'pendiente' };
  }
}
