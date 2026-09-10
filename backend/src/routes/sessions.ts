import { Router, type Request, type Response } from 'express';
import { insertSession, endSession, getSessionHistory } from '../db/queries/gamification';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit ?? '20'));
  res.json(getSessionHistory(limit));
});

router.post('/', (req: Request, res: Response) => {
  const { unitId, sessionType } = req.body as { unitId?: number; sessionType?: string };
  const id = insertSession({ unit_id: unitId ?? null, session_type: sessionType ?? 'quiz' });
  res.json({ id });
});

router.patch('/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { cardsStudied, correctCount, xpEarned } = req.body as {
    cardsStudied: number;
    correctCount: number;
    xpEarned: number;
  };
  endSession(id, { cards_studied: cardsStudied, correct_count: correctCount, xp_earned: xpEarned });
  res.json({ message: 'Session ended' });
});

export default router;
