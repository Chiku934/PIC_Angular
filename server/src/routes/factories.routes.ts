import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Placeholder routes for factories
router.get('/', asyncHandler(async (_req, res) => {
  res.json({ message: 'Factories endpoint - to be implemented' });
}));

router.post('/', asyncHandler(async (_req, res) => {
  res.json({ message: 'Create factory - to be implemented' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ message: `Get factory ${req.params.id} - to be implemented` });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  res.json({ message: `Update factory ${req.params.id} - to be implemented` });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json({ message: `Delete factory ${req.params.id} - to be implemented` });
}));

export default router;
