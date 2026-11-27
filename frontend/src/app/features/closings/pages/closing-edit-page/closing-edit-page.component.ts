import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClosingsApiService } from '../../data-access/closings-api.service';

@Component({ selector: 'app-closing-edit-page', imports: [FormsModule, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './closing-edit-page.component.html', styleUrl: './closing-edit-page.component.scss' })
export class ClosingEditPageComponent {
  private readonly api = inject(ClosingsApiService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  readonly id = this.route.snapshot.paramMap.get('id') ?? ''; readonly error = signal(''); form: any = null;
  constructor() { if (this.id) this.api.get(this.id).subscribe({ next: (item) => this.form = { ...item, commission_percentage: item.commission?.percentage ?? '' }, error: () => this.error.set('No se pudo cargar el cierre.') }); }
  save(): void { if (!this.form) return; this.api.update(this.id, { closed_on: this.form.closed_on, amount: this.form.amount, currency: this.form.currency, notes: this.form.notes }).subscribe({ next: () => this.api.updateCommission(this.id, { percentage: this.form.commission_percentage || null, status: this.form.commission.status }).subscribe({ next: () => void this.router.navigate(['/app/cierres', this.id]), error: () => this.error.set('No se pudo actualizar la comisión.') }), error: () => this.error.set('No se pudo guardar el cierre.') }); }
}
