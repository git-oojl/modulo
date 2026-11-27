import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentsApiService } from '../../data-access/appointments-api.service';

@Component({ selector: 'app-appointment-edit-page', imports: [FormsModule, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './appointment-edit-page.component.html', styleUrl: './appointment-edit-page.component.scss' })
export class AppointmentEditPageComponent {
  private readonly api = inject(AppointmentsApiService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  readonly id = this.route.snapshot.paramMap.get('id') ?? ''; readonly error = signal(''); form: any = null;
  constructor() { if (this.id) this.api.get(this.id).subscribe({ next: (item) => this.form = { ...item, starts_at: item.starts_at.slice(0, 16) }, error: () => this.error.set('No se pudo cargar la cita.') }); }
  save(): void { if (!this.form) return; const payload = { purpose: this.form.purpose, starts_at: new Date(this.form.starts_at).toISOString(), ends_at: this.form.ends_at || null, notes: this.form.notes, status: this.form.status }; this.api.update(this.id, payload).subscribe({ next: () => void this.router.navigate(['/app/citas', this.id]), error: () => this.error.set('No se pudo guardar los cambios.') }); }
}
