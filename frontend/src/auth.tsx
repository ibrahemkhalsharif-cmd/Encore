import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import type { User } from './types';

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get<{ user: User }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/auth/login', {
      email,
      password,
    });
    setUser(data.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/auth/register', {
      name,
      email,
      password,
    });
    setUser(data.user);
  };

  const signOut = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
