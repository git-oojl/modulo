import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-agent-directory-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-directory-page.component.html',
  styleUrl: './agent-directory-page.component.scss',
})
export class AgentDirectoryPageComponent {
  readonly page = {
    eyebrow: 'Equipo',
    title: 'Asesores',
    description: 'Directorio y actividad por asesor para gerencia.',
  };
}
