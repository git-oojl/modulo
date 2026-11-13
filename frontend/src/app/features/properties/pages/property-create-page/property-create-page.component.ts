import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-property-create-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-create-page.component.html',
  styleUrl: './property-create-page.component.scss',
})
export class PropertyCreatePageComponent {
  readonly page = {
    eyebrow: 'Inventario',
    title: 'Nueva propiedad',
    description: 'Alta de inmueble, asignación, estado, visibilidad y medios.',
  };
}
