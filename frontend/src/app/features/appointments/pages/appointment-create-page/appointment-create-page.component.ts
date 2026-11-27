import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AppointmentsApiService } from '../../data-access/appointments-api.service';
import { ContactsApiService, ContactDto } from '../../../contacts/data-access/contacts-api.service';
import { PropertiesApiService, PropertyDto } from '../../../properties/data-access/properties-api.service';

@Component({
  selector: 'app-appointment-create-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-create-page.component.html',
  styleUrl: './appointment-create-page.component.scss',
})
export class AppointmentCreatePageComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly contactsApi = inject(ContactsApiService);
  private readonly propertiesApi = inject(PropertiesApiService);
  private readonly router = inject(Router);
  readonly contacts = signal<ContactDto[]>([]);
  readonly properties = signal<PropertyDto[]>([]);
  readonly error = signal('');
  form = { contact: '', property: '', starts_at: '', purpose: 'visita' as const, notes: '' };
  constructor() {
    this.contactsApi.list().subscribe({ next: ({ results }) => this.contacts.set(results) });
    this.propertiesApi.list({ status: 'activa' }).subscribe({ next: ({ results }) => this.properties.set(results) });
  }
  guardarCita(): void {
    if (!this.form.contact || !this.form.starts_at) { this.error.set('Contacto y fecha son obligatorios.'); return; }
    this.api.create({ contact: this.form.contact, property: this.form.property || null, starts_at: new Date(this.form.starts_at).toISOString(), purpose: this.form.purpose, notes: this.form.notes }).subscribe({ next: (appointment) => void this.router.navigate(['/app/citas', appointment.id]), error: () => this.error.set('No se pudo guardar la cita.') });
  }
  cancelar(): void { void this.router.navigate(['/app/citas']); }
}
