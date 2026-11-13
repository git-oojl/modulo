import { Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';

@Injectable({ providedIn: 'root' })
export class PropertiesApiService extends ApiClientService {
  // TODO(properties): add typed inventory, media and visibility operations.
  readonly resource = `${this.apiRoot}/properties`;
}
