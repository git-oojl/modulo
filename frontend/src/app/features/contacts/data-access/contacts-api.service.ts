import { Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';
import { Contact } from '../models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactsApiService extends ApiClientService {
  // TODO(contacts): expose typed list, detail, create, update, activity and interest requests.
  readonly resource = `${this.apiRoot}/contacts`;
  declare readonly example: Contact;
}
