import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-catalogue-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogue-page.component.html',
  styleUrl: './catalogue-page.component.scss',
})
export class CataloguePageComponent {
  readonly page = {
    eyebrow: 'Catálogo público opcional',
    title: 'Propiedades disponibles',
    description: 'Módulo independiente y desactivado por defecto.',
  };
}
