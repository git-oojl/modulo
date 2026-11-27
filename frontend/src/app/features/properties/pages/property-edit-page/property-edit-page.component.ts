import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertiesApiService } from '../../data-access/properties-api.service';
@Component({
  selector: 'app-property-edit-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-edit-page.component.html',
  styleUrl: './property-edit-page.component.scss',
})
export class PropertyEditPageComponent {
  private readonly api = inject(PropertiesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly error = signal('');
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  form: any = null;
  constructor() { if (this.id) this.api.get(this.id).subscribe({ next: (property) => this.form = { ...property }, error: () => this.error.set('No se pudo cargar la propiedad.') }); }
  save(): void { if (this.form) this.api.update(this.id, this.form).subscribe({ next: () => void this.router.navigate(['/app/propiedades', this.id]), error: () => this.error.set('No se pudo guardar los cambios.') }); }
}
