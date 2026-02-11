import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, interval, BehaviorSubject } from 'rxjs';
  import { catchError, map, tap, switchMap, distinctUntilChanged } from 'rxjs/operators';

export interface CompanyDetails {
  Id?: number;
  CompanyName: string;
  ABBR: string;
  CompanyLogo?: string;
  TaxId?: string;
  Domain?: string;
  DateOfEstablishment?: Date;
  DateOfIncorporation?: Date;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  State?: string;
  Country?: string;
  PostalCode?: string;
  EmailAddress?: string;
  PhoneNumber?: string;
  Fax?: string;
  Website?: string;
  CreatedBy?: number;
  CreatedDate?: Date;
  UpdatedBy?: number;
  UpdatedDate?: Date;
  DeletedDate?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = '/api/setup';
  private refreshInterval = 30000; // Refresh every 30 seconds

  // BehaviorSubjects to hold the latest data
  private allCompanies$ = new BehaviorSubject<CompanyDetails[]>([]);

  constructor(private http: HttpClient) {
    this.startAutoRefresh();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getFormDataHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Note: Don't set Content-Type for FormData, let browser set it with boundary
    });
  }

  // Get current company details
  getCompany(): Observable<CompanyDetails | null> {
    return this.http.get<ApiResponse<CompanyDetails>>(`${this.apiUrl}/company`, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.data || null),
      catchError(this.handleError)
    );
  }

  // Create or update company details
  createOrUpdateCompany(companyData: CompanyDetails, file?: File): Observable<CompanyDetails> {
    const formData = new FormData();


    // Add company data fields
    Object.keys(companyData).forEach(key => {
      const value = (companyData as any)[key];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add file if provided
    if (file) {
      formData.append('companyLogo', file, file.name);
    }


    return this.http.post<ApiResponse<CompanyDetails>>(`${this.apiUrl}/company`, formData, { headers: this.getFormDataHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to save company details');
        }
      }),
      tap(() => this.refreshNow()),
      catchError(this.handleError)
    );
  }

  // Create company details (legacy method)
  createCompany(companyData: CompanyDetails, file?: File): Observable<CompanyDetails> {
    const formData = new FormData();
    
    Object.keys(companyData).forEach(key => {
      const value = (companyData as any)[key];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (file) {
      formData.append('companyLogo', file, file.name);
    }

    return this.http.post<ApiResponse<CompanyDetails>>(`${this.apiUrl}/company-details`, formData, { headers: this.getFormDataHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create company');
        }
      }),
      tap(() => this.refreshNow()),
      catchError(this.handleError)
    );
  }

  // Update company details
  updateCompany(id: number, companyData: CompanyDetails, file?: File): Observable<CompanyDetails> {
    const formData = new FormData();
    
    Object.keys(companyData).forEach(key => {
      const value = (companyData as any)[key];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (file) {
      formData.append('companyLogo', file, file.name);
    }

    return this.http.patch<ApiResponse<CompanyDetails>>(`${this.apiUrl}/company-details/${id}`, formData, { headers: this.getFormDataHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update company');
        }
      }),
      tap(() => this.refreshNow()),
      catchError(this.handleError)
    );
  }

  // Delete company
  deleteCompany(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/company-details/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete company');
        }
      }),
      tap(() => {
        this.refreshNow();
      }),
      catchError(this.handleError)
    );
  }

   // Get company by ID - returns from auto-refresh cache with real-time updates
   getCompanyById(id: number): Observable<CompanyDetails> {
     return this.allCompanies$.pipe(
       map(companies => {
         const company = companies.find(c => c.Id === id);
         if (!company) {
           throw new Error('Company not found');
         }
         return company;
       }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      catchError(() => {
         // Fallback to direct API call if not found in cache
         return this.http.get<CompanyDetails>(`${this.apiUrl}/company-details/${id}`, { headers: this.getAuthHeaders() }).pipe(
           catchError(this.handleError)
         );
       })
     );
   }

  // Get all company details with auto-refresh
  getCompanies(): Observable<CompanyDetails[]> {
    return this.allCompanies$.asObservable();
  }

  /**
   * Get current company as an observable that updates when cache updates.
   * Falls back to one-off API call if cache does not contain a company.
   */
  getCurrentCompanyObservable(): Observable<CompanyDetails | null> {
    return this.allCompanies$.pipe(
      map(companies => (companies && companies.length > 0) ? companies[0] : null),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      catchError(() => {
        return this.getCurrentCompany();
      })
    );
  }

  /**
   * Fetch companies from API and update the BehaviorSubject
   */
  private fetchCompanies(): Observable<CompanyDetails[]> {
    return this.http.get<CompanyDetails[]>(`${this.apiUrl}/company-details`, { headers: this.getAuthHeaders() }).pipe(
      tap(data => {
        this.allCompanies$.next(data || []);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Manually refresh all data immediately
   */
  refreshNow(): void {
    this.fetchCompanies().subscribe();
  }

  /**
   * Start auto-refresh interval
   */
  private startAutoRefresh(): void {
    interval(this.refreshInterval).pipe(
      switchMap(() => {
        return this.fetchCompanies();
      })
    ).subscribe();

    // Initial fetch
    this.refreshNow();
  }

  // Get current company details (legacy method)
  getCurrentCompany(): Observable<CompanyDetails | null> {
    return this.http.get<CompanyDetails | null>(`${this.apiUrl}/company-details/current`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}