import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  Database,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { SystemSettings, BluefocusSyncLog, BluefocusQueueItem } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminBluefocus: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [queue, setQueue] = useState<BluefocusQueueItem[]>([]);
  const [logs, setLogs] = useState<BluefocusSyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sett = await api.getSettings().catch(() => null);
      const qItems = await api.getBluefocusQueue().catch(() => []);
      const logItems = await api.getBluefocusLogs().catch(() => []);
      
      setSettings(sett || {
        id: 'settings-1',
        company_name: 'Balbec Salgados LTDA',
        logo_url: '',
        phone: '(11) 3333-4444',
        whatsapp: '(11) 99999-9999',
        email: 'contato@balbecsalgados.com.br',
        default_prep_minutes: 30,
        orders_enabled: true,
        enforce_commercial_rules: true,
        auto_block_franchisee: false,
        pix_key: '12.345.678/0001-99',
        pix_recipient_name: 'Balbec Indústria de Salgados LTDA',
        pix_bank: 'Banco Itaú',
        pix_instructions: 'Realize o pagamento via PIX e envie o comprovante no portal.',
        ntfy_url: 'https://ntfy.sh',
        ntfy_topic: 'balbec_b2b_franquias',
        ntfy_token: '',
        ntfy_enabled: true,
        bluefocus_api_url: 'https://www.app.bluefocus.com.br/BlueFocusCloud/servlet/aintegracaofcxexportacadsat?wsdl',
        bluefocus_api_key: '',
        bluefocus_token: '',
        bluefocus_auth_number: 'b022f872-e257-4453-beba-3e4f4bf5ab19',
        bluefocus_empresa_id: 'MARCOSFELI',
        bluefocus_usuario_id: 'APPBALBEC',
        bluefocus_pdv_codigo: '1000',
        bluefocus_sync_type: 'CARGA_TOTAL',
        bluefocus_tipo_dado: '4',
        bluefocus_data_inicial: '30/12/1899',
        bluefocus_carga_numero: '0',
        bluefocus_carga_sequencia: '0',
        bluefocus_produto_inicial: '0',
        bluefocus_sync_frequency: '15m',
        bluefocus_auto_sync: true,
        last_bluefocus_status: 'SUCCESS',
        pwa_title: 'Balbec Salgados B2B',
        pwa_description: 'Portal de Pedidos e Retirada exclusivo para Franqueados Balbec',
        ai_api_key: '',
        ai_system_prompt: '',
      } as SystemSettings);
      setQueue(qItems || []);
      setLogs(logItems || []);
    } catch (e: any) {
      console.warn('Erro ao carregar dados do ERP:', e);
    }
  };

  const handleSync = async (type: string = 'ALL') => {
    setIsSyncing(true);
    try {
      const res = await api.syncBluefocus(type);
      showToast(res.message || 'Sincronização com ERP Bluefocus concluída com sucesso!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(`Erro na sincronização Bluefocus: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryItem = async (queueId: string) => {
    try {
      const res = await api.retryBluefocusQueueItem(queueId);
      showToast(res.message || 'Item reprocessado com sucesso na fila do ERP!', 'success');
      await loadData();
    } catch (e: any) {
      showToast(`Erro ao reprocessar item: ${e.message}`, 'error');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      showToast('Configurações do ERP Bluefocus atualizadas com sucesso!', 'success');
      await loadData();
    } catch (e: any) {
      showToast(`Erro ao salvar configurações do ERP: ${e.message}`, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Integração ERP Bluefocus
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Contingência Ativa 100%
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Comunicação assíncrona desacoplada: pedidos são faturados na fábrica mesmo se o ERP oscilar.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSync('ALL')}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Tudo</span>
          </button>
        </div>
      </div>

      {/* Architecture Guarantee Card */}
      <div className="p-5 rounded-3xl bg-linear-to-br from-stone-900 to-amber-950 text-white border border-amber-900/40 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Garantia de Desacoplamento & Fila de Reprocessamento</span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          Toda requisição para o <strong>Bluefocus ERP</strong> é executada em segundo plano. Caso a API do ERP demore ou responda com erro HTTP 5xx/4xx, o pedido do franqueado <strong>permanece 100% aprovado</strong> no portal Balbec e é colocado na fila de contingência automática para novas tentativas com backoff exponencial.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-stone-400 block">Status da Conexão</span>
            <span className="font-bold text-emerald-400">Operacional (Async)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-stone-400 block">Fila de Espera</span>
            <span className="font-bold text-white">{queue.filter(q => q.status === 'PENDING').length} na fila</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-stone-400 block">Falhas Definitivas</span>
            <span className="font-bold text-amber-400">{queue.filter(q => q.status === 'FAILED').length} itens</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-stone-400 block">Retaguarda Fábrica</span>
            <span className="font-bold text-emerald-400">Independente</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <span>Credenciais de API Bluefocus</span>
          </h3>

          {settings && (
            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Chave de Autenticação (autentica)</label>
                  <input
                    type="text"
                    value={settings.bluefocus_auth_number || ''}
                    onChange={e => setSettings({ ...settings, bluefocus_auth_number: e.target.value })}
                    placeholder="Opcional (deixe em branco se não usar)"
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Empresa ID (Exato como no sistema)</label>
                  <input
                    type="text"
                    value={settings.bluefocus_empresa_id || ''}
                    onChange={e => setSettings({ ...settings, bluefocus_empresa_id: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Usuário ID</label>
                  <input
                    type="text"
                    value={settings.bluefocus_usuario_id || ''}
                    onChange={e => setSettings({ ...settings, bluefocus_usuario_id: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">PDV Código</label>
                  <input
                    type="text"
                    value={settings.bluefocus_pdv_codigo || ''}
                    onChange={e => setSettings({ ...settings, bluefocus_pdv_codigo: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">URL de Sincronização</label>
                <input
                  type="text"
                  value={settings.bluefocus_api_url || ''}
                  onChange={e => setSettings({ ...settings, bluefocus_api_url: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Tipo de Sincronização</label>
                  <select
                    value={settings.bluefocus_sync_type || 'CARGA_TOTAL'}
                    onChange={e => setSettings({ ...settings, bluefocus_sync_type: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                  >
                    <option value="CARGA_TOTAL">Carga Total</option>
                    <option value="CARGA_PARCIAL">Carga Parcial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Tipo de Dado (Padrão: 4 - Produtos)</label>
                  <input
                    type="text"
                    value={settings.bluefocus_tipo_dado || '4'}
                    onChange={e => setSettings({ ...settings, bluefocus_tipo_dado: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Data Inicial (Padrão: 30/12/1899)</label>
                  <input
                    type="text"
                    value={settings.bluefocus_data_inicial || '30/12/1899'}
                    onChange={e => setSettings({ ...settings, bluefocus_data_inicial: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Carga Inicial (Número)</label>
                  <input
                    type="text"
                    value={settings.bluefocus_carga_numero || '0'}
                    onChange={e => setSettings({ ...settings, bluefocus_carga_numero: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Carga Inicial (Sequência)</label>
                  <input
                    type="text"
                    value={settings.bluefocus_carga_sequencia || '0'}
                    onChange={e => setSettings({ ...settings, bluefocus_carga_sequencia: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">ID do Produto Inicial</label>
                  <input
                    type="text"
                    value={settings.bluefocus_produto_inicial || '0'}
                    onChange={e => setSettings({ ...settings, bluefocus_produto_inicial: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoSyncCheck"
                  checked={settings.bluefocus_auto_sync}
                  onChange={e => setSettings({ ...settings, bluefocus_auto_sync: e.target.checked })}
                  className="rounded text-amber-600"
                />
                <label htmlFor="autoSyncCheck" className="text-stone-700 font-semibold cursor-pointer">
                  Disparo Automático ao Criar Pedido
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition mt-2"
              >
                Salvar Configuração Bluefocus
              </button>
            </form>
          )}
        </div>

        {/* Queue & Sync Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Retry Queue */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Fila de Contingência (Retry Queue)</span>
              </span>
              <span className="text-[11px] text-stone-400 font-normal">
                {queue.length} item{queue.length !== 1 ? 's' : ''} registrado{queue.length !== 1 ? 's' : ''}
              </span>
            </h3>

            {queue.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 italic text-center">Fila vazia. Todos os pedidos foram sincronizados com sucesso.</p>
            ) : (
              <div className="space-y-2">
                {queue.map(q => (
                  <div
                    key={q.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 font-mono">{q.order_number || q.order_id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          q.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {q.status}
                        </span>
                        <span className="text-stone-400 text-[10px]">{q.attempts} tentativas</span>
                      </div>
                      {q.last_error && (
                        <p className="text-[11px] text-rose-700 mt-0.5">{q.last_error}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRetryItem(q.id)}
                      className="px-2.5 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition"
                    >
                      Reprocessar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync History Logs */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-stone-900">Histórico de Disparos ERP</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5 rounded-l-xl">Data / Hora</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 rounded-r-xl">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {logs.slice(0, 8).map(log => (
                    <tr key={log.id}>
                      <td className="p-2.5 text-stone-500">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="p-2.5 font-semibold">{log.sync_type}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-stone-500 text-[11px]">
                        {log.message || log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
