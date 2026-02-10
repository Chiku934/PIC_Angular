import { Response, NextFunction } from 'express';
import { PressureVessleCertificate, PressureVessleCertificateDetail } from '../models';
import { AuthenticatedRequest } from '@/types';

export const createPressureVesselCertificate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const certificate = await PressureVessleCertificate.create(req.body);
    res.status(201).json({
      success: true,
      data: certificate,
      message: 'Pressure vessel certificate created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPressureVesselCertificates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, factoryId } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (factoryId) where.factoryId = factoryId;

    const certificates = await PressureVessleCertificate.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: certificates.rows,
      pagination: {
        total: certificates.count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(certificates.count / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPressureVesselCertificateById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const certificate = await PressureVessleCertificate.findByPk(id, {
      include: [{
        model: PressureVessleCertificateDetail,
        as: 'details',
      }],
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Pressure vessel certificate not found'
      });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePressureVesselCertificate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const certificate = await PressureVessleCertificate.findByPk(id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Pressure vessel certificate not found'
      });
    }

    await certificate.update(req.body);
    
    res.json({
      success: true,
      data: certificate,
      message: 'Pressure vessel certificate updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deletePressureVesselCertificate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const certificate = await PressureVessleCertificate.findByPk(id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Pressure vessel certificate not found'
      });
    }

    await certificate.destroy();
    
    res.json({
      success: true,
      message: 'Pressure vessel certificate deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const createPressureVesselCertificateDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const detail = await PressureVessleCertificateDetail.create(req.body);
    res.status(201).json({
      success: true,
      data: detail,
      message: 'Pressure vessel certificate detail created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPressureVesselCertificateDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { certificateId } = req.params;
    
    const details = await PressureVessleCertificateDetail.findAll({
      where: { certificateId },
      order: [['inspectionDate', 'DESC']],
    });

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePressureVesselCertificateDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const detail = await PressureVessleCertificateDetail.findByPk(id);
    if (!detail) {
      return res.status(404).json({
        success: false,
        message: 'Pressure vessel certificate detail not found'
      });
    }

    await detail.update(req.body);
    
    res.json({
      success: true,
      data: detail,
      message: 'Pressure vessel certificate detail updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
