import { Router } from 'express';
import { db } from '../db.js';
import { createAttempt, getQuestionById } from './questions.js';
import type { StoredQuestion } from '../../src/types/schema.js';

export const attemptsRouter = Router();

attemptsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM attempts ORDER BY answered_at DESC').all();
  res.json({ attempts: rows });
});

attemptsRouter.post('/objective', (req, res) => {
  const { question_id, student_answer } = req.body as { question_id?: string; student_answer?: string };

  if (!question_id || typeof student_answer !== 'string') {
    res.status(400).json({ error: 'question_id and student_answer are required' });
    return;
  }

  const question = getQuestionById(question_id) as StoredQuestion | undefined;
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  if (question.type === 'short_answer') {
    res.status(400).json({ error: 'Use the short-answer grading flow for short_answer questions' });
    return;
  }

  const normalizedStudent = student_answer.trim().toLowerCase();
  const normalizedCorrect = (question.correct_answer ?? '').trim().toLowerCase();
  const isCorrect = normalizedStudent === normalizedCorrect;
  const answeredAt = createAttempt({
    question_id,
    student_answer,
    is_correct: isCorrect,
    score: isCorrect ? 1 : 0,
    max_score: 1,
    feedback: isCorrect ? '回答正确。' : '回答错误，已加入错题本。',
    mistake_tags: isCorrect ? [] : ['concept_gap']
  });

  if (!isCorrect) {
    upsertMistake({
      question_id,
      question_type: question.type,
      student_answer,
      correct_answer: question.correct_answer ?? '',
      explanation: question.explanation ?? '',
      mistake_tags: ['concept_gap'],
      answered_at: answeredAt
    });
  }

  res.json({
    result: {
      question_id,
      is_correct: isCorrect,
      score: isCorrect ? 1 : 0,
      max_score: 1,
      should_add_to_mistakes: !isCorrect
    }
  });
});

attemptsRouter.post('/short-answer-result', (req, res) => {
  const result = req.body?.result;

  if (!result?.question_id || typeof result.student_answer !== 'string') {
    res.status(400).json({ error: 'Codex grade result JSON is required' });
    return;
  }

  const answeredAt = createAttempt({
    question_id: result.question_id,
    student_answer: result.student_answer,
    is_correct: Boolean(result.is_correct),
    score: Number(result.score ?? 0),
    max_score: Number(result.max_score ?? 0),
    feedback: result.feedback ?? null,
    mistake_tags: Array.isArray(result.mistake_tags) ? result.mistake_tags : []
  });

  if (result.should_add_to_mistakes && result.mistake_record) {
    upsertMistake({
      question_id: result.question_id,
      question_type: result.mistake_record.question_type ?? 'short_answer',
      student_answer: result.student_answer,
      correct_answer: result.correct_answer ?? '',
      explanation: result.explanation ?? '',
      mistake_tags: Array.isArray(result.mistake_tags) ? result.mistake_tags : ['concept_gap'],
      answered_at: answeredAt
    });
  }

  res.json({ saved: true });
});

export function upsertMistake(input: {
  question_id: string;
  question_type: string;
  student_answer: string;
  correct_answer: string;
  explanation: string;
  mistake_tags: string[];
  answered_at: string;
}) {
  db.prepare(`
    INSERT INTO mistakes (
      id, question_id, question_type, student_answer, correct_answer,
      explanation, mistake_tags_json, last_answered_at, wrong_count
    ) VALUES (
      lower(hex(randomblob(16))), @question_id, @question_type, @student_answer, @correct_answer,
      @explanation, @mistake_tags_json, @last_answered_at, 1
    )
    ON CONFLICT(question_id) DO UPDATE SET
      student_answer = excluded.student_answer,
      correct_answer = excluded.correct_answer,
      explanation = excluded.explanation,
      mistake_tags_json = excluded.mistake_tags_json,
      last_answered_at = excluded.last_answered_at,
      wrong_count = wrong_count + 1
  `).run({
    question_id: input.question_id,
    question_type: input.question_type,
    student_answer: input.student_answer,
    correct_answer: input.correct_answer,
    explanation: input.explanation,
    mistake_tags_json: JSON.stringify(input.mistake_tags),
    last_answered_at: input.answered_at
  });
}
