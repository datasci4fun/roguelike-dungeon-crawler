import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, ApiError } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('access_token'),
    isLoading: true,
    isAuthenticated: false,
  });

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      try {
        const user = await authApi.me();
        setState({
          user: user as User,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('access_token');
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));

    try {
      const { access_token } = await authApi.loginJson(username, password);
      localStorage.setItem('access_token', access_token);

      const user = await authApi.me();

      setState({
        user: user as User,
        token: access_token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(
    async (data: {
      username: string;
      email: string;
      password: string;
      display_name?: string;
    }) => {
      setState((s) => ({ ...s, isLoading: true }));

      try {
        const { access_token } = await authApi.register(data);
        localStorage.setItem('access_token', access_token);

        const user = await authApi.me();

        setState({
          user: user as User,
          token: access_token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        setState((s) => ({ ...s, isLoading: false }));
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    try {
      const user = await authApi.me();
      setState((s) => ({ ...s, user: user as User }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
      }
    }
  }, [state.token, logout]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
