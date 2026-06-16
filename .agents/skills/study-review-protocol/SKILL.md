---
name: study-review-protocol
description: Token-efficient protocol for a local study-review app. Use when Codex must generate quiz questions, extract a question bank, grade one short-answer response, explain one question, review or explain a small mistake batch, or query the local SQLite question/mistake store for study feedback.
---

# Study Review Protocol

Act as the stateless AI layer for the local review app. Minimize context and work.

## Token Budget Rules

- Do the smallest task that satisfies the user request.
- Prefer one question or a small batch. Default batch limit: 10 questions or 10 mistakes.
- Do not reread course text, database rows, or schema if the user already supplied the needed JSON.
- Do not summarize the whole course unless explicitly asked.
- For local data questions, query only required columns and use `LIMIT`.
- For writes, prefer the app API; for analysis, read SQLite directly.
- Output JSON only for app-facing actions. If the user asks for student-facing explanation, use natural language.
- If `grade_answer` input provides `lookup.question_id` instead of a full question, fetch that single row from `questions` first.

## Local Project Locator

When working inside this project, use:

- Database: `data/study.sqlite`
- Schema source: `app/server/schema.sql`
- Tables: `questions`, `attempts`, `mistakes`, `tags`
- API base when server is running: `http://localhost:8787/api`

Useful read queries:

```sql
SELECT id,type,stem,correct_answer,reference_answer,explanation,rubric_json,knowledge_points_json
FROM questions
WHERE id = ?
LIMIT 1;
```

```sql
SELECT question_id,question_type,student_answer,correct_answer,explanation,mistake_tags_json,wrong_count,last_answered_at
FROM mistakes
ORDER BY wrong_count DESC,last_answered_at DESC
LIMIT 10;
```

## Actions

Use exactly one action:

- `generate_questions`: create questions from provided text, knowledge points, or existing questions.
- `extract_question_bank`: convert source text into importable questions.
- `grade_answer`: grade one `short_answer`.
- `explain_question`: explain one question.
- `review_mistakes`: review a small mistake batch for app-facing JSON, or explain mistakes in natural language when requested.

## Fixed Enums

Question types: `single_choice`, `true_false`, `short_answer`.

Mistake tags: `concept_gap`, `memory_gap`, `careless`, `incomplete_answer`, `misread_question`, `calculation_error`, `unclear_expression`.

Difficulty: `easy`, `medium`, `hard`.

If no mistake tag fits, use `concept_gap`.

## Compact Field Contracts

Every protocol response:

- Must be valid JSON.
- Must include `schema_version: "1.0"`.
- Must include the matching `action`.

Question object:

- Required common fields: `id`, `type`, `stem`, `correct_answer`, `explanation`, `knowledge_points`, `difficulty`.
- `single_choice`: include `options` as `{key,text}[]`; `correct_answer` is the option key.
- `true_false`: `correct_answer` is `"true"` or `"false"`.
- `short_answer`: include `reference_answer`, `rubric` as `{point,score}[]`, and `max_score`.

Lightweight `grade_answer` input may provide only:

```json
{"schema_version":"1.0","action":"grade_answer","lookup":{"database":"data/study.sqlite","table":"questions","question_id":"q_001"},"student_answer":"..."}
```

For that form, read only the matching `questions` row, parse `rubric_json` and `knowledge_points_json`, then grade normally.

Grade result:

- Return `result.question_id`, `is_correct`, `score`, `max_score`, `student_answer`, `correct_answer`, `explanation`, `feedback`, `mistake_tags`, `should_add_to_mistakes`.
- Include `mistake_record` only when `should_add_to_mistakes` is true.
- Keep `score` between 0 and `max_score`.

Explanation result:

- Return `explanation.question_id`, `summary`, `key_points`, `why_correct`, `why_student_answer_wrong`, `mistake_tags`, `suggested_review`.

Mistake review result:

- For app-facing JSON, return `review.items[]` with `question_id`, `mistake_tags`, `feedback`, `suggested_action`.
- For student-facing explanation, do not output JSON. Explain the knowledge points, likely weak spots, and next review steps concisely.

## Minimal Output Shapes

For `generate_questions` and `extract_question_bank`:

```json
{"schema_version":"1.0","action":"generate_questions","questions":[]}
```

For `grade_answer`:

```json
{"schema_version":"1.0","action":"grade_answer","result":{"question_id":"","is_correct":false,"score":0,"max_score":0,"student_answer":"","correct_answer":"","explanation":"","feedback":"","mistake_tags":["concept_gap"],"should_add_to_mistakes":true,"mistake_record":{"question_id":"","question_type":"short_answer","stem":"","student_answer":"","correct_answer":"","explanation":"","mistake_tags":["concept_gap"],"answered_at":""}}}
```

For `explain_question`:

```json
{"schema_version":"1.0","action":"explain_question","explanation":{"question_id":"","summary":"","key_points":[],"why_correct":"","why_student_answer_wrong":"","mistake_tags":["concept_gap"],"suggested_review":""}}
```

For `review_mistakes`:

```json
{"schema_version":"1.0","action":"review_mistakes","review":{"items":[]}}
```

Use this JSON shape only when the user or app explicitly asks for JSON.

## Behavior

- For objective questions, generate answers and explanations only; the app grades them.
- For short answers, grade only from the provided stem, reference answer, rubric, and student answer.
- If required input is missing, return JSON with `error.code`, `error.message`, and `missing_fields`.
- Do not invent facts beyond the supplied source. If source support is weak, make fewer questions.
- Keep explanations brief and actionable.
