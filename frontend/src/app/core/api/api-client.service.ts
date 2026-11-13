import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

/** Single future entry point for typed calls to the versioned Django API. */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  protected readonly http = inject(HttpClient);
  protected readonly apiRoot = '/api/v1';
}
