import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserDto, UsersApiService } from '../../data-access/users-api.service';
@Component({
  selector: 'app-user-list-page',
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list-page.component.html',
  styleUrl: './user-list-page.component.scss',
})
export class UserListPageComponent {
  private readonly api = inject(UsersApiService);
  readonly users = signal<UserDto[]>([]);
  readonly error = signal('');
  readonly creating = signal(false);
  form: { username: string; first_name: string; last_name: string; email: string; role: UserDto['role']; password: string } = { username: '', first_name: '', last_name: '', email: '', role: 'asesor', password: '' };
  constructor() { this.load(); }
  load(): void { this.api.list().subscribe({ next: ({ results }) => this.users.set(results), error: () => this.error.set('No se pudieron cargar los usuarios.') }); }
  save(): void {
    this.api.create(this.form).subscribe({ next: () => { this.form = { username: '', first_name: '', last_name: '', email: '', role: 'asesor', password: '' }; this.creating.set(false); this.load(); }, error: () => this.error.set('No se pudo crear el usuario. Revisa usuario, correo y contraseña.') });
  }
  toggle(user: UserDto): void { this.api.update(user.id, { is_active: !user.is_active }).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo actualizar el usuario.') }); }
}
