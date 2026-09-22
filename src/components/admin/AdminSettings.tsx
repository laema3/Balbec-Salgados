import React, { useState, useEffect } from 'react';
import { Settings, Clock, ShieldCheck, CreditCard, RotateCcw, Check, Building2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { SystemSettings } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e: any) {
      showToast(`Erro ao carregar configurações: ${e.message}`, 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      showToast('Configurações gerais salvas com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao salvar configurações: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Deseja recarregar o banco de dados para os valores de demonstração padrão da Balbec?')) return;
    try {
      await api.resetDatabase();
      showToast('Dados restaurados com sucesso! Recarregando...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      showToast(`Erro ao restaurar banco de dados: ${e.message}`, 'error');
    }
  };

  if (!settings) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Configurações Gerais do Sistema
          </h2>
          <p className="text-xs text-stone-500">
            Parâmetros da fábrica, tempo de preparo de salgados e chaves de pagamento.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Dados Demo</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Dados da Empresa */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Dados da Empresa & Logomarca</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Nome da Empresa / Fábrica</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Telefone Principal</label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">WhatsApp de Contato / Pedidos</label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">URL da Logomarca (Logo)</label>
              <input
                type="text"
                value={settings.logo_url}
                onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* Agente de I.A. Balbec */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Settings className="w-4 h-4 text-amber-600" />
            <span>Agente de I.A. Balbec (Assistente Inteligente)</span>
          </h3>
          <p className="text-[11px] text-stone-500">
            Insira sua chave de API do Gemini e alimente o agente com novas ideias, regras e funcionalidades para conversar com os franqueados 24h.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Chave API do Agente de I.A. (Gemini API Key)</label>
              <input
                type="password"
                placeholder="Deixe em branco para usar a chave padrão do sistema"
                value={settings.ai_api_key || ''}
                onChange={e => setSettings({ ...settings, ai_api_key: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <input
                type="checkbox"
                id="aiEnabled"
                checked={settings.ai_enabled}
                onChange={e => setSettings({ ...settings, ai_enabled: e.target.checked })}
                className="rounded text-amber-600"
              />
              <label htmlFor="aiEnabled" className="cursor-pointer">
                <span className="font-bold text-stone-900 block">Ativar Agente de I.A. no Portal</span>
                <span className="text-[10px] text-stone-500 block">Exibe o widget de chat flutuante para os franqueados.</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Prompt do Sistema & Instruções da I.A.</label>
            <textarea
              rows={3}
              value={settings.ai_system_prompt || ''}
              onChange={e => setSettings({ ...settings, ai_system_prompt: e.target.value })}
              className="w-full p-3 rounded-xl border border-stone-200 font-mono text-[11px]"
              placeholder="Instruções de comportamento do assistente..."
            />
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Base de Conhecimento, Novas Ideias & Funcionalidades para Alimentar a I.A.</label>
            <textarea
              rows={3}
              value={settings.ai_knowledge_base || ''}
              onChange={e => setSettings({ ...settings, ai_knowledge_base: e.target.value })}
              className="w-full p-3 rounded-xl border border-stone-200 font-mono text-[11px]"
              placeholder="Insira regras comerciais, novas ideias de combos, FAQs ou diretrizes para a I.A. aprender automaticamente..."
            />
          </div>
        </div>

        {/* Parâmetros Operacionais */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Operação & Preparo de Pedidos</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Tempo Padrão de Preparo (Minutos)
              </label>
              <input
                type="number"
                min="10"
                max="180"
                value={settings.default_prep_minutes}
                onChange={e => setSettings({ ...settings, default_prep_minutes: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-amber-900 text-sm focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Configurado por padrão para 50 minutos para retirada no balcão da fábrica.
              </span>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                WhatsApp da Expedição Balbec
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Exibido para os franqueados para contato direto e suporte.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <input
                type="checkbox"
                id="rulesEnforced"
                checked={settings.enforce_commercial_rules}
                onChange={e => setSettings({ ...settings, enforce_commercial_rules: e.target.checked })}
                className="rounded text-amber-600"
              />
              <label htmlFor="rulesEnforced" className="cursor-pointer">
                <span className="font-bold text-stone-900 block">Exigir Regras Comerciais</span>
                <span className="text-[10px] text-stone-500 block">
                  Bloqueia/retém pedidos abaixo do valor mínimo contratual.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <input
                type="checkbox"
                id="ordersOpen"
                checked={settings.orders_enabled}
                onChange={e => setSettings({ ...settings, orders_enabled: e.target.checked })}
                className="rounded text-amber-600"
              />
              <label htmlFor="ordersOpen" className="cursor-pointer">
                <span className="font-bold text-stone-900 block">Recepção de Pedidos Aberta</span>
                <span className="text-[10px] text-stone-500 block">
                  Desmarcar suspende temporariamente novos pedidos no catálogo.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Pagamento PIX e Dados Bancários */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Dados para Faturamento & PIX</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Chave PIX da Fábrica
              </label>
              <input
                type="text"
                value={settings.pix_key}
                onChange={e => setSettings({ ...settings, pix_key: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Instituição Bancária
              </label>
              <input
                type="text"
                value={settings.pix_bank}
                onChange={e => setSettings({ ...settings, pix_bank: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <span>Salvar Parâmetros</span>
          </button>
        </div>
      </form>
    </div>
  );
};
