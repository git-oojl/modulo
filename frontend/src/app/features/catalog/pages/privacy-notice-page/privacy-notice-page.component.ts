import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-privacy-notice-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-notice-page.component.html',
  styleUrl: './privacy-notice-page.component.scss',
})
export class PrivacyNoticePageComponent {
  readonly page = {
    eyebrow: 'Privacidad',
    title: 'Aviso de privacidad',
    description: 'Aviso requerido antes de habilitar consultas en el catálogo público.',
  };
}
