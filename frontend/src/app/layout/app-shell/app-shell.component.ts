import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavigationComponent } from '../main-navigation/main-navigation.component';

@Component({
  selector: 'app-shell',
  imports: [MainNavigationComponent, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {}
