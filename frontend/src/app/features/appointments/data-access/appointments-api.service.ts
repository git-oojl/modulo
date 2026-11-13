import { Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService extends ApiClientService {
  // TODO(appointments): add filters, result and ICS export operations.
  readonly resource = `${this.apiRoot}/appointments`;
}
