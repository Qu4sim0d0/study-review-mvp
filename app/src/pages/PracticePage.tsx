import { CheckCircle2, Copy, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, parseJsonField, type QuestionsResponse } from '../lib/api';
import { buildShortAnswerPrompt, normalizeAnswer } from '../lib/grading';
import type { StoredQuestion } from '../types/schema';

export default function PracticePage() {
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [gradeJson, setGradeJson] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [currentCompleted, setCurrentCompleted] = useState(false);
  const [objectiveResult, setObjectiveResult] = useState<{
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
  } | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiGet<QuestionsResponse>('/api/questions/unattempted')
      .then((data) => setQuestions(data.questions))
      .catch((error) => setMessage(error instanceof Error ? error.message : '读取题目失败'));
  }, []);

  const question = questions[index];
  const options = useMemo(
    () => parseJsonField<{ key: string; text: string }[]>(question?.options_json, []),
    [question]
  );

  function moveToNextQuestion() {
    if (!question) return;
    if (currentCompleted) {
      setQuestions((current) => {
        const next = current.filter((item) => item.id !== question.id);
        setIndex((currentIndex) => Math.min(currentIndex, Math.max(0, next.length - 1)));
        return next;
      });
    } else {
      setIndex((currentIndex) => Math.min(questions.length - 1, currentIndex + 1));
    }
    setAnswer('');
    setGradeJson('');
    setLastPrompt('');
    setObjectiveResult(null);
    setCurrentCompleted(false);
    setMessage('');
  }

  async function submitObjective() {
    if (!question) return;
    try {
      const result = await apiPost<{ result: { is_correct: boolean } }>('/api/attempts/objective', {
        question_id: question.id,
        student_answer: answer
      });
      setObjectiveResult({
        isCorrect: result.result.is_correct,
        studentAnswer: answer,
        correctAnswer: question.correct_answer ?? '',
        explanation: question.explanation ?? ''
      });
      setMessage(result.result.is_correct ? '回答正确。' : '回答错误，已加入错题本。');
      setCurrentCompleted(true);
      setAnswer('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '提交失败');
    }
  }

  async function saveShortAnswerResult() {
    try {
      const parsed = JSON.parse(gradeJson);
      await apiPost('/api/attempts/short-answer-result', parsed);
      setMessage('阅卷结果已保存。');
      setCurrentCompleted(true);
      setAnswer('');
      setGradeJson('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  }

  async function copyPrompt() {
    if (!question) return;
    const prompt = buildShortAnswerPrompt(question, answer);
    setLastPrompt(prompt);

    try {
      await navigator.clipboard.writeText(prompt);
      setMessage('已复制轻量阅卷请求，只包含题目 ID、数据库定位和你的答案。');
    } catch {
      setMessage('浏览器阻止了自动复制，请从下方文本框手动复制。');
    }
  }

  if (!question) {
    return (
      <div className="empty">
        <h2>还没有题目</h2>
        <p>先导入题库或样例题。</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h2>练习</h2>
          <p>
            第 {index + 1} / {questions.length} 题 · {question.type}
          </p>
        </div>
        <div className="pager">
          <button
            className="secondary"
            onClick={() => {
              setIndex(Math.max(0, index - 1));
              setAnswer('');
              setGradeJson('');
              setLastPrompt('');
              setObjectiveResult(null);
              setCurrentCompleted(false);
              setMessage('');
            }}
          >
            上一题
          </button>
          <button
            className="secondary"
            onClick={moveToNextQuestion}
          >
            下一题
          </button>
        </div>
      </header>

      <section className="questionBlock">
        <div className="meta">
          <span>{question.difficulty}</span>
          {parseJsonField<string[]>(question.knowledge_points_json, []).map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
        <h3>{question.stem}</h3>

        {question.type === 'single_choice' && (
          <div className="options">
            {options.map((option) => (
              <button
                key={option.key}
                className={answer === option.key ? 'option selected' : 'option'}
                onClick={() => setAnswer(option.key)}
              >
                <strong>{option.key}</strong>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="options two">
            {[
              ['true', '正确'],
              ['false', '错误']
            ].map(([value, label]) => (
              <button
                key={value}
                className={normalizeAnswer(answer) === value ? 'option selected' : 'option'}
                onClick={() => setAnswer(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {question.type === 'short_answer' && (
          <textarea
            className="answerInput"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="输入你的简答题答案"
          />
        )}

        {question.type !== 'short_answer' ? (
          <button className="primary" onClick={submitObjective} disabled={!answer}>
            <CheckCircle2 size={16} />
            本地判分
          </button>
        ) : (
          <div className="shortAnswerFlow">
            <button className="primary" onClick={copyPrompt} disabled={!answer.trim()}>
              <Copy size={16} />
              复制给 Codex 阅卷
            </button>
            {lastPrompt && (
              <div>
                <p className="fieldLabel">复制给 Codex 的轻量定位请求</p>
                <textarea className="jsonInput small" value={lastPrompt} readOnly spellCheck={false} />
              </div>
            )}
            <p className="fieldLabel">Codex 返回的 grade_answer JSON</p>
            <textarea
              className="jsonInput small"
              value={gradeJson}
              onChange={(event) => setGradeJson(event.target.value)}
              placeholder="把 Codex 返回的 JSON 粘贴到这里"
              spellCheck={false}
            />
            <button className="secondary" onClick={saveShortAnswerResult} disabled={!gradeJson.trim()}>
              <Send size={16} />
              保存阅卷结果
            </button>
          </div>
        )}

        {objectiveResult && (
          <div className={objectiveResult.isCorrect ? 'answerResult correct' : 'answerResult wrong'}>
            <p><strong>你的答案：</strong>{objectiveResult.studentAnswer}</p>
            <p><strong>正确答案：</strong>{objectiveResult.correctAnswer}</p>
            <p><strong>解析：</strong>{objectiveResult.explanation}</p>
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>
    </div>
  );
}
