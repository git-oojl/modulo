import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
@Component({
  selector: 'app-appointment-create-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-create-page.component.html',
  styleUrl: './appointment-create-page.component.scss',
})
export class AppointmentCreatePageComponent {
  readonly page = {
    eyebrow: 'Citas',
    title: 'Nueva cita',
    description: 'Programación con contacto, propiedad, propósito y responsable.',
  };
}
