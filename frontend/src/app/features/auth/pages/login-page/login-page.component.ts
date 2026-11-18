import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  showPassword = false;
  loginMessage = '';

  submitLogin(event: SubmitEvent): void {
    event.preventDefault();
    this.loginMessage = 'El servicio de acceso aún no está conectado.';
  }
}
