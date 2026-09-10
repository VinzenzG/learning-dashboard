import express from 'express';
import cors from 'cors';
import { config } from './config';
import { getDb } from './db/client';
import { startWatcher } from './watcher/fileWatcher';
import eventsRouter from './routes/events';
import learningUnitsRouter from './routes/learningUnits';
import reviewsRouter from './routes/reviews';
import sessionsRouter from './routes/sessions';
import gamificationRouter from './routes/gamification';
import analyticsRouter from './routes/analytics';
import settingsRouter from './routes/settings';
import feynmanRouter from './routes/feynman';
import examRouter from './routes/exam';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    dbPath: config.dbPath,
    aiProvider: config.aiProvider,
    watchFolder: config.watchFolder,
  });
});

app.use('/api/events', eventsRouter);
app.use('/api/learning-units', learningUnitsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/feynman', feynmanRouter);
app.use('/api/exam', examRouter);

// Init DB eagerly
getDb();

// Start file watcher
startWatcher();

app.listen(config.backendPort, () => {
  console.log(`[Backend] Running on http://localhost:${config.backendPort}`);
  console.log(`[Backend] AI Provider: ${config.aiProvider}`);
  if (config.aiProvider === 'claude-cli') {
    console.log(`[Backend] Claude CLI: ${config.claudeCliBin}`);
  }
});
