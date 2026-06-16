import type { StoredQuestion } from '../types/schema';

export function buildShortAnswerPrompt(question: StoredQuestion, studentAnswer: string) {
  const payload = {
    schema_version: '1.0',
    action: 'grade_answer',
    lookup: {
      database: 'data/study.sqlite',
      table: 'questions',
      question_id: question.id
    },
    student_answer: studentAnswer
  };

  return `使用 $study-review-protocol 阅卷。请根据 question_id 从本项目 SQLite 题库定位题目，只返回 grade_answer JSON。\n\n${JSON.stringify(payload, null, 2)}`;
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}
