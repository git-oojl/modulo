import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavigationComponent } from './layout/main-navigation/main-navigation.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNavigationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
