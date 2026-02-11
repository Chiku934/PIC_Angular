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
  Description?: string;
  Children?: Application[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: any = null;
  applications: Application[] = [];
  displayApplications: Application[] = [];

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
        this.displayApplications = this.getDefaultApplications();
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
          this.displayApplications = this.applications.length > 0 ? this.applications : this.getDefaultApplications();
          this.cdr.detectChanges(); // Force change detection
        },
        error: (error) => {
          this.applications = [];
          this.displayApplications = this.getDefaultApplications();
        }
      });
    } else {
      this.applications = [];
      this.displayApplications = this.getDefaultApplications();
    }
  }

  getDefaultApplications(): Application[] {
    return [
      {
        Id: 1,
        ApplicationName: 'Audit',
        Url: '/audit',
        IconImageUrl: '/assets/icons/audit.png',
        Description: 'Audit management system'
      },
      {
        Id: 2,
        ApplicationName: 'Certification',
        Url: '/certification',
        IconImageUrl: '/assets/icons/certification.png',
        Description: 'Certificate management system'
      },
      {
        Id: 3,
        ApplicationName: 'Setup',
        Url: '/setup',
        IconImageUrl: '/assets/icons/setup.png',
        Description: 'System configuration and setup'
      }
    ];
  }

  getAppIcon(appName: string): string {
    const iconMap: { [key: string]: string } = {
      'Audit': '/assets/icons/audit.png',
      'Certification': '/assets/icons/certification.png',
      'Setup': '/assets/icons/setup.png'
    };

    return iconMap[appName] || '/assets/images/default-app-icon.png';
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

  // Additional methods for enhanced home page
  getDisplayName(): string {
    if (!this.currentUser) return 'User';
    
    if (this.currentUser.displayName) {
      return this.currentUser.displayName;
    }
    
    const firstName = this.currentUser.firstName || this.currentUser.FirstName || '';
    const lastName = this.currentUser.lastName || this.currentUser.LastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    }
    
    return this.currentUser.username || 'User';
  }

  getGreeting(): string {
    const currentHour = new Date().getHours();
    
    if (currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  onImageError(event: any) {
    event.target.src = '/assets/images/default-app-icon.png';
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  refreshApplications() {
    this.loadUserMenu();
  }
}
