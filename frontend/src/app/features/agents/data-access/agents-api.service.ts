import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse, UserReference } from '../../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class AgentsApiService extends ApiClientService {
  list(): Observable<PaginatedResponse<UserReference>> { return this.http.get<PaginatedResponse<UserReference>>(`${this.apiRoot}/agents/`); }
}
