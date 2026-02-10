import { Router } from 'express';
import {
  createPressureVesselCertificate,
  getAllPressureVesselCertificates,
  getPressureVesselCertificateById,
  updatePressureVesselCertificate,
  deletePressureVesselCertificate,
  createPressureVesselCertificateDetail,
  getPressureVesselCertificateDetails,
  updatePressureVesselCertificateDetail,
} from '../controllers/pressureVessel.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// Pressure Vessel Certificate routes
router.post(
  '/',
  authenticate,
  [
    body('certificateNumber').notEmpty().withMessage('Certificate number is required'),
    body('vesselName').notEmpty().withMessage('Vessel name is required'),
    body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
    body('manufacturingDate').isISO8601().withMessage('Valid manufacturing date is required'),
    body('designCode').notEmpty().withMessage('Design code is required'),
    body('designPressure').isNumeric().withMessage('Design pressure must be numeric'),
    body('designTemperature').isNumeric().withMessage('Design temperature must be numeric'),
    body('maxAllowableWorkingPressure').isNumeric().withMessage('Max allowable working pressure must be numeric'),
    body('hydrostaticTestPressure').isNumeric().withMessage('Hydrostatic test pressure must be numeric'),
    body('corrosionAllowance').isNumeric().withMessage('Corrosion allowance must be numeric'),
    body('vesselMaterial').notEmpty().withMessage('Vessel material is required'),
    body('shellThickness').isNumeric().withMessage('Shell thickness must be numeric'),
    body('headThickness').isNumeric().withMessage('Head thickness must be numeric'),
    body('jointEfficiency').isFloat({ min: 0, max: 1 }).withMessage('Joint efficiency must be between 0 and 1'),
    body('inspectionInterval').isInt({ min: 1 }).withMessage('Inspection interval must be a positive integer'),
    body('factoryId').isInt().withMessage('Factory ID must be an integer'),
  ],
  validateRequest,
  createPressureVesselCertificate
);

router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'expired', 'suspended', 'cancelled']).withMessage('Invalid status'),
    query('factoryId').optional().isInt().withMessage('Factory ID must be an integer'),
  ],
  validateRequest,
  getAllPressureVesselCertificates
);

router.get(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Certificate ID must be an integer'),
  ],
  validateRequest,
  getPressureVesselCertificateById
);

router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Certificate ID must be an integer'),
    body('certificateNumber').optional().notEmpty().withMessage('Certificate number cannot be empty'),
    body('vesselName').optional().notEmpty().withMessage('Vessel name cannot be empty'),
    body('manufacturer').optional().notEmpty().withMessage('Manufacturer cannot be empty'),
    body('manufacturingDate').optional().isISO8601().withMessage('Valid manufacturing date is required'),
    body('designCode').optional().notEmpty().withMessage('Design code cannot be empty'),
    body('designPressure').optional().isNumeric().withMessage('Design pressure must be numeric'),
    body('designTemperature').optional().isNumeric().withMessage('Design temperature must be numeric'),
    body('maxAllowableWorkingPressure').optional().isNumeric().withMessage('Max allowable working pressure must be numeric'),
    body('hydrostaticTestPressure').optional().isNumeric().withMessage('Hydrostatic test pressure must be numeric'),
    body('corrosionAllowance').optional().isNumeric().withMessage('Corrosion allowance must be numeric'),
    body('vesselMaterial').optional().notEmpty().withMessage('Vessel material cannot be empty'),
    body('shellThickness').optional().isNumeric().withMessage('Shell thickness must be numeric'),
    body('headThickness').optional().isNumeric().withMessage('Head thickness must be numeric'),
    body('jointEfficiency').optional().isFloat({ min: 0, max: 1 }).withMessage('Joint efficiency must be between 0 and 1'),
    body('inspectionInterval').optional().isInt({ min: 1 }).withMessage('Inspection interval must be a positive integer'),
    body('factoryId').optional().isInt().withMessage('Factory ID must be an integer'),
  ],
  validateRequest,
  updatePressureVesselCertificate
);

router.delete(
  '/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Certificate ID must be an integer'),
  ],
  validateRequest,
  deletePressureVesselCertificate
);

// Pressure Vessel Certificate Detail routes
router.post(
  '/details',
  authenticate,
  [
    body('certificateId').isInt().withMessage('Certificate ID must be an integer'),
    body('inspectionDate').isISO8601().withMessage('Valid inspection date is required'),
    body('inspectorName').notEmpty().withMessage('Inspector name is required'),
    body('inspectionType').isIn(['internal', 'external', 'hydrostatic', 'ultrasonic', 'radiographic']).withMessage('Invalid inspection type'),
    body('thicknessMeasured').optional().isNumeric().withMessage('Thickness measured must be numeric'),
    body('corrosionRate').optional().isNumeric().withMessage('Corrosion rate must be numeric'),
    body('remainingLife').optional().isNumeric().withMessage('Remaining life must be numeric'),
    body('nextInspectionDate').optional().isISO8601().withMessage('Valid next inspection date is required'),
    body('remarks').optional().isString().withMessage('Remarks must be a string'),
    body('status').isIn(['passed', 'failed', 'requires_repair', 'requires_replacement']).withMessage('Invalid status'),
  ],
  validateRequest,
  createPressureVesselCertificateDetail
);

router.get(
  '/:certificateId/details',
  authenticate,
  [
    param('certificateId').isInt().withMessage('Certificate ID must be an integer'),
  ],
  validateRequest,
  getPressureVesselCertificateDetails
);

router.put(
  '/details/:id',
  authenticate,
  [
    param('id').isInt().withMessage('Detail ID must be an integer'),
    body('inspectionDate').optional().isISO8601().withMessage('Valid inspection date is required'),
    body('inspectorName').optional().notEmpty().withMessage('Inspector name cannot be empty'),
    body('inspectionType').optional().isIn(['internal', 'external', 'hydrostatic', 'ultrasonic', 'radiographic']).withMessage('Invalid inspection type'),
    body('thicknessMeasured').optional().isNumeric().withMessage('Thickness measured must be numeric'),
    body('corrosionRate').optional().isNumeric().withMessage('Corrosion rate must be numeric'),
    body('remainingLife').optional().isNumeric().withMessage('Remaining life must be numeric'),
    body('nextInspectionDate').optional().isISO8601().withMessage('Valid next inspection date is required'),
    body('remarks').optional().isString().withMessage('Remarks must be a string'),
    body('status').optional().isIn(['passed', 'failed', 'requires_repair', 'requires_replacement']).withMessage('Invalid status'),
  ],
  validateRequest,
  updatePressureVesselCertificateDetail
);

export default router;
