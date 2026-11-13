import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-appointment-edit-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-edit-page.component.html',
  styleUrl: './appointment-edit-page.component.scss',
})
export class AppointmentEditPageComponent {
  readonly page = {
    eyebrow: 'Citas',
    title: 'Editar cita',
    description: 'Cambios autorizados a la cita, resultado y próxima acción.',
  };
}
