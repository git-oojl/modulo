import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-forbidden-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forbidden-page.component.html',
  styleUrl: './forbidden-page.component.scss',
})
export class ForbiddenPageComponent {
  readonly page = {
    eyebrow: '403',
    title: 'Sin acceso',
    description: 'No tienes permisos para consultar este recurso.',
  };
}
