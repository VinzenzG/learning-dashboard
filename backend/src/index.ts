import express from 'express';
import cors from 'cors';
import path from 'path';
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
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? false : 'http://localhost:5173',
}));
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

// In production: serve the built frontend from backend
if (isProd) {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // SPA fallback — all non-API routes → index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Init DB eagerly
getDb();

// Start file watcher
startWatcher();

app.listen(config.backendPort, () => {
  console.log(`[Backend] Running on http://localhost:${config.backendPort}`);
  console.log(`[Backend] AI Provider: ${config.aiProvider}`);
  console.log(`[Backend] Mode: ${isProd ? 'production' : 'development'}`);
});
