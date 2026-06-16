import { Database, FileJson, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function ImportPage({ onImported }: { onImported: () => void }) {
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function importJson() {
    setBusy(true);
    setMessage('');
    try {
      const parsed = JSON.parse(jsonText);
      const result = await apiPost<{ imported: number }>('/api/questions/import', parsed);
      setMessage(`已导入 ${result.imported} 道题。`);
      onImported();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败');
    } finally {
      setBusy(false);
    }
  }

  async function importSample() {
    setBusy(true);
    setMessage('');
    try {
      const result = await apiPost<{ imported: number }>('/api/questions/sample');
      setMessage(`已导入样例题 ${result.imported} 道。`);
      onImported();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '样例导入失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="pageHeader">
        <div>
          <h2>导入题库</h2>
          <p>粘贴 Codex skill 输出的固定 JSON，应用只保存结构化题库。</p>
        </div>
        <button className="secondary" onClick={importSample} disabled={busy}>
          <Wand2 size={16} />
          导入样例
        </button>
      </header>

      <section className="panel">
        <div className="panelTitle">
          <FileJson size={18} />
          <span>题库 JSON</span>
        </div>
        <textarea
          className="jsonInput"
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          spellCheck={false}
          placeholder='{"schema_version":"1.0","action":"generate_questions","questions":[...]}'
        />
        <div className="actions">
          <button className="primary" onClick={importJson} disabled={busy || !jsonText.trim()}>
            <Database size={16} />
            校验并导入
          </button>
          {message && <span className="message">{message}</span>}
        </div>
      </section>
    </div>
  );
}
