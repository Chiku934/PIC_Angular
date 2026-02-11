import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
import { CompanyService, CompanyDetails } from '../../../services/company.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  currentCompany: CompanyDetails | null = null;
  isCollapsed = false;
  isMobileOpen = false;
  private sidebarSubscription!: Subscription;
  private mobileSubscription!: Subscription;

  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    public sidebarService: SidebarService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    // Subscribe to company data changes
    this.companyService.getCurrentCompanyObservable().subscribe(company => {
      this.currentCompany = company;
      this.cdr.detectChanges();
    });

    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarService.isCollapsed$.subscribe(isCollapsed => {
      this.isCollapsed = isCollapsed;
      this.cdr.detectChanges();
    });

    // Subscribe to route changes to update menu items
    this.mobileSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.initializeMenuItems();
    });

    // Initialize menu items based on current route
    this.initializeMenuItems();

    // Initialize responsive state based on screen size
    this.initializeResponsiveState();
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.mobileSubscription) {
      this.mobileSubscription.unsubscribe();
    }
  }

  // Handle window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.initializeResponsiveState();
  }

  private initializeResponsiveState() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1200) {
      // Mobile: collapsed by default
      this.sidebarService.collapse();
      this.isMobileOpen = false;
    } else {
      // Desktop: expanded by default
      this.sidebarService.expand();
      this.isMobileOpen = false;
    }
  }

  private initializeMenuItems() {
    const currentUrl = this.router.url;

    if (currentUrl.startsWith('/setup')) {
      // Setup pages menu
      this.menuItems = [
        {
          label: 'Setup',
          icon: 'fas fa-cog',
          route: '/setup'
        },
        {
          label: 'Company Setting',
          icon: 'fas fa-building',
          children: [
            { label: 'Company List', icon: 'fas fa-building', route: '/setup/company' }
          ],
          isExpanded: false
        },
        {
          label: 'User',
          icon: 'fas fa-users',
          children: [
            { label: 'User List', icon: 'fas fa-user-friends', route: '/setup/users' }
          ],
          isExpanded: false
        }
      ];
      
      // Initialize sidebar state for setup pages to ensure correct menu display
      this.sidebarService.initializeSetupState();
    } else {
      // Default menu for other pages
      this.menuItems = [
        {
          label: 'Certification',
          icon: 'fas fa-certificate',
          route: '/certification'
        },
        {
          label: 'Audit',
          icon: 'fas fa-clipboard-check',
          route: '/audit'
        }
      ];
      
      // Initialize responsive state for non-setup pages
      this.sidebarService.initializeResponsiveState();
    }

    this.cdr.detectChanges();
  }

  toggleSubmenu(item: MenuItem) {
    if (item.children) {
      item.isExpanded = !item.isExpanded;
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
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

    // Priority 1: Use pre-formatted displayName if available (highest priority)
    if (this.currentUser.displayName) {
      return this.currentUser.displayName;
    }

    // Priority 2: Construct from first/last name
    const firstName = this.currentUser.firstName || this.currentUser.FirstName || this.currentUser.name || '';
    const lastName = this.currentUser.lastName || this.currentUser.LastName || '';
    
    const combinedName = `${firstName} ${lastName}`.trim();
    if (combinedName) {
      return combinedName;
    }

    // Fallback to username or a default
    return this.currentUser.username || 'User';
  }

  hasProfileImage(): boolean {
    return !!this.currentUser?.UserImage && this.currentUser.UserImage !== '/assets/images/default-profile-icon.png';
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

  getCompanyLogoUrl(): string {
    if (this.currentCompany?.CompanyLogo) {
      // Ensure the image path is absolute for proper display
      if (this.currentCompany.CompanyLogo.startsWith('http')) {
        return this.currentCompany.CompanyLogo;
      }

      // Construct absolute URL based on current origin
      const currentOrigin = window.location.origin;
      const backendPort = ':3000'; // Backend runs on port 3000

      // If frontend is running on different port, use backend port
      if (!currentOrigin.includes(':3000')) {
        const backendUrl = currentOrigin.replace(/:\d+$/, backendPort);
        return `${backendUrl}${this.currentCompany.CompanyLogo}`;
      } else {
        return `${currentOrigin}${this.currentCompany.CompanyLogo}`;
      }
    }
    return '/assets/logos/PIC_Logo-removebg-preview.png'; // Default logo
  }

  onLogoError(event: any) {
    event.target.src = '/assets/logos/PIC_Logo-removebg-preview.png'; // Fallback to default logo
  }
}
