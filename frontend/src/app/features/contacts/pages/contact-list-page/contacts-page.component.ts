import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface ContactRow {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  type: string;
  status: string;
  property: string;
  agent: string;
  source: string;
  operation: string;
  propertyType: string;
  minBudget: string;
  maxBudget: string;
  zone: string;
  bedrooms: string;
}

@Component({
  selector: 'app-contacts-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './contacts-page.component.html',
  styleUrls: ['./contacts-page.component.scss', './contact-detail.component.scss'],
})
export class ContactsPageComponent {
  showNewContactForm = false;
  editingContactId: string | null = null;
  selectedContact: ContactRow | null = null;
  contactPendingDelete: ContactRow | null = null;
  contactSearch = '';
  selectedContactType = 'Todos';
  selectedContactStatus = 'Todos';
  selectedAgent = 'Todos';

  readonly detailAppointments = [
    {
      title: 'Visita a Casa en Playas',
      details: 'Sáb 31 oct · 11:00 · Con Luis Ortega',
      status: 'Confirmada',
    },
    {
      title: 'Segunda visita a Casa en Chapultepec',
      details: 'Mié 4 nov · 17:30 · Con Luis Ortega',
      status: 'Pendiente',
    },
  ];

  readonly detailActivities = [
    { title: 'Llamada de seguimiento', details: 'Hoy · Luis Ortega' },
    { title: 'Envió documentos de preaprobación', details: 'Ayer · WhatsApp' },
    { title: 'Se compartieron 3 inmuebles', details: 'Hace 3 días · Correo' },
    { title: 'Contacto registrado', details: 'Hace 1 semana · Fuente: recomendación' },
  ];

  newContact = this.emptyContactForm();

  readonly contacts: ContactRow[] = [
    {
      id: 'CNT-1001',
      name: 'Victoria',
      surname: 'Barreda',
      phone: '664 139 1099',
      email: 'victoria.barreda@example.com',
      type: 'Comprador',
      status: 'Calificado',
      property: 'Departamento, 4+ rec.',
      agent: 'Ana Barajas',
      source: 'Recomendacion',
      operation: 'Comprador',
      propertyType: 'Departamento',
      minBudget: '2800000',
      maxBudget: '3500000',
      zone: 'Centro',
      bedrooms: '4+',
    },
    {
      id: 'CNT-1002',
      name: 'Diego',
      surname: 'Morales',
      phone: '664 520 4418',
      email: 'diego.morales@example.com',
      type: 'Comprador',
      status: 'Nuevo',
      property: 'Casa, 3 rec.',
      agent: 'Luis Ortega',
      source: 'Redes sociales',
      operation: 'Comprador',
      propertyType: 'Casa',
      minBudget: '1800000',
      maxBudget: '2400000',
      zone: 'Playas',
      bedrooms: '3',
    },
    {
      id: 'CNT-1003',
      name: 'Fernanda',
      surname: 'Ruiz',
      phone: '664 311 7062',
      email: 'fernanda.ruiz@example.com',
      type: 'Vendedor',
      status: 'En seguimiento',
      property: 'Casa, 2 rec.',
      agent: 'Carlos Mendez',
      source: 'Pagina web',
      operation: 'Vendedor',
      propertyType: 'Casa',
      minBudget: '2200000',
      maxBudget: '2600000',
      zone: 'Norte',
      bedrooms: '2',
    },
    {
      id: 'CNT-1004',
      name: 'Javier',
      surname: 'Castañeda',
      phone: '664 902 1834',
      email: 'javier.castaneda@example.com',
      type: 'Arrendatario',
      status: 'Calificado',
      property: 'Departamento, 2 rec.',
      agent: 'Elena Cruz',
      source: 'Otro',
      operation: 'Renta',
      propertyType: 'Departamento',
      minBudget: '12000',
      maxBudget: '18000',
      zone: 'Zona Río',
      bedrooms: '2',
    },
    {
      id: 'CNT-1005',
      name: 'Sofía',
      surname: 'Navarro',
      phone: '664 407 6281',
      email: 'sofia.navarro@example.com',
      type: 'Vendedor',
      status: 'Nuevo',
      property: 'Terreno, 0 rec.',
      agent: 'Ana Barajas',
      source: 'Redes sociales',
      operation: 'Vendedor',
      propertyType: 'Terreno',
      minBudget: '950000',
      maxBudget: '1200000',
      zone: 'Sur',
      bedrooms: '0',
    },
    {
      id: 'CNT-1006',
      name: 'Mateo',
      surname: 'Ochoa',
      phone: '664 758 0926',
      email: 'mateo.ochoa@example.com',
      type: 'Comprador',
      status: 'En seguimiento',
      property: 'Casa, 4 rec.',
      agent: 'Carlos Mendez',
      source: 'Recomendacion',
      operation: 'Comprador',
      propertyType: 'Casa',
      minBudget: '3200000',
      maxBudget: '4000000',
      zone: 'Chapultepec',
      bedrooms: '4',
    },
    {
      id: 'CNT-1007',
      name: 'Valeria',
      surname: 'Pérez',
      phone: '664 286 5940',
      email: 'valeria.perez@example.com',
      type: 'Arrendatario',
      status: 'Nuevo',
      property: 'Departamento, 1 rec.',
      agent: 'Luis Ortega',
      source: 'Pagina web',
      operation: 'Renta',
      propertyType: 'Departamento',
      minBudget: '8000',
      maxBudget: '12000',
      zone: 'Centro',
      bedrooms: '1',
    },
    {
      id: 'CNT-1008',
      name: 'Emilio',
      surname: 'Sánchez',
      phone: '664 635 2701',
      email: 'emilio.sanchez@example.com',
      type: 'Comprador',
      status: 'Calificado',
      property: 'Local, 0 rec.',
      agent: 'Elena Cruz',
      source: 'Otro',
      operation: 'Comprador',
      propertyType: 'Local',
      minBudget: '2500000',
      maxBudget: '3500000',
      zone: 'Zona Centro',
      bedrooms: '0',
    },
  ];

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
    const contact = this.buildContact(this.editingContactId ?? this.nextContactId());
    if (this.editingContactId) {
      const index = this.contacts.findIndex(({ id }) => id === this.editingContactId);
      if (index >= 0) {
        this.contacts[index] = contact;
      }
    } else {
      this.contacts.unshift(contact);
    }
    this.closeContactForm();
  }

  editContact(contact: ContactRow): void {
    this.editingContactId = contact.id;
    this.newContact = {
      name: contact.name,
      surname: contact.surname,
      phone: contact.phone,
      email: contact.email,
      contactType: contact.type,
      source: contact.source,
      operation: contact.operation,
      propertyType: contact.propertyType,
      minBudget: contact.minBudget,
      maxBudget: contact.maxBudget,
      zone: contact.zone,
      bedrooms: contact.bedrooms,
      agent: contact.agent,
      status: contact.status,
    };
    this.showNewContactForm = true;
  }

  closeContactForm(): void {
    this.showNewContactForm = false;
    this.editingContactId = null;
    this.newContact = this.emptyContactForm();
  }

  contactInitials(contact: ContactRow): string {
    return `${contact.name.charAt(0)}${contact.surname.charAt(0)}`.toUpperCase();
  }

  phoneForWhatsApp(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  confirmDeleteContact(): void {
    if (!this.contactPendingDelete) {
      return;
    }
    const id = this.contactPendingDelete.id;
    const index = this.contacts.findIndex((contact) => contact.id === id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
    }
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
