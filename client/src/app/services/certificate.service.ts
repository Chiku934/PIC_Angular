import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Certificate {
  Id: number;
  CertificateNumber: string;
  CertificateType?: string;
  IssueDate: string;
  ExpiryDate: string;
  IssuingBody?: string;
  Description?: string;
  EquipmentId?: number;
  LocationId?: number;
  Status?: string;
  ApprovedById?: number;
  RejectionReason?: string;
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
export class CertificateService {
  private apiUrl = '/api/certificates';
  
  // BehaviorSubjects to hold the latest data
  private allCertificates$ = new BehaviorSubject<Certificate[]>([]);
  private certificatesByEquipment$ = new BehaviorSubject<Certificate[]>([]);
  private certificatesByLocation$ = new BehaviorSubject<Certificate[]>([]);
  private expiringSoon$ = new BehaviorSubject<Certificate[]>([]);
  private expired$ = new BehaviorSubject<Certificate[]>([]);

  constructor(private http: HttpClient) {
    // Auto-refresh removed to prevent resetting user selections
    // Initial data fetch to populate lists
    this.fetchAllCertificates();
    this.fetchExpiringSoon();
    this.fetchExpired();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all certificates with auto-refresh
   */
  getAllCertificates(): Observable<Certificate[]> {
    return this.allCertificates$.asObservable();
  }

  /**
   * Get certificates by equipment with auto-refresh
   */
  getCertificatesByEquipment(equipmentId: number): Observable<Certificate[]> {
    return this.certificatesByEquipment$.asObservable();
  }

  /**
   * Get certificates by location with auto-refresh
   */
  getCertificatesByLocation(locationId: number): Observable<Certificate[]> {
    return this.certificatesByLocation$.asObservable();
  }

  /**
   * Get expiring soon certificates with auto-refresh
   */
  getExpiringSoon(days: number = 30): Observable<Certificate[]> {
    return this.expiringSoon$.asObservable();
  }

  /**
   * Get expired certificates with auto-refresh
   */
  getExpired(): Observable<Certificate[]> {
    return this.expired$.asObservable();
  }

  /**
   * Fetch single certificate by ID
   */
  getCertificateById(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Create new certificate
   */
  createCertificate(certificate: Certificate): Observable<Certificate> {
    return this.http.post<Certificate>(this.apiUrl, certificate, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Update certificate
   */
  updateCertificate(id: number, certificate: Partial<Certificate>): Observable<Certificate> {
    return this.http.patch<Certificate>(`${this.apiUrl}/${id}`, certificate, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Delete (soft delete) certificate
   */
  deleteCertificate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.refreshNow();
      })
    );
  }

  /**
   * Approve certificate
   */
  approveCertificate(id: number): Observable<Certificate> {
    return this.http.patch<Certificate>(`${this.apiUrl}/${id}/approve`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Reject certificate
   */
  rejectCertificate(id: number, rejectionReason: string): Observable<Certificate> {
    return this.http.patch<Certificate>(`${this.apiUrl}/${id}/reject`, { rejectionReason }, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNow())
    );
  }

  /**
   * Manually refresh all data immediately
   */
  refreshNow(): void {
    this.fetchAllCertificates();
    this.fetchExpiringSoon();
    this.fetchExpired();
  }

  /**
   * Fetch all certificates from API
   */
  private fetchAllCertificates(): void {
    this.http.get<Certificate[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.allCertificates$.next(data),
    });
  }

  /**
   * Fetch expiring soon certificates
   */
  private fetchExpiringSoon(): void {
    this.http.get<Certificate[]>(`${this.apiUrl}/expiring-soon`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.expiringSoon$.next(data),
    });
  }

  /**
   * Fetch expired certificates
   */
  private fetchExpired(): void {
    this.http.get<Certificate[]>(`${this.apiUrl}/expired`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => this.expired$.next(data),
    });
  }
}
