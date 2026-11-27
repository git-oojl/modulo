import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertiesApiService } from '../../data-access/properties-api.service';
@Component({
  selector: 'app-property-create-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-create-page.component.html',
  styleUrl: './property-create-page.component.scss',
})
export class PropertyCreatePageComponent {
  private readonly api = inject(PropertiesApiService);
  private readonly router = inject(Router);
  readonly error = signal('');
  form = {
    title: '', type: 'casa' as const, operation: 'venta' as const,
    status: 'borrador' as const, price: '', currency: 'MXN', city: 'Tijuana',
    neighborhood: '', address: '', public_location: '', description: '',
    is_public: false,
  };

  save(): void {
    this.error.set('');
    this.api.create(this.form).subscribe({
      next: (property) => void this.router.navigate(['/app/propiedades', property.id]),
      error: () => this.error.set('No se pudo guardar la propiedad. Revisa los datos y la visibilidad pública.'),
    });
  }
}
