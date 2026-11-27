import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  PublicProperty,
  PublicPropertyOperation,
  PublicPropertyType,
} from '../models/public-property.model';

export interface PublicCatalogueFilters {
  search?: string;
  operation?: PublicPropertyOperation | 'todas';
  type?: PublicPropertyType | 'todos';
}

interface PublicPropertyResponse {
  id: string;
  title: string;
  operation: PublicPropertyOperation;
  type: PublicPropertyType;
  price: number;
  currency: 'MXN' | 'USD';
  public_location: string;
  bedrooms?: number;
  bathrooms?: number;
  area_m2: number;
  cover_image_url: string;
}

interface PaginatedResponse<T> {
  results: T[];
}

/** Public endpoint client. Never reuse private property serializers here. */
@Injectable({ providedIn: 'root' })
export class PublicCatalogueApiService extends ApiClientService {
  readonly resource = `${this.apiRoot}/public/properties`;

  listPublishedProperties(filters: PublicCatalogueFilters = {}): Observable<PublicProperty[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('q', filters.search.trim());
    }
    if (filters.operation && filters.operation !== 'todas') {
      params = params.set('operation', filters.operation);
    }
    if (filters.type && filters.type !== 'todos') {
      params = params.set('type', filters.type);
    }

    return this.http
      .get<PaginatedResponse<PublicPropertyResponse>>(`${this.resource}/`, { params })
      .pipe(map(({ results }) => results.map((property) => this.toPublicProperty(property))));
  }

  getPublishedProperty(id: string): Observable<PublicPropertyResponse & { description: string; parking_spaces: number | null; land_area_m2: number | null; features: string[]; media: { id: string; file: string; alt_text: string; is_cover: boolean }[] }> {
    return this.http.get<PublicPropertyResponse & { description: string; parking_spaces: number | null; land_area_m2: number | null; features: string[]; media: { id: string; file: string; alt_text: string; is_cover: boolean }[] }>(this.resource + '/' + id + '/');
  }

  createInquiry(payload: { property: string; name: string; phone: string; email?: string; message?: string; privacy_accepted: boolean }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiRoot + '/public/inquiries/', payload);
  }

  private toPublicProperty(property: PublicPropertyResponse): PublicProperty {
    return {
      id: property.id,
      title: property.title,
      operation: property.operation,
      type: property.type,
      price: property.price,
      currency: property.currency,
      publicLocation: property.public_location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaM2: property.area_m2,
      coverImageUrl: property.cover_image_url,
    };
  }
}
