import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore, type User } from './api';

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
    (async () => {
      try {
        const token = await tokenStore.get();
        if (token) {
          const data = await api.get<{ user: User }>('/api/auth/me');
          setUser(data.user);
        }
      } catch {
        await tokenStore.clear();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>(
      '/api/auth/login',
      { email, password }
    );
    await tokenStore.set(data.token);
    setUser(data.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>(
      '/api/auth/register',
      { name, email, password }
    );
    await tokenStore.set(data.token);
    setUser(data.user);
  };

  const signOut = async () => {
    await tokenStore.clear();
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
