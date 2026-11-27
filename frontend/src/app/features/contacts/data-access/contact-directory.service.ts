import { Injectable, inject } from '@angular/core';
import { ContactRow } from '../models/contact-row.model';
import { ContactDto, ContactsApiService } from './contacts-api.service';

@Injectable({ providedIn: 'root' })
export class ContactDirectoryService {
  private readonly api = inject(ContactsApiService);
  contacts: ContactRow[] = [];

  constructor() {
    this.reload();
  }

  reload(): void {
    this.api.list().subscribe({ next: ({ results }) => (this.contacts = results.map((item) => this.toRow(item))) });
  }

  findById(id: string): ContactRow | undefined {
    return this.contacts.find((contact) => contact.id === id);
  }

  save(contact: ContactRow): void {
    const payload = {
      name: [contact.name, contact.surname].filter(Boolean).join(' '),
      phone: contact.phone,
      email: contact.email,
      status: this.toStatus(contact.status),
      notes: [contact.type, contact.operation, contact.propertyType, contact.zone, contact.bedrooms]
        .filter(Boolean)
        .join(' · '),
    };
    const request = this.findById(contact.id) ? this.api.update(contact.id, payload) : this.api.create(payload);
    request.subscribe({ next: () => this.reload() });
  }

  delete(id: string): void {
    this.api.archive(id).subscribe({ next: () => this.reload() });
  }

  private toRow(contact: ContactDto): ContactRow {
    const names = contact.name.trim().split(/\s+/);
    const notes = contact.notes.split(' · ');
    return {
      id: contact.id,
      name: names.shift() ?? contact.name,
      surname: names.join(' '),
      phone: contact.phone,
      email: contact.email,
      type: notes[0] || 'Contacto',
      status: contact.status,
      property: contact.interests[0] ? 'Propiedad de interés' : 'Sin interés registrado',
      agent: contact.advisor?.display_name ?? 'Sin asignar',
      source: contact.source_name || 'Sin fuente',
      operation: notes[1] || '',
      propertyType: notes[2] || '',
      minBudget: '',
      maxBudget: '',
      zone: notes[3] || '',
      bedrooms: notes[4] || '',
    };
  }

  private toStatus(status: string): ContactDto['status'] {
    return ['prospecto', 'cliente_activo', 'cliente_cerrado', 'perdido', 'inactivo'].includes(status)
      ? (status as ContactDto['status'])
      : 'prospecto';
  }
}
