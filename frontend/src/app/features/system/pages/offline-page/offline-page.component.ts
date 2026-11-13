import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-offline-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offline-page.component.html',
  styleUrl: './offline-page.component.scss',
})
export class OfflinePageComponent {
  readonly page = {
    eyebrow: 'Sin conexión',
    title: 'La operación necesita conexión',
    description: 'Aquí vivirá la revisión y envío manual de borradores de seguimiento.',
  };
}
