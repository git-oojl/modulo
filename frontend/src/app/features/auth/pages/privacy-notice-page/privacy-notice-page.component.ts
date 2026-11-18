import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-notice-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-notice-page.component.html',
  styleUrl: './privacy-notice-page.component.scss',
})
export class PrivacyNoticePageComponent {}
