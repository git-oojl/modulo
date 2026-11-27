import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClosingDto, ClosingsApiService } from '../../data-access/closings-api.service';

@Component({ selector: 'app-closing-detail-page', imports: [RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './closing-detail-page.component.html', styleUrl: './closing-detail-page.component.scss' })
export class ClosingDetailPageComponent {
  private readonly api = inject(ClosingsApiService); private readonly route = inject(ActivatedRoute);
  readonly closing = signal<ClosingDto | null>(null); readonly error = signal('');
  constructor() { const id = this.route.snapshot.paramMap.get('id'); if (id) this.api.get(id).subscribe({ next: (item) => this.closing.set(item), error: () => this.error.set('No se encontró el cierre.') }); }
  voidClosing(): void { const item = this.closing(); if (item) this.api.void(item.id).subscribe({ next: (updated) => this.closing.set(updated), error: () => this.error.set('No se pudo anular el cierre.') }); }
}
