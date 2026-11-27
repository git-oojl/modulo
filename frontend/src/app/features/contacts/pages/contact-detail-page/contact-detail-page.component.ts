import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactDto, ContactsApiService } from '../../data-access/contacts-api.service';

@Component({ selector: 'app-contact-detail-page', imports: [RouterLink, DatePipe], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './contact-detail-page.component.html', styleUrl: './contact-detail-page.component.scss' })
export class ContactDetailPageComponent {
  private readonly api = inject(ContactsApiService); private readonly route = inject(ActivatedRoute);
  readonly contact = signal<ContactDto | null>(null); readonly error = signal('');
  constructor() { const id = this.route.snapshot.paramMap.get('id'); if (id) this.api.get(id).subscribe({ next: (item) => this.contact.set(item), error: () => this.error.set('No se encontró el contacto.') }); }
  completeFollowUp(id: string): void { const contact = this.contact(); if (contact) this.api.completeFollowUp(contact.id, id).subscribe({ next: () => this.api.get(contact.id).subscribe({ next: (item) => this.contact.set(item) }) }); }
}
