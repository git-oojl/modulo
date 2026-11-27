import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeadSourceDto, OrganizationApiService, OrganizationDto } from '../../data-access/organization-api.service';
@Component({
  selector: 'app-settings-page',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  private readonly api = inject(OrganizationApiService);
  readonly organization = signal<OrganizationDto | null>(null);
  readonly sources = signal<LeadSourceDto[]>([]);
  readonly error = signal('');
  newSource = '';
  constructor() { this.load(); }
  load(): void {
    this.api.get().subscribe({ next: (organization) => this.organization.set(organization), error: () => this.error.set('No se pudo cargar la configuración de la organización.') });
    this.api.listSources().subscribe({ next: ({ results }) => this.sources.set(results), error: () => this.error.set('No se pudieron cargar las fuentes.') });
  }
  save(): void { const organization = this.organization(); if (organization) this.api.update(organization).subscribe({ next: (saved) => this.organization.set(saved), error: () => this.error.set('No se pudo guardar la organización.') }); }
  addSource(): void { const name = this.newSource.trim(); if (!name) return; this.api.createSource({ name, active: true, sort_order: this.sources().length + 1 }).subscribe({ next: () => { this.newSource = ''; this.load(); }, error: () => this.error.set('No se pudo agregar la fuente.') }); }
  toggleSource(source: LeadSourceDto): void { this.api.updateSource(source.id, { active: !source.active }).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo actualizar la fuente.') }); }
}
