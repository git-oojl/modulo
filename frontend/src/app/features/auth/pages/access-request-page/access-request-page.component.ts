import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccessRequestApiService } from '../../data-access/access-request-api.service';

@Component({
  selector: 'app-access-request-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-request-page.component.html',
  styleUrl: './access-request-page.component.scss',
})
export class AccessRequestPageComponent {
  private readonly router = inject(Router);
  private readonly requests = inject(AccessRequestApiService);
  readonly error = signal('');
  readonly submitting = signal(false);

  submitRequest(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    this.error.set('');
    this.submitting.set(true);
    this.requests.create({
      name: String(data.get('fullName') ?? '').trim(), email: String(data.get('email') ?? '').trim(), phone: String(data.get('phone') ?? '').trim(),
      requested_role: String(data.get('requestedRole') ?? 'asesor') as 'asesor' | 'gerencia' | 'administrador', comments: String(data.get('comments') ?? '').trim(), privacy_accepted: data.get('consent') === 'on',
    }).subscribe({ next: () => void this.router.navigateByUrl('/solicitud-enviada'), error: () => { this.error.set('No se pudo enviar la solicitud. Revisa los campos e inténtalo de nuevo.'); this.submitting.set(false); } });
  }
}
