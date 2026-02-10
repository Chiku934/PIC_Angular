import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div>
      <h1>PIC System</h1>
      <p>Application is running!</p>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class SimpleAppComponent {
  title = 'PIC System';
}
