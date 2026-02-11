import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Location {
  Id: number;
  LocationName: string;
  LocationCode?: string;
  LocationType?: string;
  Address?: string;
  City?: string;
  State?: string;
  Country?: string;
  ZipCode?: string;
  Latitude?: number;
  Longitude?: number;
  IsActive?: boolean;
  CompanyId?: number;
  ParentLocationId?: number;
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
export class LocationService {
  private apiUrl = '/api/locations';
  
  // BehaviorSubjects to hold the latest data
  private allLocations$ = new BehaviorSubject<Location[]>([]);
  private activeLocations$ = new BehaviorSubject<Location[]>([]);
  private rootLocations$ = new BehaviorSubject<Location[]>([]);

  constructor(private http: HttpClient) {
    // Auto-refresh removed to prevent resetting user selections
    // Initial data fetch to populate lists
    this.fetchAllLocations();
    this.fetchActiveLocations();
    this.fetchRootLocations();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all locations with auto-refresh
   */
  getAllLocations(): Observable<Location[]> {
    return this.allLocations$.asObservable();
  }

  /**
   * Get active locations with auto-refresh
   */
  getActiveLocations(): Observable<Location[]> {
    return this.activeLocations$.asObservable();
  }

  /**
   * Get root locations with auto-refresh
   */
  getRootLocations(): Observable<Location[]> {
    return this.rootLocations$.asObservable();
  }

  /**
   * Fetch single location by ID
   */
  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Search locations
   */
  searchLocations(searchTerm: string): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}?search=${searchTerm}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Create new location
   */
  createLocation(location: Location): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, location, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Update location
   */
  updateLocation(id: number, location: Partial<Location>): Observable<Location> {
    return this.http.patch<Location>(`${this.apiUrl}/${id}`, location, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Delete (soft delete) location
   */
  deleteLocation(id: number): Observable<void> {
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
    this.fetchAllLocations();
    this.fetchActiveLocations();
    this.fetchRootLocations();
  }

  /**
   * Fetch all locations from API
   */
  private fetchAllLocations(): void {
    this.http.get<Location[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.allLocations$.next(data),
    });
  }

  /**
   * Fetch active locations
   */
  private fetchActiveLocations(): void {
    this.http.get<Location[]>(`${this.apiUrl}?active=true`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.activeLocations$.next(data),
    });
  }

  /**
   * Fetch root locations
   */
  private fetchRootLocations(): void {
    this.http.get<Location[]>(`${this.apiUrl}/root`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.rootLocations$.next(data),
    });
  }
}
