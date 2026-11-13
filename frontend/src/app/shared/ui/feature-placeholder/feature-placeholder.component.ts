import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PagePlaceholder } from '../../../core/models/page.model';

@Component({
  selector: 'app-feature-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.scss',
})
export class FeaturePlaceholderComponent {
  readonly page = input.required<PagePlaceholder>();
}
