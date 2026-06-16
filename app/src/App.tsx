import { BookOpen, ClipboardList, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import ImportPage from './pages/ImportPage';
import PracticePage from './pages/PracticePage';
import MistakesPage from './pages/MistakesPage';

type Page = 'import' | 'practice' | 'mistakes';

const nav = [
  { id: 'import' as const, label: '导入', icon: ClipboardList },
  { id: 'practice' as const, label: '练习', icon: BookOpen },
  { id: 'mistakes' as const, label: '错题', icon: RotateCcw }
];

export default function App() {
  const [page, setPage] = useState<Page>('import');

  return (
    <main className="shell">
      <aside className="sidebar">
        <div>
          <h1>Study Review</h1>
          <p>本地题库与错题复练</p>
        </div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={page === item.id ? 'nav active' : 'nav'}
                onClick={() => setPage(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="content">
        {page === 'import' && <ImportPage onImported={() => setPage('practice')} />}
        {page === 'practice' && <PracticePage />}
        {page === 'mistakes' && <MistakesPage />}
      </section>
    </main>
  );
}
