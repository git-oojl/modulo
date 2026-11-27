import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClosingsApiService } from '../../data-access/closings-api.service';
import { ContactsApiService, ContactDto } from '../../../contacts/data-access/contacts-api.service';
import { PropertiesApiService, PropertyDto } from '../../../properties/data-access/properties-api.service';

@Component({ selector: 'app-closing-create-page', imports: [FormsModule, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './closing-create-page.component.html', styleUrl: './closing-create-page.component.scss' })
export class ClosingCreatePageComponent {
  private readonly api = inject(ClosingsApiService); private readonly router = inject(Router);
  private readonly contactsApi = inject(ContactsApiService); private readonly propertiesApi = inject(PropertiesApiService);
  readonly error = signal(''); readonly contacts = signal<ContactDto[]>([]); readonly properties = signal<PropertyDto[]>([]);
  form = { property: '', contact: '', operation: 'venta' as const, closed_on: '', amount: '', currency: 'MXN', percentage: '' };
  constructor() {
    this.contactsApi.list().subscribe({ next: ({ results }) => this.contacts.set(results) });
    this.propertiesApi.list().subscribe({ next: ({ results }) => this.properties.set(results.filter((property) => property.status !== 'archivada')) });
  }
  save(): void {
    if (!this.form.property || !this.form.contact || !this.form.closed_on || !this.form.amount) { this.error.set('Propiedad, contacto, fecha y monto son obligatorios.'); return; }
    this.api.create({ property: this.form.property, contact: this.form.contact, operation: this.form.operation, closed_on: this.form.closed_on, amount: this.form.amount, currency: this.form.currency, commission: { percentage: this.form.percentage || null, status: 'pendiente' } }).subscribe({ next: (item) => void this.router.navigate(['/app/cierres', item.id]), error: () => this.error.set('No se pudo registrar el cierre. Verifica los datos de la operación.') });
  }
}
