import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UsersApiService, AccessRequestDto } from '../../data-access/users-api.service';

type RequestFilter = 'pendientes' | 'todas';

@Component({
  selector: 'app-access-request-list-page',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-request-list-page.component.html',
  styleUrl: './access-request-list-page.component.scss',
})
export class AccessRequestListPageComponent {
  private readonly usersApi = inject(UsersApiService);
  readonly filter = signal<RequestFilter>('pendientes');
  readonly requests = signal<AccessRequestDto[]>([]);
  readonly error = signal('');
  constructor() { this.reload(); }
  readonly pendingCount = computed(
    () => this.requests().filter((request) => request.status === 'pendiente').length,
  );
  readonly visibleRequests = computed(() => {
    const requests = this.requests();
    return this.filter() === 'pendientes'
      ? requests.filter((request) => request.status === 'pendiente')
      : requests;
  });

  setFilter(filter: RequestFilter): void {
    this.filter.set(filter);
  }

  reload(): void { this.usersApi.listRequests().subscribe({ next: ({ results }) => this.requests.set(results), error: () => this.error.set('No se pudieron cargar las solicitudes.') }); }
  updateStatus(id: string, status: 'aprobada' | 'rechazada'): void {
    const request = status === 'aprobada' ? this.usersApi.approveRequest(id) : this.usersApi.rejectRequest(id);
    request.subscribe({ next: (updated) => this.requests.update((items) => items.map((item) => item.id === id ? updated : item)), error: () => this.error.set('No se pudo actualizar la solicitud.') });
  }
}
