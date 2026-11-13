import { Injectable } from '@angular/core';
import { ContactRow } from '../models/contact-row.model';

@Injectable({ providedIn: 'root' })
export class ContactDirectoryService {
  contacts: ContactRow[] = [
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

  findById(id: string): ContactRow | undefined {
    return this.contacts.find((contact) => contact.id === id);
  }

  save(contact: ContactRow): void {
    const index = this.contacts.findIndex(({ id }) => id === contact.id);
    if (index === -1) {
      this.contacts.unshift(contact);
    } else {
      this.contacts[index] = contact;
    }
  }

  delete(id: string): void {
    const index = this.contacts.findIndex((contact) => contact.id === id);
    if (index !== -1) {
      this.contacts.splice(index, 1);
    }
  }
}
