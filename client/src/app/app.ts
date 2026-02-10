import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-container">
      <ng-container *ngIf="shouldShowLayout">
        <app-header></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
      </ng-container>
      
      <ng-container *ngIf="!shouldShowLayout">
        <router-outlet></router-outlet>
      </ng-container>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding: 20px 0;
    }

    :host {
      display: block;
      width: 100%;
      height: 100vh;
    }
  `]
})
export class AppComponent {
  title = 'PIC Certificate System';
  shouldShowLayout = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Subscribe to route changes to determine if layout should be shown
    this.router.events.subscribe(() => {
      this.updateLayoutVisibility();
    });

    // Initial check
    this.updateLayoutVisibility();
  }

  private updateLayoutVisibility(): void {
    const currentUrl = this.router.url;
    
    // Don't show layout on login and register pages
    const noLayoutRoutes = ['/login', '/register'];
    this.shouldShowLayout = !noLayoutRoutes.some(route => currentUrl.includes(route));
  }
}
