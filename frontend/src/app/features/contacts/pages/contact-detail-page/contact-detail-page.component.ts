import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactDirectoryService } from '../../data-access/contact-directory.service';
import { ContactRow } from '../../models/contact-row.model';

@Component({
  selector: 'app-contact-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-detail-page.component.html',
  styleUrls: [
    './contact-detail-page.component.scss',
    '../contact-list-page/contact-detail.component.scss',
  ],
})
export class ContactDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly directory = inject(ContactDirectoryService);

  get contact(): ContactRow | undefined {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.directory.findById(id) : undefined;
  }

  contactInitials(contact: ContactRow): string {
    return `${contact.name.charAt(0)}${contact.surname.charAt(0)}`.toUpperCase();
  }

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
}
