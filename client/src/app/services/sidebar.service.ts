import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly STORAGE_KEY = 'sidebarCollapsed';

  // Initialize with stored preference if available, otherwise use default
  private collapsedSubject = new BehaviorSubject<boolean>(this.getInitialState());
  public isCollapsed$: Observable<boolean> = this.collapsedSubject.asObservable();

  constructor() {
    // Listen for window resize to adjust sidebar state on screen size changes
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        // If user has a saved preference, do not override it on resize
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved !== null) return;

        // Use 1200px breakpoint for responsiveness when no user preference
        if (window.innerWidth > 1200) {
          // For screens more than 1200px, use default expanded state
          this.collapsedSubject.next(false);
          this.updateBodyClass(false);
        } else {
          // For screens 1200px and below, ensure collapsed state
          this.collapsedSubject.next(true);
          this.updateBodyClass(true);
        }
      });
    }
    
    // Make sure body class reflects the initial sidebar state
    this.updateBodyClass(this.collapsedSubject.value);
  }

  private getInitialState(): boolean {
    if (typeof window !== 'undefined') {
      // Check if user has a saved preference
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
      // No saved preference, use responsive default
      const defaultState = this.getDefaultState();
      return defaultState;
    }
    return true; // Default to collapsed for SSR
  }

  private getDefaultState(): boolean {
    // On screens more than 1200px, start with sidebar expanded (collapsed = false)
    // On screens 1200px and below, start with sidebar collapsed (collapsed = true)
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth <= 1200;
      return isSmallScreen; // true for mobile (collapsed), false for desktop (expanded)
    }
    return true; // Default to collapsed for SSR
  }

  /**
   * Initialize responsive sidebar state based on screen size
   * This should be called when the app starts or when switching to setup pages
   * Only applies if user has no saved preference
   */
  initializeResponsiveState() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === null) {
        // No user preference saved, use responsive defaults
        const defaultState = this.getDefaultState();
        this.collapsedSubject.next(defaultState);
        this.updateBodyClass(defaultState);
      } else {
        // User has a saved preference, respect it
        const savedState = saved === 'true';
        this.collapsedSubject.next(savedState);
        this.updateBodyClass(savedState);
      }
    }
  }

  /**
   * Initialize sidebar state for setup pages
   * This ensures setup pages show the correct menu items regardless of saved preference
   */
  initializeSetupState() {
    if (typeof window !== 'undefined') {
      // For setup pages, always use responsive defaults regardless of saved preference
      // This ensures users see the correct menu items for setup pages
      const defaultState = this.getDefaultState();
      this.collapsedSubject.next(defaultState);
      this.updateBodyClass(defaultState);
      
      // Note: We don't save this to localStorage to avoid overriding user preference
      // when they navigate back to other pages
    }
  }

  /**
   * Toggle sidebar state and persist user preference
   */
  toggle() {
    const current = this.collapsedSubject.value;
    const next = !current;
    this.collapsedSubject.next(next);
    this.updateBodyClass(next);
    
    // Persist user preference
    try { 
      localStorage.setItem(this.STORAGE_KEY, String(next)); 
    } catch (e) {
    }
  }

  /**
   * Collapse sidebar and persist user preference
   */
  collapse() {
    this.collapsedSubject.next(true);
    this.updateBodyClass(true);
    
    try { 
      localStorage.setItem(this.STORAGE_KEY, 'true'); 
    } catch (e) {
    }
  }

  /**
   * Expand sidebar and persist user preference
   */
  expand() {
    this.collapsedSubject.next(false);
    this.updateBodyClass(false);
    
    try { 
      localStorage.setItem(this.STORAGE_KEY, 'false'); 
    } catch (e) {
    }
  }

  /**
   * Clear any stored user preference and reset to default responsive state
   * This forces the sidebar to respect screen size breakpoints again
   */
  clearPreference() {
    try { 
      localStorage.removeItem(this.STORAGE_KEY); 
    } catch (e) {
    }
    
    const defaultState = this.getDefaultState();
    this.collapsedSubject.next(defaultState);
    this.updateBodyClass(defaultState);
  }

  /**
   * Synchronously return current collapsed state
   */
  getState(): boolean {
    return this.collapsedSubject.value;
  }

  /**
   * Check if user has a saved preference
   */
  hasSavedPreference(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
    return false;
  }

  /**
   * Update body class to reflect sidebar state
   * This allows global CSS to respond to sidebar state
   */
  private updateBodyClass(isCollapsed: boolean) {
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (isCollapsed) {
        body.classList.add('sidebar-collapsed');
      } else {
        body.classList.remove('sidebar-collapsed');
      }
    }
  }
}