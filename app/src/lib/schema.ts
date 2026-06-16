import { z } from 'zod';

const questionType = z.enum(['single_choice', 'true_false', 'short_answer']);
const mistakeTag = z.enum([
  'concept_gap',
  'memory_gap',
  'careless',
  'incomplete_answer',
  'misread_question',
  'calculation_error',
  'unclear_expression'
]);

export const optionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1)
});

export const rubricSchema = z.object({
  point: z.string().min(1),
  score: z.number().nonnegative()
});

export const questionSchema = z.object({
  id: z.string().min(1),
  type: questionType,
  stem: z.string().min(1),
  options: z.array(optionSchema).optional(),
  correct_answer: z.string().min(1),
  reference_answer: z.string().optional(),
  explanation: z.string().min(1),
  knowledge_points: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  rubric: z.array(rubricSchema).optional(),
  max_score: z.number().nonnegative().optional()
});

export const questionBankSchema = z.object({
  schema_version: z.literal('1.0'),
  action: z.enum(['generate_questions', 'extract_question_bank']),
  questions: z.array(questionSchema)
});

export const gradeAnswerRequestSchema = z.object({
  schema_version: z.literal('1.0'),
  action: z.literal('grade_answer'),
  question: z.object({
    id: z.string().min(1),
    type: z.literal('short_answer'),
    stem: z.string().min(1),
    reference_answer: z.string().min(1),
    rubric: z.array(rubricSchema),
    max_score: z.number().nonnegative(),
    knowledge_points: z.array(z.string())
  }),
  student_answer: z.string().min(1)
});

export const explainQuestionRequestSchema = z.object({
  schema_version: z.literal('1.0'),
  action: z.literal('explain_question'),
  question: z.object({
    id: z.string().min(1),
    type: questionType,
    stem: z.string().min(1),
    options: z.array(optionSchema).optional(),
    correct_answer: z.string().min(1),
    reference_answer: z.string().optional(),
    knowledge_points: z.array(z.string())
  }),
  student_answer: z.string().min(1)
});

export const mistakeRecordSchema = z.object({
  question_id: z.string().min(1),
  question_type: questionType,
  stem: z.string().min(1),
  student_answer: z.string().min(1),
  correct_answer: z.string().min(1),
  explanation: z.string().min(1),
  mistake_tags: z.array(mistakeTag),
  answered_at: z.string().min(1)
});

export const reviewMistakesRequestSchema = z.object({
  schema_version: z.literal('1.0'),
  action: z.literal('review_mistakes'),
  mistakes: z.array(mistakeRecordSchema)
});

export type QuestionBankInput = z.infer<typeof questionBankSchema>;
export type GradeAnswerInput = z.infer<typeof gradeAnswerRequestSchema>;
export type ExplainQuestionInput = z.infer<typeof explainQuestionRequestSchema>;
export type ReviewMistakesInput = z.infer<typeof reviewMistakesRequestSchema>;
export type MistakeTagValue = z.infer<typeof mistakeTag>;
