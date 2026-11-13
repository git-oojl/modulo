import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-closing-list-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closing-list-page.component.html',
  styleUrl: './closing-list-page.component.scss',
})
export class ClosingListPageComponent {
  readonly page = {
    eyebrow: 'Operaciones',
    title: 'Cierres',
    description: 'Ventas y rentas concretadas, con filtros y comisión estimada.',
  };
}
