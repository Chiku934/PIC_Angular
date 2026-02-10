import { v4 as uuidv4 } from 'uuid';
import { Certificate, CertificateCreateInput, CertificateUpdateInput, CertificateStatus } from '../types';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';

export interface CertificateFilters {
  status?: CertificateStatus;
  userId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface CertificateValidationResult {
  isValid: boolean;
  certificate?: Certificate;
  error?: string;
}

export class CertificateService {
  private emailService: EmailService;
  private certificates: Map<string, Certificate> = new Map(); // In-memory storage (replace with database)

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generate a unique certificate ID
   */
  private generateCertificateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Create a new certificate
   */
  public async createCertificate(input: CertificateCreateInput): Promise<Certificate> {
    try {
      const certificate: Certificate = {
        id: uuidv4(),
        certificateId: this.generateCertificateId(),
        ...input,
        status: CertificateStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store certificate (in-memory - replace with database)
      this.certificates.set(certificate.id, certificate);

      logger.info('Certificate created successfully:', {
        certificateId: certificate.certificateId,
        userId: certificate.userId,
        name: certificate.name,
      });

      return certificate;
    } catch (error) {
      logger.error('Failed to create certificate:', error);
      throw new Error('Failed to create certificate');
    }
  }

  /**
   * Update an existing certificate
   */
  public async updateCertificate(id: string, input: CertificateUpdateInput): Promise<Certificate | null> {
    try {
      const certificate = this.certificates.get(id);
      if (!certificate) {
        return null;
      }

      const updatedCertificate: Certificate = {
        ...certificate,
        ...input,
        updatedAt: new Date(),
      };

      this.certificates.set(id, updatedCertificate);

      logger.info('Certificate updated successfully:', {
        certificateId: updatedCertificate.certificateId,
        userId: updatedCertificate.userId,
      });

      return updatedCertificate;
    } catch (error) {
      logger.error('Failed to update certificate:', error);
      throw new Error('Failed to update certificate');
    }
  }

  /**
   * Get certificate by ID
   */
  public async getCertificateById(id: string): Promise<Certificate | null> {
    try {
      const certificate = this.certificates.get(id);
      return certificate || null;
    } catch (error) {
      logger.error('Failed to get certificate by ID:', error);
      throw new Error('Failed to get certificate');
    }
  }

  /**
   * Get certificate by certificate ID
   */
  public async getCertificateByCertificateId(certificateId: string): Promise<Certificate | null> {
    try {
      for (const certificate of this.certificates.values()) {
        if (certificate.certificateId === certificateId) {
          return certificate;
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get certificate by certificate ID:', error);
      throw new Error('Failed to get certificate');
    }
  }

  /**
   * Get certificates with filters
   */
  public async getCertificates(filters: CertificateFilters = {}): Promise<{
    certificates: Certificate[];
    total: number;
  }> {
    try {
      let certificates = Array.from(this.certificates.values());

      // Apply filters
      if (filters.status) {
        certificates = certificates.filter(cert => cert.status === filters.status);
      }

      if (filters.userId) {
        certificates = certificates.filter(cert => cert.userId === filters.userId);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        certificates = certificates.filter(cert =>
          cert.name.toLowerCase().includes(searchTerm) ||
          cert.description?.toLowerCase().includes(searchTerm) ||
          cert.recipientName?.toLowerCase().includes(searchTerm) ||
          cert.certificateId.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.dateFrom) {
        certificates = certificates.filter(cert => cert.createdAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        certificates = certificates.filter(cert => cert.createdAt <= filters.dateTo!);
      }

      // Sort by creation date (newest first)
      certificates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = certificates.length;

      // Apply pagination
      if (filters.offset) {
        certificates = certificates.slice(filters.offset);
      }

      if (filters.limit) {
        certificates = certificates.slice(0, filters.limit);
      }

      return { certificates, total };
    } catch (error) {
      logger.error('Failed to get certificates:', error);
      throw new Error('Failed to get certificates');
    }
  }

  /**
   * Delete a certificate
   */
  public async deleteCertificate(id: string): Promise<boolean> {
    try {
      const certificate = this.certificates.get(id);
      if (!certificate) {
        return false;
      }

      this.certificates.delete(id);

      logger.info('Certificate deleted successfully:', {
        certificateId: certificate.certificateId,
        userId: certificate.userId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete certificate:', error);
      throw new Error('Failed to delete certificate');
    }
  }

  /**
   * Issue a certificate
   */
  public async issueCertificate(id: string): Promise<Certificate | null> {
    try {
      const certificate = this.certificates.get(id);
      if (!certificate) {
        return null;
      }

      const updatedCertificate: Certificate = {
        ...certificate,
        status: CertificateStatus.ISSUED,
        issuedAt: new Date(),
        updatedAt: new Date(),
      };

      this.certificates.set(id, updatedCertificate);

      // Send email notification
      if (certificate.recipientEmail) {
        await this.emailService.sendCertificateIssuedEmail(
          certificate.recipientEmail,
          certificate.certificateId,
          certificate.name
        );
      }

      logger.info('Certificate issued successfully:', {
        certificateId: updatedCertificate.certificateId,
        userId: updatedCertificate.userId,
        recipientEmail: certificate.recipientEmail,
      });

      return updatedCertificate;
    } catch (error) {
      logger.error('Failed to issue certificate:', error);
      throw new Error('Failed to issue certificate');
    }
  }

  /**
   * Revoke a certificate
   */
  public async revokeCertificate(id: string, reason?: string): Promise<Certificate | null> {
    try {
      const certificate = this.certificates.get(id);
      if (!certificate) {
        return null;
      }

      const updatedCertificate: Certificate = {
        ...certificate,
        status: CertificateStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: reason,
        updatedAt: new Date(),
      };

      this.certificates.set(id, updatedCertificate);

      logger.info('Certificate revoked successfully:', {
        certificateId: updatedCertificate.certificateId,
        userId: updatedCertificate.userId,
        reason,
      });

      return updatedCertificate;
    } catch (error) {
      logger.error('Failed to revoke certificate:', error);
      throw new Error('Failed to revoke certificate');
    }
  }

  /**
   * Verify certificate authenticity
   */
  public async verifyCertificate(certificateId: string): Promise<CertificateValidationResult> {
    try {
      const certificate = await this.getCertificateByCertificateId(certificateId);
      
      if (!certificate) {
        return {
          isValid: false,
          error: 'Certificate not found',
        };
      }

      if (certificate.status === CertificateStatus.REVOKED) {
        return {
          isValid: false,
          certificate,
          error: 'Certificate has been revoked',
        };
      }

      if (certificate.status === CertificateStatus.DRAFT) {
        return {
          isValid: false,
          certificate,
          error: 'Certificate has not been issued yet',
        };
      }

      // Check if certificate is expired
      if (certificate.expiresAt && certificate.expiresAt < new Date()) {
        return {
          isValid: false,
          certificate,
          error: 'Certificate has expired',
        };
      }

      return {
        isValid: true,
        certificate,
      };
    } catch (error) {
      logger.error('Failed to verify certificate:', error);
      return {
        isValid: false,
        error: 'Verification failed due to an error',
      };
    }
  }

  /**
   * Get certificate statistics
   */
  public async getCertificateStatistics(userId?: string): Promise<{
    total: number;
    issued: number;
    draft: number;
    revoked: number;
    expired: number;
  }> {
    try {
      let certificates = Array.from(this.certificates.values());

      if (userId) {
        certificates = certificates.filter(cert => cert.userId === userId);
      }

      const now = new Date();
      const statistics = {
        total: certificates.length,
        issued: certificates.filter(cert => cert.status === CertificateStatus.ISSUED).length,
        draft: certificates.filter(cert => cert.status === CertificateStatus.DRAFT).length,
        revoked: certificates.filter(cert => cert.status === CertificateStatus.REVOKED).length,
        expired: certificates.filter(cert => 
          cert.expiresAt && cert.expiresAt < now
        ).length,
      };

      return statistics;
    } catch (error) {
      logger.error('Failed to get certificate statistics:', error);
      throw new Error('Failed to get certificate statistics');
    }
  }
}
