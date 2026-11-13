import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-contact-edit-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-edit-page.component.html',
  styleUrl: './contact-edit-page.component.scss',
})
export class ContactEditPageComponent {
  readonly page = {
    eyebrow: 'Contactos',
    title: 'Editar contacto',
    description: 'Edición autorizada de datos, asignación y estado.',
  };
}
