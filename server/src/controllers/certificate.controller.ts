import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CertificateCreateInput, CertificateUpdateInput } from '../types';
import { CertificateService, CertificateFilters } from '../services/certificate.service';
import { logger } from '../utils/logger';

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
  }

  /**
   * Create a new certificate
   */
  public createCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const certificateData: CertificateCreateInput = {
        ...req.body,
        userId: userId.toString(),
      };

      const certificate = await this.certificateService.createCertificate(certificateData);

      const response: ApiResponse = {
        success: true,
        message: 'Certificate created successfully',
        data: certificate,
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createCertificate controller:', error);
      next(error);
    }
  };

  /**
   * Get all certificates with filters
   */
  public getCertificates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.role === 'admin';

      const filters: CertificateFilters = {
        status: req.query['status'] as any,
        userId: isAdmin ? req.query['userId'] as string : userId.toString(),
        search: req.query['search'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined,
        limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
        offset: req.query['offset'] ? Number(req.query['offset']) : undefined,
      };

      const result = await this.certificateService.getCertificates(filters);

      const response: ApiResponse = {
        success: true,
        message: 'Certificates retrieved successfully',
        data: result.certificates,
        timestamp: new Date().toISOString(),
      };

      // Add pagination headers
      res.setHeader('X-Total-Count', result.total);
      res.setHeader('X-Offset', filters.offset || 0);
      res.setHeader('X-Limit', filters.limit || result.total);

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in getCertificates controller:', error);
      next(error);
    }
  };

  /**
   * Get certificate by ID
   */
  public getCertificateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const certificate = await this.certificateService.getCertificateById(id);

      if (!certificate) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Certificate retrieved successfully',
        data: certificate,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in getCertificateById controller:', error);
      next(error);
    }
  };

  /**
   * Update certificate
   */
  public updateCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const updateData: CertificateUpdateInput = req.body;
      const certificate = await this.certificateService.updateCertificate(id, updateData);

      if (!certificate) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Certificate updated successfully',
        data: certificate,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in updateCertificate controller:', error);
      next(error);
    }
  };

  /**
   * Delete certificate
   */
  public deleteCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await this.certificateService.deleteCertificate(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Certificate deleted successfully',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in deleteCertificate controller:', error);
      next(error);
    }
  };

  /**
   * Issue certificate
   */
  public issueCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const certificate = await this.certificateService.issueCertificate(id);

      if (!certificate) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Certificate issued successfully',
        data: certificate,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in issueCertificate controller:', error);
      next(error);
    }
  };

  /**
   * Revoke certificate
   */
  public revokeCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const certificate = await this.certificateService.revokeCertificate(id, reason);

      if (!certificate) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Certificate revoked successfully',
        data: certificate,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in revokeCertificate controller:', error);
      next(error);
    }
  };

  /**
   * Verify certificate
   */
  public verifyCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { certificateId } = req.params;

      if (!certificateId) {
        const response: ApiResponse = {
          success: false,
          message: 'Certificate ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.certificateService.verifyCertificate(certificateId);

      const response: ApiResponse = {
        success: result.isValid,
        message: result.isValid ? 'Certificate is valid' : result.error || 'Certificate verification failed',
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(result.isValid ? 200 : 400).json(response);
    } catch (error) {
      logger.error('Error in verifyCertificate controller:', error);
      next(error);
    }
  };

  /**
   * Get certificate statistics
   */
  public getCertificateStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.role === 'admin';
      const targetUserId = isAdmin ? req.query['userId'] as string : userId.toString();

      const statistics = await this.certificateService.getCertificateStatistics(
        isAdmin && targetUserId ? targetUserId : userId.toString()
      );

      const response: ApiResponse = {
        success: true,
        message: 'Certificate statistics retrieved successfully',
        data: statistics,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in getCertificateStatistics controller:', error);
      next(error);
    }
  };
}
