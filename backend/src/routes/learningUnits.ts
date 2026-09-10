import { Router, type Request, type Response } from 'express';
import {
  getAllUnits, getUnitById, deleteUnitQuestions, updateUnitStatus, getModuleNames,
} from '../db/queries/learningUnits';
import { getQuestionsByUnit } from '../db/queries/questions';
import { processFile, deepenTopic } from '../ingestion/pipeline';
import { getTotalDueCount } from '../db/queries/srsCards';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const units = getAllUnits();
  const dueTotal = getTotalDueCount();
  res.json({ units, dueTotal });
});

router.get('/modules', (_req: Request, res: Response) => {
  res.json({ modules: getModuleNames() });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const unit = getUnitById(id);
  if (!unit) return res.status(404).json({ error: 'Not found' });

  const questions = getQuestionsByUnit(id);
  res.json({ unit, questions });
});

router.post('/:id/reprocess', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const unit = getUnitById(id);
  if (!unit) return res.status(404).json({ error: 'Not found' });

  deleteUnitQuestions(id);
  updateUnitStatus(id, 'pending');
  res.json({ message: 'Reprocessing started' });

  processFile(unit.file_path, unit.module_name).catch(console.error);
});

router.post('/:id/deepen', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { topicTag } = req.body as { topicTag?: string };

  const unit = getUnitById(id);
  if (!unit) return res.status(404).json({ error: 'Not found' });
  if (unit.status !== 'ready') return res.status(409).json({ error: 'Unit not ready' });
  if (!unit.extracted_text) return res.status(422).json({ error: 'No extracted text available' });

  res.json({ message: 'Deepening started', topicTag: topicTag ?? null });

  deepenTopic(id, unit.title, unit.extracted_text, topicTag ?? null).catch(console.error);
});

export default router;
