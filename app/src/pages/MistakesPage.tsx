import { ClipboardCopy, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, type MistakesResponse, parseJsonField } from '../lib/api';

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<MistakesResponse['mistakes']>([]);
  const [tag, setTag] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportText, setExportText] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await apiGet<MistakesResponse>('/api/mistakes');
      setMistakes(data.mistakes);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '读取错题失败');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const item of mistakes) {
      parseJsonField<string[]>(item.mistake_tags_json, []).forEach((value) => set.add(value));
    }
    return Array.from(set);
  }, [mistakes]);

  const filtered = tag === 'all'
    ? mistakes
    : mistakes.filter((item) => parseJsonField<string[]>(item.mistake_tags_json, []).includes(tag));

  const selectedMistakes = mistakes.filter((item) => selectedIds.includes(item.question_id));

  function toggleSelected(questionId: string) {
    setSelectedIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ));
  }

  function buildCodexExport() {
    const payload = {
      purpose: 'knowledge_explanation',
      request: '请用自然语言讲解这些错题涉及的知识点，指出共同薄弱点，并给出下一轮复习建议。不要输出 JSON。',
      mistakes: selectedMistakes.map((item) => ({
        question_id: item.question_id,
        type: item.question_type,
        stem: item.stem ?? '',
        student_answer: item.student_answer,
        correct_answer: item.correct_answer ?? '',
        explanation: item.explanation ?? '',
        mistake_tags: parseJsonField<string[]>(item.mistake_tags_json, []),
        wrong_count: item.wrong_count,
        last_answered_at: item.last_answered_at
      }))
    };

    return `使用 $study-review-protocol 分析以下错题。请给学生看的自然语言讲解，不要返回 JSON：\n\n${JSON.stringify(payload, null, 2)}`;
  }

  async function copyExport() {
    if (!selectedMistakes.length) {
      setMessage('请先选择要导出的错题。');
      return;
    }

    const text = buildCodexExport();
    setExportText(text);
    await navigator.clipboard.writeText(text);
    setMessage(`已复制 ${selectedMistakes.length} 道错题，可直接粘贴给 Codex。`);
  }

  async function remove(questionId: string) {
    const response = await fetch(`/api/mistakes/${questionId}`, { method: 'DELETE' });
    if (!response.ok) {
      setMessage(await response.text());
      return;
    }
    await load();
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h2>错题本</h2>
          <p>按错误次数排序，保留最近一次错误答案。</p>
        </div>
        <div className="headerActions">
          <select value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="all">全部标签</option>
            {tags.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <button className="secondary" onClick={() => setSelectedIds(filtered.map((item) => item.question_id))}>
            全选当前
          </button>
          <button className="secondary" onClick={() => setSelectedIds([])}>
            清空
          </button>
          <button className="primary" onClick={copyExport} disabled={!selectedIds.length}>
            <ClipboardCopy size={16} />
            导出给 Codex
          </button>
        </div>
      </header>

      <div className="mistakeList">
        {filtered.map((item) => (
          <article className={selectedIds.includes(item.question_id) ? 'mistakeItem selectedMistake' : 'mistakeItem'} key={item.id}>
            <div className="mistakeTop">
              <div className="selectLine">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.question_id)}
                  onChange={() => toggleSelected(item.question_id)}
                  aria-label={`选择错题 ${item.question_id}`}
                />
                <div>
                  <span className="pill">{item.question_type}</span>
                  <span className="pill danger">错误 {item.wrong_count} 次</span>
                </div>
              </div>
              <button className="iconButton" onClick={() => remove(item.question_id)} title="移除错题">
                <Trash2 size={16} />
              </button>
            </div>
            <h3>{item.stem}</h3>
            <p><strong>我的答案：</strong>{item.student_answer}</p>
            <p><strong>正确答案：</strong>{item.correct_answer}</p>
            <p><strong>解析：</strong>{item.explanation}</p>
            <div className="meta">
              {parseJsonField<string[]>(item.mistake_tags_json, []).map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </article>
        ))}
        {!filtered.length && (
          <div className="empty">
            <RotateCcw size={28} />
            <h2>暂无错题</h2>
            <p>客观题答错或保存简答题阅卷结果后会出现在这里。</p>
          </div>
        )}
      </div>
      {exportText && (
        <section className="panel exportPanel">
          <div className="panelTitle">
            <ClipboardCopy size={18} />
            <span>最近一次导出内容</span>
          </div>
          <textarea className="jsonInput small" value={exportText} readOnly />
        </section>
      )}
      {message && <p className="message">{message}</p>}
    </div>
  );
}
