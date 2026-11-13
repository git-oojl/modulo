import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-closing-create-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closing-create-page.component.html',
  styleUrl: './closing-create-page.component.scss',
})
export class ClosingCreatePageComponent {
  readonly page = {
    eyebrow: 'Operaciones',
    title: 'Registrar cierre',
    description: 'Registro de una venta o renta y comisión estimada.',
  };
}
