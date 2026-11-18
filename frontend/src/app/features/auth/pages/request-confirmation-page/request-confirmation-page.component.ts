import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-request-confirmation-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-confirmation-page.component.html',
  styleUrl: './request-confirmation-page.component.scss',
})
export class RequestConfirmationPageComponent {}
