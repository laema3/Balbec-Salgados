import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, Smartphone, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { SystemSettings } from '../../types.js';

export const AdminNtfy: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      alert('Configuração do NTFY salva com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testNtfy();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Notificações Push Instantâneas (NTFY)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              Expedição Balbec
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Alertas em tempo real para novos pedidos no balcão da fábrica e celulares dos operadores.
          </p>
        </div>

        <button
          onClick={handleSendTest}
          disabled={isTesting}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isTesting ? 'Disparando...' : 'Testar Disparo Push'}</span>
        </button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Guide Card */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <Smartphone className="w-4 h-4" />
          <span>Como monitorar os pedidos no celular sem custo</span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          Instale o aplicativo <strong>ntfy</strong> (disponível na Google Play e App Store) ou abra pelo navegador em <code>https://ntfy.sh</code>. Inscreva-se no tópico cadastrado abaixo (ex: <code>balbec-pedidos-fabrica</code>). A cada pedido realizado por um franqueado, a fábrica receberá um alerta sonoro com o número do pedido e resumo dos salgados!
        </p>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4 text-xs">
        <h3 className="font-extrabold text-sm text-stone-900">Parâmetros do Servidor NTFY</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Servidor NTFY (Base URL)
            </label>
            <input
              type="text"
              value={settings.ntfy_url}
              onChange={e => setSettings({ ...settings, ntfy_url: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 font-mono text-xs focus:ring-2 focus:ring-amber-500"
              placeholder="https://ntfy.sh"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Nome do Tópico (Topic)
            </label>
            <input
              type="text"
              value={settings.ntfy_topic}
              onChange={e => setSettings({ ...settings, ntfy_topic: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 font-mono text-xs focus:ring-2 focus:ring-amber-500"
              placeholder="ex: balbec-expedicao-pedidos"
            />
          </div>
        </div>

        <div>
          <label className="block text-stone-700 font-semibold mb-1">
            Token de Autenticação Bearer (Opcional para servidores privados)
          </label>
          <input
            type="password"
            value={settings.ntfy_token}
            onChange={e => setSettings({ ...settings, ntfy_token: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-stone-200 font-mono text-xs focus:ring-2 focus:ring-amber-500"
            placeholder="tk_xxxxxxxxxxxxxxxxx"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="ntfyEnabled"
            checked={settings.ntfy_enabled}
            onChange={e => setSettings({ ...settings, ntfy_enabled: e.target.checked })}
            className="rounded text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="ntfyEnabled" className="text-stone-800 font-semibold cursor-pointer">
            Ativar envio automático de notificações NTFY em novos pedidos
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};
