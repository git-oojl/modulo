import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../../../../shared/ui/feature-placeholder/feature-placeholder.component';
import { PagePlaceholder } from '../../../../core/models/page.model';

@Component({
  selector: 'app-login-page',
  imports: [FeaturePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  readonly page: PagePlaceholder = {
    eyebrow: 'Acceso de personal',
    title: 'Iniciar sesión',
    description: 'El acceso estará reservado para el personal autorizado de la inmobiliaria.',
  };
}
