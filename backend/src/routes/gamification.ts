import { Router, type Request, type Response } from 'express';
import { getUserStats, getAllBadges } from '../db/queries/gamification';

const router = Router();

router.get('/stats', (_req: Request, res: Response) => {
  const stats = getUserStats();
  const badges = getAllBadges();
  res.json({ stats, badges });
});

export default router;
