export type QuestionType = 'single_choice' | 'true_false' | 'short_answer';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type MistakeTag =
  | 'concept_gap'
  | 'memory_gap'
  | 'careless'
  | 'incomplete_answer'
  | 'misread_question'
  | 'calculation_error'
  | 'unclear_expression';

export type JsonQuestion = {
  id: string;
  type: QuestionType;
  stem: string;
  options?: { key: string; text: string }[];
  correct_answer: string;
  reference_answer?: string;
  explanation: string;
  knowledge_points: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  rubric?: { point: string; score: number }[];
  max_score?: number;
};

export type QuestionBank = {
  schema_version: '1.0';
  action: 'generate_questions' | 'extract_question_bank';
  questions: JsonQuestion[];
};

export type GradeAnswerRequest = {
  schema_version: '1.0';
  action: 'grade_answer';
  question: {
    id: string;
    type: 'short_answer';
    stem: string;
    reference_answer: string;
    rubric: { point: string; score: number }[];
    max_score: number;
    knowledge_points: string[];
  };
  student_answer: string;
};

export type GradeAnswerResponse = {
  schema_version: '1.0';
  action: 'grade_answer';
  result: {
    question_id: string;
    is_correct: boolean;
    score: number;
    max_score: number;
    student_answer: string;
    correct_answer: string;
    explanation: string;
    feedback: string;
    mistake_tags: MistakeTag[];
    should_add_to_mistakes: boolean;
    mistake_record?: MistakeRecord;
  };
};

export type ExplainQuestionRequest = {
  schema_version: '1.0';
  action: 'explain_question';
  question: {
    id: string;
    type: QuestionType;
    stem: string;
    options?: { key: string; text: string }[];
    correct_answer: string;
    reference_answer?: string;
    knowledge_points: string[];
  };
  student_answer: string;
};

export type ExplainQuestionResponse = {
  schema_version: '1.0';
  action: 'explain_question';
  explanation: {
    question_id: string;
    summary: string;
    key_points: string[];
    why_correct: string;
    why_student_answer_wrong: string;
    mistake_tags: MistakeTag[];
    suggested_review: string;
  };
};

export type ReviewMistakesRequest = {
  schema_version: '1.0';
  action: 'review_mistakes';
  mistakes: MistakeRecord[];
};

export type ReviewMistakesResponse = {
  schema_version: '1.0';
  action: 'review_mistakes';
  review: {
    items: {
      question_id: string;
      mistake_tags: MistakeTag[];
      feedback: string;
      suggested_action: string;
    }[];
  };
};

export type MistakeRecord = {
  question_id: string;
  question_type: QuestionType;
  stem: string;
  student_answer: string;
  correct_answer: string;
  explanation: string;
  mistake_tags: MistakeTag[];
  answered_at: string;
};

export type StoredQuestion = {
  id: string;
  type: QuestionType;
  stem: string;
  options_json: string | null;
  correct_answer: string | null;
  reference_answer: string | null;
  explanation: string | null;
  rubric_json: string | null;
  max_score: number | null;
  knowledge_points_json: string | null;
  difficulty: Difficulty;
  created_at: string;
};

export type Attempt = {
  id: string;
  question_id: string;
  student_answer: string;
  is_correct: number;
  score: number | null;
  max_score: number | null;
  feedback: string | null;
  mistake_tags_json: string | null;
  answered_at: string;
};

export type MistakeRow = {
  id: string;
  question_id: string;
  question_type: QuestionType;
  student_answer: string;
  correct_answer: string | null;
  explanation: string | null;
  mistake_tags_json: string | null;
  last_answered_at: string;
  wrong_count: number;
};
