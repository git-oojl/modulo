import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicCatalogueApiService } from '../../data-access/public-catalogue-api.service';

@Component({ selector: 'app-public-property-detail-page', imports: [FormsModule, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './public-property-detail-page.component.html', styleUrl: './public-property-detail-page.component.scss' })
export class PublicPropertyDetailPageComponent {
  private readonly api = inject(PublicCatalogueApiService); private readonly route = inject(ActivatedRoute);
  readonly property = signal<any>(null); readonly error = signal(''); readonly sent = signal(false);
  form = { name: '', phone: '', email: '', message: '', privacy_accepted: false };
  constructor() { const id = this.route.snapshot.paramMap.get('id'); if (id) this.api.getPublishedProperty(id).subscribe({ next: (item) => this.property.set(item), error: () => this.error.set('La propiedad no está disponible.') }); }
  send(): void { const property = this.property(); if (!property) return; this.api.createInquiry({ property: property.id, ...this.form }).subscribe({ next: () => this.sent.set(true), error: () => this.error.set('No se pudo enviar tu consulta. Revisa el aviso de privacidad y los datos.') }); }
}
