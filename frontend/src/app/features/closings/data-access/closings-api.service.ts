import { Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';

@Injectable({ providedIn: 'root' })
export class ClosingsApiService extends ApiClientService {
  // TODO(closings): add permitted creation, correction, cancellation and commission operations.
  readonly resource = `${this.apiRoot}/closings`;
}
