import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Auth.module.css';

export function Register() {
  const navigate = useNavigate();
  const { api, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: { id: string; email: string } }>(
        '/api/auth/register',
        { email, password }
      );
      login(res.token, res.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1>Register</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.label}>
          Password (8+ chars)
          <input
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

