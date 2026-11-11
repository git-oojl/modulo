import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Propiedad {
  id: number;
  clave: string;
  titulo: string;
  direccion: string;
  sector: string;
  operacion: string;
  tipo: string;
  precio: string;
  agente: string;
  estado: string; // Publicadas, En proceso, etc.
}

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties-page.component.html',
  styleUrl: './properties-page.component.scss'
})
export class PropertiesPageComponent {
  // --- DATOS DE PRUEBA ---
  propiedades: Propiedad[] = [
    { id: 1, clave: 'RCR692950', titulo: 'Renta Casa', direccion: 'Retorno de la Laguna, Tijuana', sector: 'Zona Río', operacion: 'Renta', tipo: 'Residencial', precio: '$1,500 USD', agente: 'Karina Torres', estado: 'Publicadas' },
    { id: 2, clave: 'CBR598555', titulo: 'Venta Terreno', direccion: 'Francisco Sarabia, La Mesa', sector: 'La Mesa', operacion: 'Venta', tipo: 'Terreno', precio: '$500k MXN', agente: 'Paola Suarez', estado: 'Publicadas' },
    { id: 3, clave: 'RCV683490', titulo: 'Renta Depto', direccion: 'Ojo de Agua, Tijuana', sector: 'Ojo de Agua', operacion: 'Renta', tipo: 'Depto', precio: '$2,200 MXN', agente: 'Wendy Guevara', estado: 'En proceso' },
    { id: 4, clave: 'CBR112233', titulo: 'Venta Casa', direccion: 'Playas de Tijuana', sector: 'Playas', operacion: 'Venta', tipo: 'Residencial', precio: '$350k USD', agente: 'Karina Torres', estado: 'Vendidas' },
    { id: 5, clave: 'RCV445566', titulo: 'Renta Local', direccion: 'Zona Río, Tijuana', sector: 'Zona Río', operacion: 'Renta', tipo: 'Comercial', precio: '$1,200 USD', agente: 'Paola Suarez', estado: 'Publicadas' },
    { id: 6, clave: 'CBR778899', titulo: 'Venta Depto', direccion: 'Chapultepec, Tijuana', sector: 'Chapultepec', operacion: 'Venta', tipo: 'Depto', precio: '$180k USD', agente: 'Wendy Guevara', estado: 'Por expirar' },
    { id: 7, clave: 'RCR998877', titulo: 'Renta Casa', direccion: 'El Florido, Tijuana', sector: 'El Florido', operacion: 'Renta', tipo: 'Residencial', precio: '$800 USD', agente: 'Karina Torres', estado: 'Archivadas' },
  ];

  // --- VARIABLES DE FILTROS ---
  filtroBusqueda: string = '';
  filtroSector: string = '';
  filtroOperacion: string = '';
  filtroTipo: string = '';
  filtroAgente: string = '';
  filtroEstado: string = 'Publicadas'; // Pestaña activa por defecto

  // --- VARIABLES DE PAGINACIÓN ---
  paginaActual: number = 1;
  itemsPorPagina: number = 5;

  // --- VARIABLES DEL MODAL ---
  modalAbierto: boolean = false;
  esEdicion: boolean = false;
  propiedadForm: Propiedad = this.limpiarFormulario();

  // --- GETTERS PARA PESTAÑAS (Tabs) ---
  get estadosTabs() {
    return [
      { nombre: 'Publicadas', cantidad: this.contarPorEstado('Publicadas') },
      { nombre: 'En proceso', cantidad: this.contarPorEstado('En proceso') },
      { nombre: 'Por expirar', cantidad: this.contarPorEstado('Por expirar') },
      { nombre: 'Vendidas', cantidad: this.contarPorEstado('Vendidas') },
      { nombre: 'Archivadas', cantidad: this.contarPorEstado('Archivadas') }
    ];
  }

  contarPorEstado(estado: string): number {
    return this.propiedades.filter(p => p.estado === estado).length;
  }

  cambiarEstado(estado: string) {
    this.filtroEstado = estado;
    this.paginaActual = 1; // Reiniciar a la página 1
  }

  // --- GETTERS PARA SELECTS (Filtros dinámicos) ---
  get sectoresUnicos() { return [...new Set(this.propiedades.map(p => p.sector))].sort(); }
  get operacionesUnicas() { return [...new Set(this.propiedades.map(p => p.operacion))].sort(); }
  get tiposUnicos() { return [...new Set(this.propiedades.map(p => p.tipo))].sort(); }
  get agentesUnicos() { return [...new Set(this.propiedades.map(p => p.agente))].sort(); }

  // --- LÓGICA DE FILTRADO PRINCIPAL ---
  get propiedadesFiltradas(): Propiedad[] {
    return this.propiedades.filter(p => {
      // 1. Filtro por pestaña (estado)
      const coincideEstado = p.estado === this.filtroEstado;
      
      // 2. Filtro por buscador
      const termino = this.filtroBusqueda.toLowerCase();
      const coincideBusqueda = p.clave.toLowerCase().includes(termino) || 
                               p.titulo.toLowerCase().includes(termino) || 
                               p.direccion.toLowerCase().includes(termino);
      
      // 3. Filtros de dropdowns
      const coincideSector = this.filtroSector ? p.sector === this.filtroSector : true;
      const coincideOperacion = this.filtroOperacion ? p.operacion === this.filtroOperacion : true;
      const coincideTipo = this.filtroTipo ? p.tipo === this.filtroTipo : true;
      const coincideAgente = this.filtroAgente ? p.agente === this.filtroAgente : true;

      return coincideEstado && coincideBusqueda && coincideSector && coincideOperacion && coincideTipo && coincideAgente;
    });
  }

  // --- LÓGICA DE PAGINACIÓN ---
  get totalPaginas(): number {
    return Math.ceil(this.propiedadesFiltradas.length / this.itemsPorPagina) || 1;
  }

  get propiedadesPaginadas(): Propiedad[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.propiedadesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  get inicioMostrar(): number {
    return this.propiedadesFiltradas.length === 0 ? 0 : (this.paginaActual - 1) * this.itemsPorPagina + 1;
  }

  get finMostrar(): number {
    const fin = this.paginaActual * this.itemsPorPagina;
    return fin > this.propiedadesFiltradas.length ? this.propiedadesFiltradas.length : fin;
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // --- ACCIONES DE FILTROS ---
  reiniciarPagina() {
    this.paginaActual = 1;
  }

  limpiarFiltros() {
    this.filtroBusqueda = '';
    this.filtroSector = '';
    this.filtroOperacion = '';
    this.filtroTipo = '';
    this.filtroAgente = '';
    this.paginaActual = 1;
  }

  // --- LÓGICA DEL MODAL (CRUD) ---
  abrirModalCrear() {
    this.esEdicion = false;
    this.propiedadForm = this.limpiarFormulario();
    // Asignamos el estado de la pestaña actual por defecto
    this.propiedadForm.estado = this.filtroEstado; 
    this.modalAbierto = true;
  }

  abrirModalEditar(propiedad: Propiedad) {
    this.esEdicion = true;
    // Clonamos el objeto para no modificar la tabla hasta guardar
    this.propiedadForm = { ...propiedad };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardarPropiedad() {
    if (this.esEdicion) {
      // Buscar el índice y actualizar
      const index = this.propiedades.findIndex(p => p.id === this.propiedadForm.id);
      if (index !== -1) {
        this.propiedades[index] = { ...this.propiedadForm };
      }
    } else {
      // Crear nueva
      const nuevoId = this.propiedades.length > 0 ? Math.max(...this.propiedades.map(p => p.id)) + 1 : 1;
      this.propiedades.push({ ...this.propiedadForm, id: nuevoId });
    }
    this.cerrarModal();
  }

  eliminarPropiedad(id: number) {
    if (confirm('¿Estás seguro de eliminar esta propiedad?')) {
      this.propiedades = this.propiedades.filter(p => p.id !== id);
      // Si la página actual queda vacía después de borrar, retrocedemos una página
      if (this.propiedadesPaginadas.length === 0 && this.paginaActual > 1) {
        this.paginaActual--;
      }
    }
  }

  private limpiarFormulario(): Propiedad {
    return { id: 0, clave: '', titulo: '', direccion: '', sector: '', operacion: '', tipo: '', precio: '', agente: '', estado: 'Publicadas' };
  }
}