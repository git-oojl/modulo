import { Component, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevViewSwitcherComponent } from './core/dev-tools/dev-view-switcher.component';

@Component({
  selector: 'app-root',
  imports: [DevViewSwitcherComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Never render developer controls in a production build. */
  readonly showDevTools = isDevMode();
}
