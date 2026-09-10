import { Router, type Request, type Response } from 'express';
import { getAccuracyByDay, getWeakSpots } from '../db/queries/gamification';

const router = Router();

router.get('/accuracy', (req: Request, res: Response) => {
  const days = parseInt(String(req.query.days ?? '30'));
  res.json(getAccuracyByDay(days));
});

router.get('/weak-spots', (req: Request, res: Response) => {
  const unitId = req.query.unitId ? parseInt(String(req.query.unitId)) : undefined;
  res.json(getWeakSpots(unitId));
});

router.get('/forgetting-curve', (_req: Request, res: Response) => {
  // Ebbinghaus retention: R = e^(-t/S) where S is strength (days to forget)
  const points = Array.from({ length: 30 }, (_, i) => ({
    dayOffset: i + 1,
    retentionPct: Math.round(Math.exp(-(i + 1) / 7) * 100),
  }));
  res.json(points);
});

export default router;
