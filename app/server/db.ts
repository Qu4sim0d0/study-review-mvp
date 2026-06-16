import Database from 'better-sqlite3';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.resolve(process.cwd(), '..', 'data');
const dbPath = path.join(dbDir, 'study.sqlite');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: BetterSqliteDatabase = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      stem TEXT NOT NULL,
      options_json TEXT,
      correct_answer TEXT,
      reference_answer TEXT,
      explanation TEXT,
      rubric_json TEXT,
      max_score INTEGER,
      knowledge_points_json TEXT,
      difficulty TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      student_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      score REAL,
      max_score REAL,
      feedback TEXT,
      mistake_tags_json TEXT,
      answered_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL UNIQUE,
      question_type TEXT NOT NULL,
      student_answer TEXT NOT NULL,
      correct_answer TEXT,
      explanation TEXT,
      mistake_tags_json TEXT,
      last_answered_at TEXT NOT NULL,
      wrong_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      type TEXT NOT NULL
    );
  `);
}
