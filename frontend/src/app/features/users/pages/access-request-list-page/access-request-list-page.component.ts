import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type RequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';
type RequestFilter = 'pendientes' | 'todas';

interface AccessRequest {
  id: number;
  name: string;
  email: string;
  position: string;
  date: string;
  status: RequestStatus;
}

@Component({
  selector: 'app-access-request-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-request-list-page.component.html',
  styleUrl: './access-request-list-page.component.scss',
})
export class AccessRequestListPageComponent {
  readonly filter = signal<RequestFilter>('pendientes');
  readonly requests = signal<AccessRequest[]>([
    {
      id: 1,
      name: 'Ana López',
      email: 'ana.lopez@gmail.com',
      position: 'Asesora',
      date: '14 nov 2026',
      status: 'Pendiente',
    },
    {
      id: 2,
      name: 'Carlos Méndez',
      email: 'carlos.mendez@gmail.com',
      position: 'Gerencia',
      date: '13 nov 2026',
      status: 'Pendiente',
    },
    {
      id: 3,
      name: 'Lucía Ramírez',
      email: 'lucia.ramirez@gmail.com',
      position: 'Asesora',
      date: '12 nov 2026',
      status: 'Pendiente',
    },
    {
      id: 4,
      name: 'Diego Torres',
      email: 'diego.torres@gmail.com',
      position: 'Administración',
      date: '10 nov 2026',
      status: 'Aprobada',
    },
    {
      id: 5,
      name: 'Sofía Castillo',
      email: 'sofia.castillo@gmail.com',
      position: 'Asesora',
      date: '08 nov 2026',
      status: 'Rechazada',
    },
  ]);
  readonly pendingCount = computed(
    () => this.requests().filter((request) => request.status === 'Pendiente').length,
  );
  readonly visibleRequests = computed(() => {
    const requests = this.requests();
    return this.filter() === 'pendientes'
      ? requests.filter((request) => request.status === 'Pendiente')
      : requests;
  });

  setFilter(filter: RequestFilter): void {
    this.filter.set(filter);
  }

  updateStatus(id: number, status: Exclude<RequestStatus, 'Pendiente'>): void {
    this.requests.update((requests) =>
      requests.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  }
}
