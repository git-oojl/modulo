import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-closing-detail-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closing-detail-page.component.html',
  styleUrl: './closing-detail-page.component.scss',
})
export class ClosingDetailPageComponent {
  readonly page = {
    eyebrow: 'Operaciones',
    title: 'Detalle de cierre',
    description: 'Detalle de operación, monto y estado de comisión.',
  };
}
