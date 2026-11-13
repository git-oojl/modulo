import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-public-property-detail-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-property-detail-page.component.html',
  styleUrl: './public-property-detail-page.component.scss',
})
export class PublicPropertyDetailPageComponent {
  readonly page = {
    eyebrow: 'Catálogo público opcional',
    title: 'Ficha de propiedad',
    description: 'Ficha pública, imágenes y futura consulta protegida contra abuso.',
  };
}
