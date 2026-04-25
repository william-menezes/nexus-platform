import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-auth-shell',
  imports: [RouterOutlet],
  templateUrl: './auth-shell.component.html',
})
export class AuthShellComponent {}
