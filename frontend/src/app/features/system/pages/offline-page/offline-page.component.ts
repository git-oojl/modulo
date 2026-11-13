import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-offline-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offline-page.component.html',
  styleUrl: './offline-page.component.scss',
})
export class OfflinePageComponent {}
