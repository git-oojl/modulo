import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppointmentDto, AppointmentsApiService } from '../../data-access/appointments-api.service';

@Component({
  selector: 'app-appointment-detail-page',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-detail-page.component.html',
  styleUrl: './appointment-detail-page.component.scss',
})
export class AppointmentDetailPageComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly appointment = signal<AppointmentDto | null>(null);
  readonly error = signal('');
  readonly completion = signal('');
  readonly completing = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.api.get(id).subscribe({ next: (appointment) => this.appointment.set(appointment), error: () => this.error.set('No se encontró la cita.') });
  }

  complete(): void {
    const appointment = this.appointment();
    if (!appointment || !this.completion().trim()) return;
    this.completing.set(true);
    this.api.complete(appointment.id, { result: this.completion() }).subscribe({
      next: (updated) => { this.appointment.set(updated); this.completing.set(false); },
      error: () => { this.error.set('No se pudo completar la cita.'); this.completing.set(false); },
    });
  }
}
