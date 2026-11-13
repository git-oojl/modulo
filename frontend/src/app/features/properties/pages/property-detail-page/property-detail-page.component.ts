import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-property-detail-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-detail-page.component.html',
  styleUrl: './property-detail-page.component.scss',
})
export class PropertyDetailPageComponent {
  readonly page = {
    eyebrow: 'Inventario',
    title: 'Detalle de propiedad',
    description: 'Ficha interna, historial operativo y galería de medios.',
  };
}
