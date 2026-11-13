import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-contact-create-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-create-page.component.html',
  styleUrl: './contact-create-page.component.scss',
})
export class ContactCreatePageComponent {
  readonly page = {
    eyebrow: 'Contactos',
    title: 'Nuevo contacto',
    description: 'Formulario de alta, asignación, origen e intereses.',
  };
}
