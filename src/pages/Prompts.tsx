import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Prompts.module.css';

type Prompt = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  visibility: 'public' | 'private';
  upvotes: number;
};

export function Prompts() {
  const { api } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await api.get<Prompt[]>('/api/prompts');
      setPrompts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prompts');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/prompts', {
        title,
        content,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        visibility,
      });
      setTitle('');
      setContent('');
      setTags('');
      setVisibility('private');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create prompt');
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>Prompt Library</h1>
        <Link to="/" className={styles.link}>
          Back to chats
        </Link>
      </header>

      <form className={styles.form} onSubmit={onCreate}>
        <input
          className={styles.input}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className={styles.textarea}
          placeholder="Prompt content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
        />
        <input
          className={styles.input}
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <select
          className={styles.input}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        <button className={styles.button} type="submit">
          Save prompt
        </button>
        {error && <div className={styles.error}>{error}</div>}
      </form>

      <div className={styles.list}>
        {prompts.length === 0 ? (
          <div className={styles.empty}>No prompts yet.</div>
        ) : (
          prompts.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitle}>{p.title}</div>
                <div className={styles.badges}>
                  <span className={styles.badge}>{p.visibility}</span>
                  {p.tags.map((t) => (
                    <span key={t} className={styles.badgeSecondary}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <pre className={styles.cardBody}>{p.content}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

