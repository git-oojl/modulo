import { Component, inject } from '@angular/core';
import { ContactDirectoryService } from '../../data-access/contact-directory.service';
import { ContactRow } from '../../models/contact-row.model';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contacts-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.scss',
})
export class ContactsPageComponent {
  showNewContactForm = false;
  contactPendingDelete: ContactRow | null = null;
  contactSearch = '';
  selectedContactType = 'Todos';
  selectedContactStatus = 'Todos';
  selectedAgent = 'Todos';

  newContact = this.emptyContactForm();

  private readonly contactDirectory = inject(ContactDirectoryService);

  get contacts(): ContactRow[] {
    return this.contactDirectory.contacts;
  }

  get filteredContacts(): ContactRow[] {
    const query = this.contactSearch.trim().toLowerCase();
    const phoneQuery = query.replace(/\D/g, '');

    return this.contacts.filter((contact) => {
      const fullName = `${contact.name} ${contact.surname}`.toLowerCase();
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        (phoneQuery.length > 0 && contact.phone.replace(/\D/g, '').includes(phoneQuery));

      return (
        matchesSearch &&
        (this.selectedContactType === 'Todos' || contact.type === this.selectedContactType) &&
        (this.selectedContactStatus === 'Todos' || contact.status === this.selectedContactStatus) &&
        (this.selectedAgent === 'Todos' || contact.agent === this.selectedAgent)
      );
    });
  }

  clearContactFilters(): void {
    this.contactSearch = '';
    this.selectedContactType = 'Todos';
    this.selectedContactStatus = 'Todos';
    this.selectedAgent = 'Todos';
  }

  get contactTypes(): string[] {
    return [...new Set(this.contacts.map(({ type }) => type))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  }

  get contactStatuses(): string[] {
    return [...new Set(this.contacts.map(({ status }) => status))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  }

  get contactAgents(): string[] {
    return [...new Set(this.contacts.map(({ agent }) => agent))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  }

  private emptyContactForm() {
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
      zone: 'Comprador',
      bedrooms: '1',
      agent: 'Luis Ortega',
      status: 'Nuevo',
    };
  }

  saveNewContact(): void {
    this.contactDirectory.save(this.buildContact(this.nextContactId()));
    this.closeContactForm();
  }

  closeContactForm(): void {
    this.showNewContactForm = false;
    this.newContact = this.emptyContactForm();
  }

  phoneForWhatsApp(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  confirmDeleteContact(): void {
    if (!this.contactPendingDelete) {
      return;
    }
    this.contactDirectory.delete(this.contactPendingDelete.id);
    this.contactPendingDelete = null;
  }

  private buildContact(id: string): ContactRow {
    return {
      id,
      name: this.newContact.name.trim(),
      surname: this.newContact.surname.trim(),
      phone: this.newContact.phone.trim(),
      email: this.newContact.email.trim(),
      type: this.newContact.contactType,
      status: this.newContact.status,
      property: `${this.newContact.propertyType}, ${this.newContact.bedrooms} rec.`,
      agent: this.newContact.agent,
      source: this.newContact.source,
      operation: this.newContact.operation,
      propertyType: this.newContact.propertyType,
      minBudget: this.newContact.minBudget,
      maxBudget: this.newContact.maxBudget,
      zone: this.newContact.zone,
      bedrooms: this.newContact.bedrooms,
    };
  }

  private nextContactId(): string {
    const nextId =
      Math.max(1000, ...this.contacts.map(({ id }) => Number(id.replace('CNT-', '')) || 0)) + 1;
    return `CNT-${nextId}`;
  }
}
