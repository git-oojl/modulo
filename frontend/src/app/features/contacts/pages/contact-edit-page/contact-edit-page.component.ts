import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgentsApiService } from '../../../agents/data-access/agents-api.service';
import { ContactsApiService, ContactDto, ContactPayload } from '../../data-access/contacts-api.service';
import { OrganizationApiService, LeadSourceDto } from '../../../settings/data-access/organization-api.service';
import { UserReference } from '../../../../core/api/api.models';

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
  private readonly contactsApi = inject(ContactsApiService);
  private readonly agentsApi = inject(AgentsApiService);
  private readonly organizationApi = inject(OrganizationApiService);

  readonly contactId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly contact = signal<ContactDto | null>(null);
  readonly agents = signal<UserReference[]>([]);
  readonly sources = signal<LeadSourceDto[]>([]);
  readonly error = signal('');
  form: ContactPayload = this.emptyForm();

  constructor() {
    if (this.contactId) {
      this.contactsApi.get(this.contactId).subscribe({
        next: (contact) => {
          this.contact.set(contact);
          this.form = {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            source: contact.source,
            status: contact.status,
            notes: contact.notes,
            advisor_id: contact.advisor?.id ?? null,
          };
        },
        error: () => this.error.set('No se encontró este contacto.'),
      });
    }
    this.agentsApi.list().subscribe({ next: ({ results }) => this.agents.set(results) });
    this.organizationApi.listSources().subscribe({ next: ({ results }) => this.sources.set(results.filter((source) => source.active)) });
  }

  saveChanges(): void {
    if (!this.contact()) {
      return;
    }

    this.contactsApi.update(this.contactId, this.form).subscribe({
      next: () => void this.router.navigate(['/app/contactos', this.contactId]),
      error: () => this.error.set('No se pudieron guardar los cambios.'),
    });
  }

  private emptyForm(): ContactPayload {
    return {
      name: '',
      phone: '',
      email: '',
      source: null,
      advisor_id: null,
      status: 'prospecto' as const,
      notes: '',
    };
  }
}
