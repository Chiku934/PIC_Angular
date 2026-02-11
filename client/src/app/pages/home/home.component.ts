import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Application {
  Id: number;
  ApplicationName: string;
  Url?: string;
  IconImageUrl?: string;
  IconClass?: string;
  Children?: Application[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  applications: Application[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUserMenu();
      } else {
        this.applications = [];
      }
    });
  }

  loadUserMenu() {
    const token = this.authService.getToken();
    if (token) {
      this.http.get<Application[]>('/api/users/menu', {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (apps) => {
          this.applications = (apps || []).map(app => ({
            ...app,
            IconImageUrl: this.getAppIcon(app.ApplicationName)
          }));
          this.cdr.detectChanges(); // Force change detection
        },
        error: (error) => {
          this.applications = [];
        }
      });
    } else {
      this.applications = [];
    }
  }

  getAppIcon(appName: string): string {
    const iconMap: { [key: string]: string } = {
      'Audit': '/assets/icons/audit.png',
      'Certification': '/assets/icons/certification.png',
      'Setup': '/assets/icons/setup.png'
    };

    return iconMap[appName] || '/assets/images/default-profile-icon.png';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToApp(app: Application) {
    if (app.Url) {
      // Handle navigation based on URL
      if (app.Url.startsWith('/')) {
        this.router.navigate([app.Url]);
      } else {
        window.open(app.Url, '_blank');
      }
    }
  }

  trackByAppId(index: number, app: Application): number {
    return app.Id;
  }
}
