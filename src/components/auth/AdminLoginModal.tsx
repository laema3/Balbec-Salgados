import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@balbec.com.br');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar como administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-stone-950 font-black shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Acesso Administrativo Balbec</h3>
          <p className="text-xs text-stone-500">
            Área restrita à diretoria e gestores da fábrica. Entre com as credenciais de administração.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-stone-700 font-bold mb-1 text-xs">E-mail do Administrador</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1 text-xs">Senha de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Entrar no Painel Admin</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
