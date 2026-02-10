import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
  userName = 'John Doe';
  userRole = 'Administrator';
  profileImage = '';
  isSidebarOpen = false;
  private sidebarSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load user data from AuthService
    this.loadUserData();
    
    // Subscribe to auth state changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.userRole = user.role || 'User';
        this.profileImage = '';
      } else {
        this.userName = 'Guest User';
        this.userRole = 'Guest';
        this.profileImage = '';
      }
    });
    
    // Listen for sidebar toggle events
    window.addEventListener('sidebar-toggle', this.handleSidebarToggle.bind(this));
  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    window.removeEventListener('sidebar-toggle', this.handleSidebarToggle.bind(this));
  }

  loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = `${currentUser.firstName} ${currentUser.lastName}`;
      this.userRole = currentUser.role || 'User';
      this.profileImage = '';
    } else {
      this.userName = 'Guest User';
      this.userRole = 'Guest';
      this.profileImage = '';
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    // Emit custom event for sidebar component to listen to
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { 
      detail: { isOpen: this.isSidebarOpen } 
    }));
  }

  private handleSidebarToggle(event: any): void {
    this.isSidebarOpen = event.detail.isOpen;
  }

  logout(): void {
    // Use AuthService to logout
    this.authService.logout();
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  viewProfile(): void {
    this.closeDropdown();
    this.router.navigate(['/profile']);
  }

  settings(): void {
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }

  // Helper method to get user initials
  getUserInitials(): string {
    if (!this.userName) return 'U';
    const names = this.userName.split(' ');
    if (names.length >= 2) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return this.userName.substring(0, 2).toUpperCase();
  }
}
