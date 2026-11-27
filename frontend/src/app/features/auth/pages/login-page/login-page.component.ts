import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  showPassword = false;
  loginMessage = '';
  isSubmitting = false;

  submitLogin(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    this.isSubmitting = true;
    this.loginMessage = '';
    this.auth
      .login(String(data.get('username') ?? ''), String(data.get('password') ?? ''))
      .subscribe({
        next: () => void this.router.navigateByUrl('/app/dashboard'),
        error: () => {
          this.isSubmitting = false;
          this.loginMessage = 'No pudimos iniciar sesión. Revisa tus credenciales.';
        },
      });
  }
}
