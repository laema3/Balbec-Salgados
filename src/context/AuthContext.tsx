import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Franchisee } from '../types.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  franchisee: Franchisee | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [franchisee, setFranchisee] = useState<Franchisee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Exigir login com CNPJ e senha a cada acesso
    localStorage.removeItem('balbec_auth_email');
    setUser(null);
    setFranchisee(null);
    setIsLoading(false);
  }, []);

  const loadUser = async (email: string) => {
    try {
      const res = await api.login(email);
      setUser(res.user);
      setFranchisee(res.franchisee || null);
      localStorage.setItem('balbec_auth_email', email);
    } catch (err) {
      console.warn('Erro ao carregar usuário salvo:', err);
      setUser(null);
      setFranchisee(null);
      localStorage.removeItem('balbec_auth_email');
    }
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email);
      setUser(res.user);
      setFranchisee(res.franchisee || null);
      localStorage.setItem('balbec_auth_email', email);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setFranchisee(null);
    localStorage.removeItem('balbec_auth_email');
  };

  const quickSwitch = async (email: string) => {
    await loadUser(email);
  };

  const refreshProfile = async () => {
    if (user?.email) {
      await loadUser(user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        franchisee,
        isLoading,
        login,
        logout,
        quickSwitch,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
