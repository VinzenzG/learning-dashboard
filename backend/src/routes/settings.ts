import { Router, type Request, type Response } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    aiProvider: config.aiProvider,
    ollamaBaseUrl: config.ollamaBaseUrl,
    ollamaModel: config.ollamaModel,
    watchFolder: config.watchFolder,
    questionsPerChunk: config.questionsPerChunk,
  });
});

// Runtime settings update (persists in memory only for the session)
router.patch('/', (req: Request, res: Response) => {
  const body = req.body as Partial<typeof config>;
  if (body.aiProvider) (config as typeof config).aiProvider = body.aiProvider;
  if (body.ollamaModel) (config as typeof config).ollamaModel = body.ollamaModel;
  if (body.ollamaBaseUrl) (config as typeof config).ollamaBaseUrl = body.ollamaBaseUrl;
  if (body.questionsPerChunk) (config as typeof config).questionsPerChunk = body.questionsPerChunk;
  res.json({ message: 'Settings updated (restart backend to persist)' });
});

export default router;
