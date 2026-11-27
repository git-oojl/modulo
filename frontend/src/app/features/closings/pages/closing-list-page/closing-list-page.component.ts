import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
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
  readonly page = {
    eyebrow: 'Operaciones',
    title: 'Cierres',
    description: 'Ventas y rentas concretadas, con filtros y comisión estimada.',
  };

  busqueda = '';
  isModalOpen = false;
  isEditMode = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentClosing: any = {
    id: '',
    propiedad: '',
    contacto: '',
    asesor: '',
    tipoOperacion: 'Venta',
    monto: '',
    comision: '',
    status: 'vigente',
    estadoComision: 'pendiente'
  };

  cierres = [
    {
      id: 'CLO-01',
      fecha: '15 Nov 2026',
      propiedad: 'Casa en Polanco',
      contacto: 'Mya Flores Castañón',
      asesor: 'Karina Torres',
      tipoOperacion: 'Venta',
      monto: '$8,000,000 MXN',
      comision: '$400,000 MXN (5%)',
      status: 'vigente',
      estadoComision: 'pendiente'
    },
    {
      id: 'CLO-02',
      fecha: '16 Nov 2026',
      propiedad: 'Renta Depto Roma',
      contacto: 'Jennifer Estrada',
      asesor: 'Paola Suarez',
      tipoOperacion: 'Renta',
      monto: '$15,000 MXN',
      comision: '$15,000 MXN (100%)',
      status: 'vigente',
      estadoComision: 'reportada_pagada'
    }
  ];
  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: ({ results }) => this.cierres = results.map((item) => this.toRow(item)) }); }

  limpiarFiltros() {
    this.busqueda = '';
  }

  getStatusClass(status: string): string {
    return status === 'vigente' ? 'badge-success' : 'badge-danger';
  }

  getComisionStatusClass(estado: string): string {
    return estado === 'reportada_pagada' ? 'badge-success' : 'badge-warning';
  }

  abrirModalNuevo() {
    this.isEditMode = false;
    this.currentClosing = {
      id: 'CLO-0' + (this.cierres.length + 1),
      propiedad: '',
      contacto: '',
      asesor: '',
      tipoOperacion: 'Venta',
      monto: '',
      comision: '',
      status: 'vigente',
      estadoComision: 'pendiente'
    };
    this.isModalOpen = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abrirModalEditar(cierre: any) {
    this.isEditMode = true;
    this.currentClosing = { ...cierre };
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  guardarCierre() {
    if (this.isEditMode) {
      const index = this.cierres.findIndex(c => c.id === this.currentClosing.id);
      if (index !== -1) {
        this.cierres[index] = { ...this.currentClosing };
      }
    } else {
      this.cierres.push({ ...this.currentClosing, fecha: '17 Nov 2026' });
    }
    this.isModalOpen = false;
  }

  eliminarCierre(id: string) {
    this.api.void(id).subscribe({ next: () => this.load() });
  }

  private toRow(item: ClosingDto) {
    const commission = item.commission?.amount ?? '—';
    const percentage = item.commission?.percentage ? ' (' + item.commission.percentage + '%)' : '';
    return { id: item.id, fecha: new Date(item.closed_on).toLocaleDateString('es-MX'), propiedad: item.property_detail?.title ?? item.property, contacto: item.contact_detail?.name ?? item.contact, asesor: item.advisor.display_name, tipoOperacion: item.operation === 'venta' ? 'Venta' : 'Renta', monto: item.amount + ' ' + item.currency, comision: commission + percentage, status: item.status, estadoComision: item.commission?.status ?? 'pendiente' };
  }
}
