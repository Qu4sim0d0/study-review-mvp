import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { questionBankSchema } from '../../src/lib/schema.js';

export const questionsRouter = Router();

function importQuestionBank(input: unknown) {
  const parsed = questionBankSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: 'Invalid question bank JSON', issues: parsed.error.issues };
  }

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO questions (
      id, type, stem, options_json, correct_answer, reference_answer, explanation,
      rubric_json, max_score, knowledge_points_json, difficulty, created_at
    ) VALUES (
      @id, @type, @stem, @options_json, @correct_answer, @reference_answer, @explanation,
      @rubric_json, @max_score, @knowledge_points_json, @difficulty, @created_at
    )
  `);

  const transaction = db.transaction(() => {
    for (const q of parsed.data.questions) {
      if (q.type === 'single_choice' && (!q.options || q.options.length < 2)) {
        throw new Error(`Question ${q.id} must include options`);
      }

      if (q.type === 'short_answer' && (!q.reference_answer || !q.rubric || !q.max_score)) {
        throw new Error(`Short answer question ${q.id} must include reference_answer, rubric, and max_score`);
      }

      insert.run({
        id: q.id,
        type: q.type,
        stem: q.stem,
        options_json: q.options ? JSON.stringify(q.options) : null,
        correct_answer: q.correct_answer,
        reference_answer: q.reference_answer ?? null,
        explanation: q.explanation,
        rubric_json: q.rubric ? JSON.stringify(q.rubric) : null,
        max_score: q.max_score ?? null,
        knowledge_points_json: JSON.stringify(q.knowledge_points),
        difficulty: q.difficulty,
        created_at: now
      });
    }
  });

  try {
    transaction();
    return { ok: true as const, imported: parsed.data.questions.length };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Import failed' };
  }
}

questionsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all();
  res.json({ questions: rows });
});

questionsRouter.post('/import', (req, res) => {
  const result = importQuestionBank(req.body);
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

questionsRouter.post('/sample', (_req, res) => {
  const sample = {
    schema_version: '1.0',
    action: 'generate_questions',
    questions: [
      {
        id: 'sample_choice_001',
        type: 'single_choice',
        stem: '下列哪一项最符合“错题本”在本系统中的职责？',
        options: [
          { key: 'A', text: '保存所有课程原文' },
          { key: 'B', text: '保存答错题目和复练状态' },
          { key: 'C', text: '替代 Codex 进行出题' },
          { key: 'D', text: '管理用户登录' }
        ],
        correct_answer: 'B',
        explanation: '错题本只保存错误记录和复练状态，不保存课程全文，也不负责出题或登录。',
        knowledge_points: ['系统职责划分'],
        difficulty: 'easy'
      },
      {
        id: 'sample_tf_001',
        type: 'true_false',
        stem: '本系统第一版中，选择题和判断题应由本地应用判分。',
        correct_answer: 'true',
        explanation: '客观题有明确答案，不需要交给 Codex 阅卷。',
        knowledge_points: ['本地判分'],
        difficulty: 'easy'
      },
      {
        id: 'sample_short_001',
        type: 'short_answer',
        stem: '为什么本系统要让 Codex 每次只处理单题或小批量题？',
        correct_answer: '为了减少上下文长度，降低幻觉风险，并让输出更容易被固定 JSON schema 校验。',
        reference_answer: '为了减少上下文长度，降低幻觉风险，并让输出更容易被固定 JSON schema 校验。',
        explanation: '单题或小批量处理可以避免把整份课程文档反复塞进上下文。',
        knowledge_points: ['上下文控制', 'JSON 协议'],
        difficulty: 'medium',
        rubric: [
          { point: '提到减少上下文长度', score: 3 },
          { point: '提到降低幻觉风险', score: 3 },
          { point: '提到固定 JSON 或结构化输出', score: 4 }
        ],
        max_score: 10
      }
    ]
  };

  const result = importQuestionBank(sample);
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

export function getQuestionById(id: string) {
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
}

export function createAttempt(input: {
  question_id: string;
  student_answer: string;
  is_correct: boolean;
  score?: number | null;
  max_score?: number | null;
  feedback?: string | null;
  mistake_tags?: string[] | null;
  answered_at?: string;
}) {
  const answeredAt = input.answered_at ?? new Date().toISOString();
  db.prepare(`
    INSERT INTO attempts (
      id, question_id, student_answer, is_correct, score, max_score,
      feedback, mistake_tags_json, answered_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    input.question_id,
    input.student_answer,
    input.is_correct ? 1 : 0,
    input.score ?? null,
    input.max_score ?? null,
    input.feedback ?? null,
    input.mistake_tags ? JSON.stringify(input.mistake_tags) : null,
    answeredAt
  );

  return answeredAt;
}
