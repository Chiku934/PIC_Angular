import { Component, signal, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { SidebarService } from './services/sidebar.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

// Menu item interface for TypeScript type safety
interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  isExpanded?: boolean;
  children?: MenuItem[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  public sidebarService: SidebarService;
  currentUser: any = null;

  menuItems: MenuItem[] = [
    {
      label: 'Setup',
      icon: 'fas fa-tachometer-alt',
      route: '/setup',
      isExpanded: false
    },
    {
      label: 'Company Setting',
      icon: 'fas fa-building',
      isExpanded: false,
      children: [
        { label: 'Company', icon: 'fas fa-building', route: '/setup/company' }
      ]
    },
    {
      label: 'User',
      icon: 'fas fa-users',
      isExpanded: false,
      children: [
        { label: 'User List', icon: 'fas fa-user-friends', route: '/setup/users' }
      ]
    }
  ];

  constructor(
    private router: Router,
    private titleService: Title,
    sidebarService: SidebarService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.sidebarService = sidebarService;
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const route = this.getCurrentRoute();
      const pageTitle = route?.snapshot?.data?.['title'] || '';
      const fullTitle = pageTitle ? `ERP - ${pageTitle}` : 'ERP - My Applications';
      this.titleService.setTitle(fullTitle);
      
      // Initialize responsive sidebar state when navigating
      if (this.showSidebar()) {
        this.sidebarService.initializeResponsiveState();
      }
    });

    // Subscribe to user data changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Trigger change detection when user data changes
      this.cdr.detectChanges();
      
      // Auto-redirect to dashboard if user is authenticated and on login page
      if (user && this.router.url === '/login') {
        this.router.navigate(['/dashboard']);
      }
    });

    // Force refresh user profile to ensure correct username is displayed
    // Delay the refresh to allow initial setup
    setTimeout(() => {
      this.authService.refreshUserProfile();
    }, 100);

    // Initialize responsive state on app load
    this.sidebarService.initializeResponsiveState();
  }

  // Handle window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.sidebarService.initializeResponsiveState();
  }

  private getCurrentRoute() {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  showSidebar(): boolean {
    const currentRoute = this.getCurrentRoute();
    const routePath = currentRoute?.routeConfig?.path || '';

    // Hide sidebar on login, register, dashboard, and profile pages
    return routePath !== 'login' && routePath !== 'register' && routePath !== 'dashboard' && routePath !== 'profile';
  }

  isDashboard(): boolean {
    const currentRoute = this.getCurrentRoute();
    const routePath = currentRoute?.routeConfig?.path || '';
    return routePath === 'dashboard';
  }

  isLoginLayout(): boolean {
    const currentRoute = this.getCurrentRoute();
    const routePath = currentRoute?.routeConfig?.path || '';
    return routePath === 'login' || routePath === 'register';
  }

  isProfileLayout(): boolean {
    const currentRoute = this.getCurrentRoute();
    const routePath = currentRoute?.routeConfig?.path || '';
    return routePath === 'profile';
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleSubmenu(item: any): void {
    item.isExpanded = !item.isExpanded;
  }

  getProfileImageUrl(): string {
    if (this.currentUser?.profileImage) {
      // Ensure the image path is absolute for proper display
      if (this.currentUser.profileImage.startsWith('http')) {
        return this.currentUser.profileImage;
      }

      // Construct absolute URL based on current origin
      const currentOrigin = window.location.origin;
      const backendPort = ':3000'; // Backend runs on port 3000

      // If frontend is running on different port, use backend port
      if (!currentOrigin.includes(':3000')) {
        const backendUrl = currentOrigin.replace(/:\d+$/, backendPort);
        return `${backendUrl}${this.currentUser.profileImage}`;
      } else {
        return `${currentOrigin}${this.currentUser.profileImage}`;
      }
    }
    return '/assets/images/default-profile-icon.png';
  }

  onImageError(event: any) {
    event.target.src = '/assets/images/default-profile-icon.png';
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    // Handle both property naming conventions and ensure it's a string
    let firstName = this.currentUser.firstName || 
                   this.currentUser.FirstName || 
                   this.currentUser.username || 
                   this.currentUser.UserName || '';
    
    // Ensure firstName is a string and not an object
    if (firstName && typeof firstName === 'string') {
      return firstName.charAt(0).toUpperCase();
    }
    return 'U'; // Default initial if no name available
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'User';

    // Priority 1: Use pre-formatted displayName if available
    if (this.currentUser.displayName) {
      return this.currentUser.displayName;
    }

    // Priority 2: Construct from first/last name
    const firstName = this.currentUser.firstName || this.currentUser.FirstName || '';
    const lastName = this.currentUser.lastName || this.currentUser.LastName || '';
    
    const combinedName = `${firstName} ${lastName}`.trim();
    if (combinedName) {
      return combinedName;
    }

    // Fallback to username or a default
    return this.currentUser.username || 'User';
  }

  hasProfileImage(): boolean {
    return !!this.currentUser?.profileImage && this.currentUser.profileImage !== '/assets/images/default-profile-icon.png';
  }

  formatRole(role: string): string {
    if (!role) return 'User';

    // Convert to title case and handle common role variations
    const roleStr = role.toString().toLowerCase();

    // Common role mappings
    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'administrator': 'Administrator',
      'superadmin': 'Super Admin',
      'super-admin': 'Super Admin',
      'super_admin': 'Super Admin',
      'user': 'User',
      'viewer': 'Viewer',
      'editor': 'Editor',
      'manager': 'Manager',
      'supervisor': 'Supervisor'
    };

    // Check if we have a mapped role
    if (roleMap[roleStr]) {
      return roleMap[roleStr];
    }

    // Default title case formatting
    return roleStr
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}