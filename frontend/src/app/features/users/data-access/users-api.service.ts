import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse, UserReference } from '../../../core/api/api.models';

export interface UserDto extends UserReference { username: string; first_name?: string; last_name?: string; email: string; is_active: boolean; profile: { phone: string; license_number: string; active: boolean } | null; }
export interface AccessRequestDto { id: string; name: string; email: string; phone: string; requested_role: string; comments: string; status: 'pendiente' | 'aprobada' | 'rechazada'; created_at: string; reviewed_at: string | null; }

@Injectable({ providedIn: 'root' })
export class UsersApiService extends ApiClientService {
  list(): Observable<PaginatedResponse<UserDto>> { return this.http.get<PaginatedResponse<UserDto>>(`${this.apiRoot}/users/`); }
  create(payload: Partial<UserDto> & { password?: string }): Observable<UserDto> { return this.http.post<UserDto>(`${this.apiRoot}/users/`, payload); }
  update(id: string, payload: Partial<UserDto> & { password?: string }): Observable<UserDto> { return this.http.patch<UserDto>(`${this.apiRoot}/users/${id}/`, payload); }
  listRequests(): Observable<PaginatedResponse<AccessRequestDto>> { return this.http.get<PaginatedResponse<AccessRequestDto>>(`${this.apiRoot}/users/access-requests/`); }
  approveRequest(id: string): Observable<AccessRequestDto> { return this.http.post<AccessRequestDto>(`${this.apiRoot}/users/access-requests/${id}/approve/`, {}); }
  rejectRequest(id: string): Observable<AccessRequestDto> { return this.http.post<AccessRequestDto>(`${this.apiRoot}/users/access-requests/${id}/reject/`, {}); }
}
