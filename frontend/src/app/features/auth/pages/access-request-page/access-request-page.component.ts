import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-request-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-request-page.component.html',
  styleUrl: './access-request-page.component.scss',
})
export class AccessRequestPageComponent {
  constructor(private readonly router: Router) {}

  submitRequest(event: SubmitEvent): void {
    event.preventDefault();
    void this.router.navigateByUrl('/solicitud-enviada');
  }
}
