import { Router, type Request, type Response } from 'express';
import { createAdapter } from '../ai/adapter';
import { config } from '../config';

const router = Router();

router.post('/evaluate', async (req: Request, res: Response) => {
  const { question, userAnswer } = req.body as { question: string; userAnswer: string };
  if (!question || !userAnswer) {
    return res.status(400).json({ error: 'question and userAnswer required' });
  }

  try {
    const adapter = await createAdapter(config);
    const evaluation = await adapter.evaluateFeynmanAnswer(question, userAnswer);
    res.json(evaluation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
