import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Store, ShieldCheck, Lock, Building2, KeyRound, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC<{ onSwitchToRegister?: () => void }> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [cnpjOrEmail, setCnpjOrEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpjOrEmail.trim()) {
      setError('Informe o CNPJ ou e-mail de acesso.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isEmail = cnpjOrEmail.includes('@');
      if (isEmail) {
        await login(cnpjOrEmail);
      } else {
        // Tentar login por CNPJ chamando api diretamente ou passando via login do AuthContext
        // Como o AuthContext usa api.login(email), vamos ajustar AuthContext ou criar um método dedicado
        // Vamos usar fetch direto ou adaptar
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cnpj: cnpjOrEmail, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao autenticar');
        // Recarregar via login com email do usuário retornado
        await login(data.user.email);
      }
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (identifier: string) => {
    setCnpjOrEmail(identifier);
    setPassword('123456');
    setLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes('@');
      const body = isEmail ? { email: identifier } : { cnpj: identifier };
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      await login(data.user.email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Top Banner */}
        <div className="bg-stone-900 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-amber-500 text-stone-950 rounded-2xl mx-auto flex items-center justify-center shadow-lg font-black text-2xl mb-4">
            B
          </div>
          <h1 className="text-2xl font-black tracking-tight">Balbec Salgados</h1>
          <p className="text-stone-400 text-xs mt-1 font-medium">Portal B2B Exclusivo para Franqueados</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-stone-900">Acesso Restrito</h2>
            <p className="text-xs text-stone-500">Entre com o CNPJ da sua franquia ou e-mail cadastrado.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Acesso Instantâneo Local (Sem Confirmação) */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@balbec.com.br')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Acesso Instantâneo Local (Sem Senha)</span>
            </button>
            <p className="text-[10px] text-stone-400 text-center mt-1.5 font-medium">
              Ideal para uso local imediato e sem barreiras de confirmação.
            </p>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-stone-400 bg-white px-2">ou acesso por CNPJ / E-mail</div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                CNPJ do Franqueado ou E-mail
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: 28.431.982/0001-44 ou admin@balbec.com.br"
                  value={cnpjOrEmail}
                  onChange={(e) => setCnpjOrEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Entrar no Sistema</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3 text-center">
              Acesso Rápido para Testes
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('28.431.982/0001-44')}
                className="p-2.5 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl text-left transition"
              >
                <div className="text-xs font-bold text-stone-900">Loja Centro</div>
                <div className="text-[10px] text-stone-500 font-mono">28.431.982/0001-44</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('34.819.201/0001-92')}
                className="p-2.5 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl text-left transition"
              >
                <div className="text-xs font-bold text-stone-900">Shopping Blvd</div>
                <div className="text-[10px] text-stone-500 font-mono">34.819.201/0001-92</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('31.902.118/0001-55')}
                className="p-2.5 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl text-left transition"
              >
                <div className="text-xs font-bold text-stone-900">Itaquera Master</div>
                <div className="text-[10px] text-stone-500 font-mono">31.902.118/0001-55</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin@balbec.com.br')}
                className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-left transition"
              >
                <div className="text-xs font-bold text-amber-400">Admin Balbec</div>
                <div className="text-[10px] text-stone-400">Painel Master</div>
              </button>
            </div>
          </div>

          {onSwitchToRegister && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
              >
                Ainda não tem franquia? Cadastre-se aqui
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
