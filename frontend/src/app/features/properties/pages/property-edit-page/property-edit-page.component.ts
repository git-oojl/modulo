import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-property-edit-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-edit-page.component.html',
  styleUrl: './property-edit-page.component.scss',
})
export class PropertyEditPageComponent {
  readonly page = {
    eyebrow: 'Inventario',
    title: 'Editar propiedad',
    description: 'Edición, fotografías y control de publicación.',
  };
}
