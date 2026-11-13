import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-forbidden-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forbidden-page.component.html',
  styleUrl: './forbidden-page.component.scss',
})
export class ForbiddenPageComponent {}
