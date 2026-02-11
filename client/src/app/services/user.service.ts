import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  UserId: number;
  Email: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  PhoneNo?: string;
  Address?: string;
  UserImage?: string;
  IsActive?: boolean;
  CreatedBy?: number;
  UpdatedBy?: number;
  DeletedBy?: number;
  IsDeleted?: boolean;
  CreatedDate?: string;
  UpdatedDate?: string;
  DeletedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';
  
  // BehaviorSubjects to hold the latest data
  private allUsers$ = new BehaviorSubject<User[]>([]);
  private activeUsers$ = new BehaviorSubject<User[]>([]);

  constructor(private http: HttpClient) {
    // Initial data fetch to populate lists
    this.fetchAllUsers();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersMultipart(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get all users with auto-refresh
   */
  getAllUsers(): Observable<User[]> {
    return this.allUsers$.asObservable();
  }

  /**
   * Get active users with auto-refresh
   */
  getActiveUsers(): Observable<User[]> {
    return this.activeUsers$.asObservable();
  }

  /**
   * Fetch single user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Create new user with optional file upload
   */
  createUser(userData: any, file?: File | null, roles?: string[]): Observable<any> {
    // If no file is provided, send JSON data
    if (!file) {
      const data = {
        ...userData,
        Roles: roles || []
      };
      
      return this.http.post<any>(`${this.apiUrl}/register`, data, {
        headers: this.getAuthHeaders()
      }).pipe(
        tap(() => this.refreshNow())
      );
    }
    
    // If file is provided, use FormData
    const formData = new FormData();
    
    // Add user data
    formData.append('Email', userData.Email);
    formData.append('FirstName', userData.FirstName || '');
    formData.append('MiddleName', userData.MiddleName || '');
    formData.append('LastName', userData.LastName || '');
    formData.append('PhoneNumber', userData.PhoneNumber || '');
    formData.append('Address', userData.Address || '');
    formData.append('Password', userData.Password);
    formData.append('IsActive', userData.IsActive || true);
    
    // Add roles
    if (roles && roles.length > 0) {
      roles.forEach(role => {
        formData.append('Roles', role);
      });
    }
    
    // Add file if provided
    if (file) {
      formData.append('UserImage', file);
    }

    return this.http.post<any>(`${this.apiUrl}/register`, formData, {
      headers: this.getAuthHeadersMultipart()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Update user with optional file upload
   */
  updateUser(id: number, userData: any, file?: File | null, roles?: string[]): Observable<any> {
    // If no file is provided, send JSON data
    if (!file) {
      const data = {
        ...userData,
        Roles: roles || []
      };
      
      return this.http.patch<any>(`${this.apiUrl}/${id}`, data, {
        headers: this.getAuthHeaders()
      }).pipe(
        tap(() => this.refreshNow())
      );
    }
    
    // If file is provided, use FormData
    const formData = new FormData();
    
    // Add user data
    formData.append('Email', userData.Email);
    formData.append('FirstName', userData.FirstName || '');
    formData.append('MiddleName', userData.MiddleName || '');
    formData.append('LastName', userData.LastName || '');
    formData.append('PhoneNumber', userData.PhoneNumber || '');
    formData.append('Address', userData.Address || '');
    formData.append('IsActive', userData.IsActive || true);
    
    // Add password if provided
    if (userData.Password) {
      formData.append('Password', userData.Password);
    }
    
    // Add roles
    if (roles && roles.length > 0) {
      roles.forEach(role => {
        formData.append('Roles', role);
      });
    }
    
    // Add file if provided
    if (file) {
      formData.append('UserImage', file);
    }

    return this.http.patch<any>(`${this.apiUrl}/${id}`, formData, {
      headers: this.getAuthHeadersMultipart()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Delete (soft delete) user
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.refreshNow();
      })
    );
  }

  /**
   * Manually refresh all data immediately
   */
  refreshNow(): void {
    this.fetchAllUsers();
  }

  /**
   * Refresh auth user profile after user update
   */
  refreshAuthUserProfile(): void {
    // Call the auth service to refresh the current user profile
    // This will ensure header and sidebar components get updated user data
    const token = localStorage.getItem('access_token');
    if (token) {
      this.http.get<any>('/api/users/profile', {
        headers: this.getAuthHeaders()
      }).subscribe({
        next: (user) => {
          // Notify that user profile has been refreshed
          // The auth service should handle this internally
        },
        error: (error) => {
        }
      });
    }
  }

  /**
   * Fetch all users from API
   */
  private fetchAllUsers(): void {
    this.http.get<User[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.allUsers$.next(data),
      error: (error) => {
        // Error handling can be added here if needed
      }
    });
  }
}
