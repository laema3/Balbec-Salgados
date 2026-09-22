import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Search,
  Filter,
  ShieldAlert,
  Send,
  RefreshCw,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Order, OrderStatus } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminOrders: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [releaseModalOrder, setReleaseModalOrder] = useState<Order | null>(null);
  const [releaseReason, setReleaseReason] = useState<string>('');
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders();
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders(undefined, statusFilter);
      setOrders(data);
    } catch (e: any) {
      showToast(`Erro ao carregar pedidos: ${e.message}`, 'error');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, 'Diretoria Balbec');
      showToast(`Status do pedido alterado para ${newStatus} com sucesso!`, 'success');
      await loadOrders();
    } catch (err: any) {
      showToast(`Erro ao alterar status: ${err.message}`, 'error');
    }
  };

  const handleManualRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseModalOrder || !releaseReason.trim()) return;

    setIsReleasing(true);
    try {
      await api.manualReleaseOrder(releaseModalOrder.id, releaseReason.trim(), 'Diretoria Comercial');
      setReleaseModalOrder(null);
      setReleaseReason('');
      showToast('Pedido liberado manualmente com sucesso!', 'success');
      await loadOrders();
    } catch (err: any) {
      showToast(`Erro na liberação do pedido: ${err.message}`, 'error');
    } finally {
      setIsReleasing(false);
    }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.franchisee_name || '').toLowerCase().includes(q) ||
      (o.franchisee_cnpj || '').includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Gestão de Pedidos da Fábrica
            </h2>
            <p className="text-xs text-stone-500">
              Acompanhe a esteira de preparação, libere exceções comerciais e controle a expedição.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nº, franqueado ou CNPJ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { key: 'TODOS', label: 'Todos os Pedidos' },
            { key: 'AGUARDANDO_LIBERACAO', label: '⚠️ Aguardando Liberação' },
            { key: 'RECEBIDO', label: 'Recebido' },
            { key: 'EM_PREPARACAO', label: 'Em Preparação' },
            { key: 'PRONTO_RETIRADA', label: 'Pronto p/ Retirada' },
            { key: 'RETIRADO', label: 'Retirado' },
            { key: 'CANCELADO', label: 'Cancelado' },
          ].map(st => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                statusFilter === st.key
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8 text-stone-500 text-xs">
          Nenhum pedido encontrado nos critérios selecionados.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const isPendingRelease = order.status === 'AGUARDANDO_LIBERACAO';
            let minutesLeft: number | null = null;
            if (order.ready_estimate_at) {
              const diffMs = new Date(order.ready_estimate_at).getTime() - now;
              minutesLeft = Math.max(0, Math.ceil(diffMs / 60000));
            }

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition space-y-4 ${
                  isPendingRelease ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200/80'
                }`}
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-stone-900 text-sm">{order.order_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'AGUARDANDO_LIBERACAO' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                      order.status === 'EM_PREPARACAO' ? 'bg-amber-100 text-amber-900' :
                      order.status === 'PRONTO_RETIRADA' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'RECEBIDO' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {order.status}
                    </span>
                    {order.manual_released && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Liberado Manualmente
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                    <span className="font-bold text-stone-900">
                      R$ {order.total.toFixed(2)} ({order.payment_method})
                    </span>
                  </div>
                </div>

                {/* Franchisee Info & Preparation Timer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Franqueado</span>
                    <span className="font-bold text-stone-900">{order.franchisee_name}</span>
                    <span className="text-[11px] text-stone-500 block">CNPJ: {order.franchisee_cnpj}</span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Preparo & Retirada</span>
                    {order.ready_estimate_at && order.status !== 'RETIRADO' && order.status !== 'CANCELADO' ? (
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          Previsão: {new Date(order.ready_estimate_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {minutesLeft !== null && ` (~${minutesLeft} min)`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-600">
                        {order.status === 'RETIRADO' ? 'Pedido já retirado no balcão' : 'Prazo padrão: 50 minutos'}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Integrações</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        order.bluefocus_status === 'SENT' ? 'bg-emerald-100 text-emerald-800' :
                        order.bluefocus_status === 'ERROR' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        ERP: {order.bluefocus_status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        order.ntfy_status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        NTFY: {order.ntfy_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items and Notes */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1.5">
                  <div className="flex flex-wrap gap-2">
                    {order.items.map(i => (
                      <span key={i.id} className="px-2 py-1 rounded-lg bg-white border border-stone-200 font-medium text-stone-800">
                        {i.quantity}x {i.product_name} (R$ {i.subtotal.toFixed(2)})
                      </span>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-amber-950 font-medium pt-1">
                      📝 Obs Franqueado: "{order.notes}"
                    </p>
                  )}

                  {order.manual_released && order.motivo_liberacao_manual && (
                    <p className="text-[11px] text-purple-900 font-medium pt-1">
                      ⚡ Motivo da Liberação Manual ({order.manual_released_by}): "{order.motivo_liberacao_manual}"
                    </p>
                  )}
                </div>

                {/* Action Bar (Status Changer & Manual Release) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
                  {/* Manual Release Trigger */}
                  {isPendingRelease ? (
                    <button
                      id={`btn-manual-release-${order.id}`}
                      onClick={() => setReleaseModalOrder(order)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>LIBERAR MANUALMENTE (ABAIXO DO MÍNIMO)</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      Responsável: {order.responsible_admin || 'Sistema Balbec'}
                    </span>
                  )}

                  {/* Status Progression Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-semibold">Mudar Status:</span>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="text-xs p-1.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-800 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="AGUARDANDO_LIBERACAO">Aguardando Liberação</option>
                      <option value="RECEBIDO">Recebido</option>
                      <option value="EM_PREPARACAO">Em Preparação (50 min)</option>
                      <option value="PRONTO_RETIRADA">Pronto para Retirada</option>
                      <option value="RETIRADO">Retirado (Entregue)</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Release Modal (Item 13 & 14) */}
      {releaseModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Liberação Manual de Pedido</span>
              </div>
              <button
                onClick={() => setReleaseModalOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-1.5 p-3 bg-rose-50 rounded-2xl border border-rose-200">
              <p><strong>Pedido:</strong> {releaseModalOrder.order_number}</p>
              <p><strong>Franqueado:</strong> {releaseModalOrder.franchisee_name}</p>
              <p><strong>Valor do Pedido:</strong> R$ {releaseModalOrder.total.toFixed(2)}</p>
              <p className="text-[11px] text-rose-800 pt-1">
                Ao liberar manualmente, o status do pedido mudará para <strong>RECEBIDO</strong>, o cronômetro de 50 minutos iniciará e o pedido será despachado para produção e retaguarda ERP.
              </p>
            </div>

            <form onSubmit={handleManualRelease} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Motivo da Liberação Manual *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Autorizado pelo diretor comercial para evento de inauguração da unidade..."
                  value={releaseReason}
                  onChange={e => setReleaseReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReleaseModalOrder(null)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>

                <button
                  id="btn-confirm-manual-release"
                  type="submit"
                  disabled={isReleasing}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm transition disabled:opacity-50"
                >
                  {isReleasing ? 'Liberando...' : 'Confirmar Liberação Manual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
