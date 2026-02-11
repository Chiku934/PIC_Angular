import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isDropdownOpen = false;
  isMobileOpen = false;
  isLoginPage = false;
  isSetupPage = false;
  isDashboardPage = false;
  private authSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private sidebarSubscription!: Subscription;
  public sidebarService: SidebarService;

  constructor(
    public authService: AuthService,
    sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.sidebarService = sidebarService;
  }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Trigger change detection when user data changes
      this.cdr.detectChanges();
    });

    this.routerSubscription = this.router.events.subscribe(() => {
      this.isLoginPage = this.router.url === '/login';
      this.isSetupPage = this.router.url.includes('/setup');
      this.isDashboardPage = this.router.url === '/dashboard' || this.router.url === '/';
    });

    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarService.isCollapsed$.subscribe(isCollapsed => {
      // We don't directly use this in header, but we could if needed
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    // Simple toggle: let the service handle persistence and state
    this.sidebarService.toggle();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  getProfileImageUrl(): string {
    if (this.currentUser?.UserImage) {
      // Ensure the image path is absolute for proper display
      if (this.currentUser.UserImage.startsWith('http')) {
        return this.currentUser.UserImage;
      }
      
      // Construct absolute URL based on current origin
      const currentOrigin = window.location.origin;
      const backendPort = ':3000'; // Backend runs on port 3000
      
      // If frontend is running on different port, use backend port
      if (!currentOrigin.includes(':3000')) {
        const backendUrl = currentOrigin.replace(/:\d+$/, backendPort);
        return `${backendUrl}${this.currentUser.UserImage}`;
      } else {
        return `${currentOrigin}${this.currentUser.UserImage}`;
      }
    }
    return '/assets/images/default-profile-icon.png';
  }

  onImageError(event: any) {
    event.target.src = '/assets/images/default-profile-icon.png';
  }

  hasProfileImage(): boolean {
    return !!this.currentUser?.UserImage && this.currentUser.UserImage !== '/assets/images/default-profile-icon.png';
  }

  navigateToProfile() {
    this.closeDropdown();
    this.router.navigate(['/profile']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  getGreeting(): string {
    const currentHour = new Date().getHours();
    let greeting = '';
    
    if (currentHour < 12) {
      greeting = 'Good Morning';
    } else if (currentHour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    // Add user role if available
    if (this.currentUser) {
      // Try to get role from different possible properties
      const role = this.currentUser.role || 
                   this.currentUser.userRole || 
                   this.currentUser.roleName || 
                   this.currentUser.userType || 
                   'User';
      
      // Format role with proper capitalization
      const formattedRole = this.formatRole(role);
      return `${greeting}, ${formattedRole}`;
    }
    
    return greeting;
  }

  private formatRole(role: string): string {
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

  getDisplayName(): string {
    if (!this.currentUser) {
      return 'User';
    }
    
    // Priority 1: Use pre-formatted displayName if available (highest priority)
    if (this.currentUser.displayName) {
      return this.currentUser.displayName;
    }
    
    // Priority 2: Try to get full name from different possible properties
    const firstName = this.currentUser.firstName || this.currentUser.FirstName || this.currentUser.name || '';
    const lastName = this.currentUser.lastName || this.currentUser.LastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    // Fallback to email or username
    return this.currentUser.email || this.currentUser.username || 'User';
  }

  getUserInitials(): string {
    if (!this.currentUser) {
      return 'U';
    }
    
    const firstName = this.currentUser.firstName || this.currentUser.name || '';
    const lastName = this.currentUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    // Fallback to first letters of email or username
    const email = this.currentUser.email || this.currentUser.username || '';
    if (email) {
      const parts = email.split('@');
      const namePart = parts[0];
      const nameParts = namePart.split('.');
      
      if (nameParts.length > 1) {
        return `${nameParts[0].charAt(0).toUpperCase()}${nameParts[1].charAt(0).toUpperCase()}`;
      } else {
        return namePart.charAt(0).toUpperCase();
      }
    }
    
    return 'U';
  }
}
