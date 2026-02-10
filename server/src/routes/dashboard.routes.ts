import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Placeholder routes for dashboard
router.get('/stats', asyncHandler(async (_req, res) => {
  res.json({ message: 'Dashboard stats - to be implemented' });
}));

router.get('/overview', asyncHandler(async (_req, res) => {
  res.json({ message: 'Dashboard overview - to be implemented' });
}));

export default router;
