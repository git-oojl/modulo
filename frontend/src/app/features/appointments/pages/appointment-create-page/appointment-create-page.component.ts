import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-appointment-create-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-create-page.component.html',
  styleUrl: './appointment-create-page.component.scss',
})
export class AppointmentCreatePageComponent {
  guardarCita() {
    console.log('Guardando nueva cita...');
  }

  cancelar() {
    console.log('Cancelando...');
  }
}