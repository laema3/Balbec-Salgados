import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Order } from '../../types.js';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashStats, orders] = await Promise.all([
        api.getDashboardStats(),
        api.getOrders(undefined, 'TODOS'),
      ]);
      setStats(dashStats);
      setRecentOrders(orders.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="p-8 text-center text-xs text-stone-500">
        Carregando indicadores do painel...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alert Banners if Attention is Needed */}
      {stats.ordersPendingRelease > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {stats.ordersPendingRelease} Pedido{stats.ordersPendingRelease > 1 ? 's' : ''} Aguardando Liberação Manual
              </h4>
              <p className="text-xs text-rose-800">
                Pedidos com valor abaixo da compra mínima contratual requerem aprovação da diretoria para entrar em produção.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition self-end sm:self-center shrink-0"
          >
            <span>Analisar Pedidos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {stats.pendingApprovalFranchisees > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shrink-0">
              👥
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {stats.pendingApprovalFranchisees} Franqueado{stats.pendingApprovalFranchisees > 1 ? 's' : ''} Pendente{stats.pendingApprovalFranchisees > 1 ? 's' : ''} de Aprovação
              </h4>
              <p className="text-xs text-amber-800">
                Novos cadastros de parceiros aguardam validação de CNPJ e liberação das regras comerciais.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('franchisees')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition self-end sm:self-center shrink-0"
          >
            <span>Ver Cadastros</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Faturamento Hoje</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-stone-900">
            R$ {stats.salesToday.toFixed(2)}
          </h3>
          <span className="text-[11px] text-stone-400 block">
            {stats.ordersTodayCount} pedido{stats.ordersTodayCount !== 1 ? 's' : ''} hoje
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Faturamento no Mês</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-900">
            R$ {stats.salesMonth.toFixed(2)}
          </h3>
          <span className="text-[11px] text-stone-400 block">
            {stats.ordersMonthCount} pedidos este mês
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Ticket Médio B2B</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-stone-900">
            R$ {stats.averageTicketMonth.toFixed(2)}
          </h3>
          <span className="text-[11px] text-stone-400 block">
            Média por pedido fechado
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Rede de Franqueados</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-stone-900">
            {stats.activeFranchisees} Ativos
          </h3>
          <span className="text-[11px] text-stone-400 block">
            {stats.blockedFranchisees} bloqueados • {stats.pendingApprovalFranchisees} pendentes
          </span>
        </div>
      </div>

      {/* Production & Expedição Operational Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 cursor-pointer hover:bg-amber-500/20 transition text-stone-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Em Preparação</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{stats.ordersPrep}</div>
          <span className="text-[10px] text-amber-800">Na linha de produção (50 min)</span>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/60 cursor-pointer hover:bg-emerald-500/20 transition text-stone-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Pronto p/ Retirada</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{stats.ordersReady}</div>
          <span className="text-[10px] text-emerald-800">Aguardando no balcão</span>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-300/60 cursor-pointer hover:bg-rose-500/20 transition text-stone-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Aguardando Liberação</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950 mt-2">{stats.ordersPendingRelease}</div>
          <span className="text-[10px] text-rose-800">Abaixo da compra mínima</span>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-2xl bg-stone-100 border border-stone-200 cursor-pointer hover:bg-stone-200 transition text-stone-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">Entregues / Retirados</span>
            <Package className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-black text-stone-800 mt-2">{stats.ordersPickedUp}</div>
          <span className="text-[10px] text-stone-500">Expedição concluída</span>
        </div>
      </div>

      {/* Recent Orders Overview Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-extrabold text-sm text-stone-900">Últimos Pedidos Recebidos</h3>
            <p className="text-xs text-stone-500">Visão geral da esteira de pedidos da fábrica</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
          >
            <span>Ver todos os pedidos</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">Pedido</th>
                <th className="p-3">Franqueado</th>
                <th className="p-3">Horário</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-xl text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-stone-50/80 transition">
                  <td className="p-3 font-mono font-bold text-stone-900">{order.order_number}</td>
                  <td className="p-3 font-semibold">{order.franchisee_name}</td>
                  <td className="p-3 text-stone-500">
                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 font-extrabold text-stone-900">R$ {order.total.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'AGUARDANDO_LIBERACAO' ? 'bg-rose-100 text-rose-800' :
                      order.status === 'EM_PREPARACAO' ? 'bg-amber-100 text-amber-900' :
                      order.status === 'PRONTO_RETIRADA' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'RECEBIDO' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="text-[11px] font-semibold text-amber-700 hover:underline"
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
