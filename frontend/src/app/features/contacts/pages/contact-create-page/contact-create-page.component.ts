import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContactsApiService } from '../../data-access/contacts-api.service';
@Component({
  selector: 'app-contact-create-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-create-page.component.html',
  styleUrl: './contact-create-page.component.scss',
})
export class ContactCreatePageComponent {
  private readonly api = inject(ContactsApiService);
  private readonly router = inject(Router);
  readonly error = signal('');
  form = { name: '', phone: '', email: '', status: 'prospecto' as const, notes: '' };
  save(): void { this.api.create(this.form).subscribe({ next: (contact) => void this.router.navigate(['/app/contactos', contact.id]), error: () => this.error.set('No se pudo guardar el contacto.') }); }
}
