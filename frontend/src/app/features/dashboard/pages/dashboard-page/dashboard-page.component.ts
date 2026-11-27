import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { DashboardApiService, DashboardDto } from '../../data-access/dashboard-api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly auth = inject(AuthService);
  private readonly dashboardApi = inject(DashboardApiService);
  readonly dashboard = signal<DashboardDto | null>(null);

  get nombreUsuario(): string {
    return this.auth.user()?.displayName ?? 'Usuario';
  }

  fechaActual = new Date();

  proximasCitas: { dia: string; mes: string; nombre: string; propiedad: string; hora: string }[] = [];

  // Solo dejamos 2 para el resumen, o los recortamos en el HTML
  actividadReciente: { icono: string; titulo: string; tipo: string; fecha: string }[] = [];
  constructor() {
    this.dashboardApi.get().subscribe({ next: (data) => {
      this.dashboard.set(data);
      this.proximasCitas = data.upcoming_appointments.map((item) => { const date = new Date(item.starts_at); return { dia: String(date.getDate()), mes: date.toLocaleDateString('es-MX', { month: 'short' }), nombre: item.contact, propiedad: item.property ?? 'Sin propiedad', hora: date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }; });
      this.actividadReciente = data.recent_activity.map((item) => ({ icono: item.type === 'llamada' ? '📞' : '•', titulo: item.content, tipo: item.contact, fecha: new Date(item.occurred_at).toLocaleDateString('es-MX') }));
    } });
  }
  propertyCount(status: string): number { return this.dashboard()?.properties_by_status.find((item) => item.status === status)?.count ?? 0; }
}
