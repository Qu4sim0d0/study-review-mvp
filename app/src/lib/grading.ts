import type { StoredQuestion } from '../types/schema';

export function buildShortAnswerPrompt(question: StoredQuestion, studentAnswer: string) {
  return {
    schema_version: '1.0',
    action: 'grade_answer',
    question: {
      id: question.id,
      type: 'short_answer',
      stem: question.stem,
      reference_answer: question.reference_answer ?? question.correct_answer ?? '',
      rubric: question.rubric_json ? JSON.parse(question.rubric_json) : [],
      max_score: question.max_score ?? 10,
      knowledge_points: question.knowledge_points_json ? JSON.parse(question.knowledge_points_json) : []
    },
    student_answer: studentAnswer
  };
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}
