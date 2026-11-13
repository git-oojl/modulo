import { Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';

/** Public endpoint client. Never reuse private property serializers here. */
@Injectable({ providedIn: 'root' })
export class PublicCatalogueApiService extends ApiClientService {
  readonly resource = `${this.apiRoot}/public/properties`;
}
