import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const certificateController = new CertificateController();

// Validation schemas
const createCertificateValidation = [
  body('certificateType')
    .isIn(['COMPLETION', 'ACHIEVEMENT', 'PARTICIPATION', 'EXCELLENCE'])
    .withMessage('Invalid certificate type'),
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('recipientName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),
  body('recipientEmail')
    .isEmail()
    .withMessage('Valid recipient email is required'),
  body('issueDate')
    .optional()
    .isISO8601()
    .withMessage('Issue date must be a valid date'),
  body('completionDate')
    .optional()
    .isISO8601()
    .withMessage('Completion date must be a valid date'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until date must be a valid date'),
  body('issuerName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Issuer name must be between 2 and 100 characters'),
  body('issuerTitle')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Issuer title must not exceed 100 characters'),
  body('issuerOrganization')
    .isLength({ min: 2, max: 200 })
    .withMessage('Issuer organization must be between 2 and 200 characters'),
  body('additionalData')
    .optional()
    .isObject()
    .withMessage('Additional data must be an object'),
];

const updateCertificateValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid certificate ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('recipientName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),
  body('recipientEmail')
    .optional()
    .isEmail()
    .withMessage('Valid recipient email is required'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until date must be a valid date'),
  body('additionalData')
    .optional()
    .isObject()
    .withMessage('Additional data must be an object'),
];

const certificateIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid certificate ID'),
];

const certificateVerificationValidation = [
  param('certificateId')
    .isLength({ min: 1 })
    .withMessage('Certificate ID is required'),
];

const getCertificatesValidation = [
  query('status')
    .optional()
    .isIn(['DRAFT', 'ISSUED', 'REVOKED', 'EXPIRED'])
    .withMessage('Invalid status filter'),
  query('userId')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];

const revokeCertificateValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid certificate ID'),
  body('reason')
    .isLength({ min: 5, max: 500 })
    .withMessage('Revocation reason must be between 5 and 500 characters'),
];

// Routes

/**
 * @route   POST /api/certificates
 * @desc    Create a new certificate
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  createCertificateValidation,
  validateRequest,
  certificateController.createCertificate
);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates with filters
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  getCertificatesValidation,
  validateRequest,
  certificateController.getCertificates
);

/**
 * @route   GET /api/certificates/statistics
 * @desc    Get certificate statistics
 * @access  Private
 */
router.get(
  '/statistics',
  authenticate,
  certificateController.getCertificateStatistics
);

/**
 * @route   GET /api/certificates/:id
 * @desc    Get certificate by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  certificateIdValidation,
  validateRequest,
  certificateController.getCertificateById
);

/**
 * @route   PUT /api/certificates/:id
 * @desc    Update certificate
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  updateCertificateValidation,
  validateRequest,
  certificateController.updateCertificate
);

/**
 * @route   DELETE /api/certificates/:id
 * @desc    Delete certificate
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  certificateIdValidation,
  validateRequest,
  certificateController.deleteCertificate
);

/**
 * @route   POST /api/certificates/:id/issue
 * @desc    Issue certificate
 * @access  Private
 */
router.post(
  '/:id/issue',
  authenticate,
  certificateIdValidation,
  validateRequest,
  certificateController.issueCertificate
);

/**
 * @route   POST /api/certificates/:id/revoke
 * @desc    Revoke certificate
 * @access  Private
 */
router.post(
  '/:id/revoke',
  authenticate,
  revokeCertificateValidation,
  validateRequest,
  certificateController.revokeCertificate
);

/**
 * @route   GET /api/certificates/verify/:certificateId
 * @desc    Verify certificate (public endpoint)
 * @access  Public
 */
router.get(
  '/verify/:certificateId',
  certificateVerificationValidation,
  validateRequest,
  certificateController.verifyCertificate
);

export default router;
