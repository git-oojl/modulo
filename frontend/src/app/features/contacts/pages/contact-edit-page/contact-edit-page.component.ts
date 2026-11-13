import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactDirectoryService } from '../../data-access/contact-directory.service';
import { ContactRow } from '../../models/contact-row.model';

@Component({
  selector: 'app-contact-edit-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-edit-page.component.html',
  styleUrl: './contact-edit-page.component.scss',
})
export class ContactEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly directory = inject(ContactDirectoryService);

  readonly contactId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly contact = this.directory.findById(this.contactId);

  form = this.contact
    ? {
        name: this.contact.name,
        surname: this.contact.surname,
        phone: this.contact.phone,
        email: this.contact.email,
        contactType: this.contact.type,
        source: this.contact.source,
        operation: this.contact.operation,
        propertyType: this.contact.propertyType,
        minBudget: this.contact.minBudget,
        maxBudget: this.contact.maxBudget,
        zone: this.contact.zone,
        bedrooms: this.contact.bedrooms,
        agent: this.contact.agent,
        status: this.contact.status,
      }
    : this.emptyForm();

  saveChanges(): void {
    if (!this.contact) {
      return;
    }

    const updated: ContactRow = {
      ...this.contact,
      name: this.form.name.trim(),
      surname: this.form.surname.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email.trim(),
      type: this.form.contactType,
      source: this.form.source,
      operation: this.form.operation,
      propertyType: this.form.propertyType,
      minBudget: String(this.form.minBudget),
      maxBudget: String(this.form.maxBudget),
      zone: this.form.zone,
      bedrooms: this.form.bedrooms,
      agent: this.form.agent,
      status: this.form.status,
      property: `${this.form.propertyType}, ${this.form.bedrooms} rec.`,
    };

    this.directory.save(updated);
    void this.router.navigate(['/app/contactos', this.contactId]);
  }

  private emptyForm() {
    return {
      name: '',
      surname: '',
      phone: '',
      email: '',
      contactType: 'Comprador',
      source: 'Recomendacion',
      operation: 'Comprador',
      propertyType: 'Casa',
      minBudget: '',
      maxBudget: '',
      zone: '',
      bedrooms: '1',
      agent: 'Luis Ortega',
      status: 'Nuevo',
    };
  }
}
