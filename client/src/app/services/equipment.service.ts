import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { switchMap, shareReplay, tap } from 'rxjs/operators';

export interface Equipment {
  Id: number;
  EquipmentName: string;
  EquipmentType?: string;
  SerialNumber?: string;
  ModelNumber?: string;
  Manufacturer?: string;
  ManufacturingDate?: string;
  InstallationDate?: string;
  Location?: string;
  Capacity?: number;
  CapacityUnit?: string;
  Status?: string;
  Description?: string;
  LastInspectionDate?: string;
  NextInspectionDate?: string;
  CompanyId?: number;
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
export class EquipmentService {
  private apiUrl = '/api/equipment';
  
  // BehaviorSubjects to hold the latest data
  private allEquipment$ = new BehaviorSubject<Equipment[]>([]);
  private equipmentByCompany$ = new BehaviorSubject<Equipment[]>([]);
  private equipmentByStatus$ = new BehaviorSubject<Equipment[]>([]);

  constructor(private http: HttpClient) {
    // Auto-refresh removed to prevent resetting user selections
    // Initial data fetch to populate lists
    this.fetchAllEquipment();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all equipment with auto-refresh
   */
  getAllEquipment(): Observable<Equipment[]> {
    return this.allEquipment$.asObservable();
  }

  /**
   * Get equipment by company with auto-refresh
   */
  getEquipmentByCompany(companyId: number): Observable<Equipment[]> {
    return this.equipmentByCompany$.asObservable();
  }

  /**
   * Get equipment by status with auto-refresh
   */
  getEquipmentByStatus(status: string): Observable<Equipment[]> {
    return this.equipmentByStatus$.asObservable();
  }

  /**
   * Fetch single equipment by ID
   */
  getEquipmentById(id: number): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Create new equipment
   */
  createEquipment(equipment: Equipment): Observable<Equipment> {
    return this.http.post<Equipment>(this.apiUrl, equipment, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow()) // Refresh after creation
    );
  }

  /**
   * Update equipment
   */
  updateEquipment(id: number, equipment: Partial<Equipment>): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.apiUrl}/${id}`, equipment, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow()) // Refresh after update
    );
  }

  /**
   * Delete (soft delete) equipment
   */
  deleteEquipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.refreshNow(); // Refresh after deletion
      })
    );
  }

  /**
   * Manually refresh all data immediately
   */
  refreshNow(): void {
    this.fetchAllEquipment();
  }

  /**
   * Fetch all equipment from API
   * Note: Backend filters IsDeleted=false, so we only get active records
   */
  private fetchAllEquipment(): void {
    this.http.get<Equipment[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.allEquipment$.next(data);
      },
    });
  }
}
