import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-contact-detail-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-detail-page.component.html',
  styleUrl: './contact-detail-page.component.scss',
})
export class ContactDetailPageComponent {
  readonly page = {
    eyebrow: 'Contactos',
    title: 'Detalle de contacto',
    description: 'Ficha con intereses, actividad, seguimientos y citas vinculadas.',
  };
}
