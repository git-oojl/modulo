import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-closing-edit-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closing-edit-page.component.html',
  styleUrl: './closing-edit-page.component.scss',
})
export class ClosingEditPageComponent {
  readonly page = {
    eyebrow: 'Operaciones',
    title: 'Editar cierre',
    description: 'Corrección, anulación y actualización de comisión.',
  };
}
