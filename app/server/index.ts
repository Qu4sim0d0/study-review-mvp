import cors from 'cors';
import express from 'express';
import { initSchema } from './db.js';
import { questionsRouter } from './routes/questions.js';
import { attemptsRouter } from './routes/attempts.js';
import { mistakesRouter } from './routes/mistakes.js';

initSchema();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/questions', questionsRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/mistakes', mistakesRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Study review API listening on http://localhost:${port}`);
});
