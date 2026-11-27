import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AgentsApiService } from '../../data-access/agents-api.service';
import { UserReference } from '../../../../core/api/api.models';
@Component({
  selector: 'app-agent-directory-page',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-directory-page.component.html',
  styleUrl: './agent-directory-page.component.scss',
})
export class AgentDirectoryPageComponent {
  private readonly api = inject(AgentsApiService);
  readonly agents = signal<UserReference[]>([]);
  readonly error = signal('');
  constructor() { this.api.list().subscribe({ next: ({ results }) => this.agents.set(results), error: () => this.error.set('No se pudo cargar el directorio de asesores.') }); }
}
