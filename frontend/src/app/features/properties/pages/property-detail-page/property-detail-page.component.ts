import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyDto, PropertiesApiService } from '../../data-access/properties-api.service';
@Component({
  selector: 'app-property-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-detail-page.component.html',
  styleUrl: './property-detail-page.component.scss',
})
export class PropertyDetailPageComponent {
  private readonly api = inject(PropertiesApiService);
  private readonly route = inject(ActivatedRoute);
  readonly property = signal<PropertyDto | null>(null);
  readonly error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.get(id).subscribe({
        next: (property) => this.property.set(property),
        error: () => this.error.set('No se encontró la propiedad o no tienes permiso para verla.'),
      });
    }
  }
}
