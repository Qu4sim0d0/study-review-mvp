import { Router } from 'express';
import { db } from '../db.js';

export const mistakesRouter = Router();

mistakesRouter.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT mistakes.*, questions.stem
    FROM mistakes
    LEFT JOIN questions ON questions.id = mistakes.question_id
    ORDER BY mistakes.wrong_count DESC, mistakes.last_answered_at DESC
  `).all();

  res.json({ mistakes: rows });
});

mistakesRouter.get('/:questionId', (req, res) => {
  const row = db.prepare(`
    SELECT mistakes.*, questions.*
    FROM mistakes
    LEFT JOIN questions ON questions.id = mistakes.question_id
    WHERE mistakes.question_id = ?
  `).get(req.params.questionId);

  if (!row) {
    res.status(404).json({ error: 'Mistake not found' });
    return;
  }

  res.json({ mistake: row });
});

mistakesRouter.delete('/:questionId', (req, res) => {
  db.prepare('DELETE FROM mistakes WHERE question_id = ?').run(req.params.questionId);
  res.json({ deleted: true });
});
