import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse } from '../../../core/api/api.models';

export interface OrganizationDto { id: string; name: string; legal_name: string; logo: string; timezone: string; default_language: string; currency: string; public_catalogue_enabled: boolean; }
export interface LeadSourceDto { id: string; name: string; active: boolean; sort_order: number; }

@Injectable({ providedIn: 'root' })
export class OrganizationApiService extends ApiClientService {
  get(): Observable<OrganizationDto> { return this.http.get<OrganizationDto>(`${this.apiRoot}/organization/`); }
  update(payload: Partial<OrganizationDto>): Observable<OrganizationDto> { return this.http.patch<OrganizationDto>(`${this.apiRoot}/organization/`, payload); }
  listSources(): Observable<PaginatedResponse<LeadSourceDto>> { return this.http.get<PaginatedResponse<LeadSourceDto>>(`${this.apiRoot}/sources/`); }
  createSource(payload: Pick<LeadSourceDto, 'name' | 'active' | 'sort_order'>): Observable<LeadSourceDto> { return this.http.post<LeadSourceDto>(`${this.apiRoot}/sources/`, payload); }
  updateSource(id: string, payload: Partial<LeadSourceDto>): Observable<LeadSourceDto> { return this.http.patch<LeadSourceDto>(`${this.apiRoot}/sources/${id}/`, payload); }
  deleteSource(id: string): Observable<void> { return this.http.delete<void>(`${this.apiRoot}/sources/${id}/`); }
}
