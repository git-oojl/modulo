import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse, UserReference } from '../../../core/api/api.models';

export interface PropertyMediaDto {
  id: string;
  file: string;
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
}

export interface PropertyDto {
  id: string;
  title: string;
  description: string;
  type: 'casa' | 'departamento' | 'terreno' | 'oficina' | 'comercial' | 'otro';
  operation: 'venta' | 'renta';
  status: 'borrador' | 'activa' | 'reservada' | 'cerrada' | 'archivada';
  price: string;
  currency: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  public_location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  area_m2: string | null;
  land_area_m2: string | null;
  features: string[];
  advisor: UserReference | null;
  is_public: boolean;
  media: PropertyMediaDto[];
}

export type PropertyPayload = Omit<PropertyDto, 'id' | 'advisor' | 'media'> & { advisor_id?: string | null };

@Injectable({ providedIn: 'root' })
export class PropertiesApiService extends ApiClientService {
  readonly resource = `${this.apiRoot}/properties`;

  list(filters: Record<string, string | undefined> = {}): Observable<PaginatedResponse<PropertyDto>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value?.trim()) params = params.set(key, value.trim());
    return this.http.get<PaginatedResponse<PropertyDto>>(`${this.resource}/`, { params });
  }

  get(id: string): Observable<PropertyDto> { return this.http.get<PropertyDto>(`${this.resource}/${id}/`); }
  create(payload: Partial<PropertyPayload>): Observable<PropertyDto> { return this.http.post<PropertyDto>(`${this.resource}/`, payload); }
  update(id: string, payload: Partial<PropertyPayload>): Observable<PropertyDto> { return this.http.patch<PropertyDto>(`${this.resource}/${id}/`, payload); }
  archive(id: string): Observable<void> { return this.http.delete<void>(`${this.resource}/${id}/`); }

  uploadMedia(id: string, file: File, altText = '', isCover = false): Observable<PropertyMediaDto> {
    const form = new FormData();
    form.set('file', file);
    form.set('alt_text', altText);
    form.set('is_cover', String(isCover));
    return this.http.post<PropertyMediaDto>(`${this.resource}/${id}/media/`, form);
  }

  updateMedia(id: string, mediaId: string, payload: Partial<Pick<PropertyMediaDto, 'alt_text' | 'sort_order' | 'is_cover'>>): Observable<PropertyMediaDto> {
    return this.http.patch<PropertyMediaDto>(`${this.resource}/${id}/media/${mediaId}/`, payload);
  }

  deleteMedia(id: string, mediaId: string): Observable<void> { return this.http.delete<void>(`${this.resource}/${id}/media/${mediaId}/`); }
}
