import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { ApiClient } from '../services/apiClient';

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  api: ApiClient;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'ai-study-hub-token';
const USER_KEY = 'ai-study-hub-user';

function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [user, setUser] = useState<User | null>(() => loadUser());

  const api = useMemo(
    () =>
      new ApiClient({
        getToken: () => token,
      }),
    [token]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      api,
      login: (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
        localStorage.setItem(TOKEN_KEY, nextToken);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      },
    }),
    [token, user, api]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

