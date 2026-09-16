import { Router, type Request, type Response } from 'express';
import { getDueCards, getCardById, updateCard, getTotalDueCount } from '../db/queries/srsCards';
import { insertReview } from '../db/queries/gamification';
import { sm2 } from '../srs/sm2';
import { processReviewAward } from '../gamification/awards';

const router = Router();

router.get('/due', (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit ?? '20'));
  const interleave = req.query.interleave !== 'false';
  const moduleName = req.query.moduleName ? String(req.query.moduleName) : undefined;
  const cards = getDueCards(limit, interleave, moduleName);
  const total = getTotalDueCount(moduleName);
  res.json({ cards, total });
});

router.post('/', (req: Request, res: Response) => {
  const { cardId, quality, confidence, timeMs, sessionId } = req.body as {
    cardId: number;
    quality: number;
    confidence?: number;
    timeMs?: number;
    sessionId?: number;
  };

  if (!cardId || quality === undefined) {
    return res.status(400).json({ error: 'cardId and quality required' });
  }

  const card = getCardById(cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const prevStatus = card.status;
  const result = sm2({
    repetitions: card.repetitions,
    interval_days: card.interval_days,
    ease_factor: card.ease_factor,
    quality,
  });

  const lapseDelta = result.was_lapse ? 1 : 0;
  updateCard(cardId, {
    status: result.status,
    interval_days: result.interval_days,
    ease_factor: result.ease_factor,
    repetitions: result.repetitions,
    lapses: card.lapses + lapseDelta,
    next_review_at: result.next_review_at.toISOString(),
  });

  insertReview({
    card_id: cardId,
    session_id: sessionId ?? null,
    quality,
    confidence: confidence ?? null,
    time_taken_ms: timeMs ?? null,
    was_correct: quality >= 3 ? 1 : 0,
  });

  const awards = processReviewAward({
    quality,
    prevStatus,
    newStatus: result.status,
  });

  res.json({
    updatedCard: { ...card, ...result, next_review_at: result.next_review_at.toISOString() },
    awards,
  });
});

export default router;
