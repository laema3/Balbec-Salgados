import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Package,
  RotateCcw,
  User,
  Percent,
  Calendar,
  ChevronRight,
  Flame,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { Order } from '../../types.js';

interface FranchiseeDashboardProps {
  onNavigate: (view: string) => void;
  onRepeatOrder: (orderId: string) => void;
}

export const FranchiseeDashboard: React.FC<FranchiseeDashboardProps> = ({ onNavigate, onRepeatOrder }) => {
  const { user, franchisee } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [franchisee?.id]);

  const loadOrders = async () => {
    if (!franchisee?.id) return;
    try {
      const orders = await api.getOrders(franchisee.id);
      const active = orders.filter(o => ['RECEBIDO', 'EM_PREPARACAO', 'PRONTO_RETIRADA', 'AGUARDANDO_LIBERACAO'].includes(o.status));
      setActiveOrders(active);
      if (orders.length > 0) {
        setLatestOrder(orders[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cálculos de Meta e Compras
  const meta = franchisee?.meta_mensal || 2500;
  const purchased = franchisee?.total_purchased_month || 0;
  const remaining = Math.max(0, meta - purchased);
  const percentMet = meta > 0 ? Math.min(100, Math.round((purchased / meta) * 100)) : 100;
  const discount = franchisee?.percentual_desconto || 5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Status Warning Banners */}
      {franchisee?.status === 'PENDENTE' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Cadastro em Análise</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Seu cadastro foi recebido e está aguardando aprovação da Balbec Salgados. Nossa equipe comercial entrará em contato em breve.
            </p>
          </div>
        </div>
      )}

      {franchisee?.status === 'BLOQUEADO' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Acesso Temporariamente Bloqueado</h4>
            <p className="text-xs text-rose-800 mt-0.5">
              Seu acesso para realização de pedidos está temporariamente bloqueado. Entre em contato com a Balbec Salgados pelo WhatsApp (11) 98800-7700.
            </p>
          </div>
        </div>
      )}

      {/* Salutation & Franchise Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-600">Portal B2B Balbec</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-0.5">
            Olá, {franchisee?.responsavel_nome || user?.name || 'Franqueado'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {franchisee?.nome_fantasia || franchisee?.razao_social} • CNPJ: {franchisee?.cnpj}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-dash-novo-pedido"
            onClick={() => onNavigate('catalog')}
            disabled={franchisee?.status !== 'APROVADO'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-900 font-bold text-sm transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Fazer Novo Pedido</span>
          </button>
          <button
            id="btn-dash-meus-pedidos"
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition"
          >
            <Package className="w-4 h-4" />
            <span>Meus Pedidos</span>
          </button>
        </div>
      </div>

      {/* Active Orders Live Countdown Card (Item 18: Prazo 50 Minutos) */}
      {activeOrders.length > 0 && (
        <div className="bg-linear-to-r from-stone-900 to-amber-950 text-white p-6 rounded-3xl shadow-lg border border-amber-900/40">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="font-bold text-base text-amber-100">Acompanhamento em Tempo Real</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
              {activeOrders.length} pedido{activeOrders.length > 1 ? 's' : ''} em andamento
            </span>
          </div>

          <div className="space-y-4">
            {activeOrders.map(order => {
              let minutesLeft: number | null = null;
              if (order.ready_estimate_at) {
                const diffMs = new Date(order.ready_estimate_at).getTime() - now;
                minutesLeft = Math.max(0, Math.ceil(diffMs / 60000));
              }

              return (
                <div key={order.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-amber-400">{order.order_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'PRONTO_RETIRADA' ? 'bg-emerald-500 text-white' :
                        order.status === 'EM_PREPARACAO' ? 'bg-amber-500 text-stone-950' :
                        order.status === 'AGUARDANDO_LIBERACAO' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {order.status === 'PRONTO_RETIRADA' ? 'PRONTO PARA RETIRADA' :
                         order.status === 'EM_PREPARACAO' ? 'EM PREPARAÇÃO' :
                         order.status === 'AGUARDANDO_LIBERACAO' ? 'AGUARDANDO LIBERAÇÃO' : 'RECEBIDO'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-stone-300 space-y-0.5">
                      <p>Retirada: <strong>{order.pickup_location}</strong></p>
                      <p>Total: <strong>R$ {order.total.toFixed(2)}</strong> ({order.payment_method})</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end w-full sm:w-auto">
                    {order.status === 'PRONTO_RETIRADA' ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm py-1.5 px-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>SEU PEDIDO ESTÁ PRONTO PARA RETIRADA!</span>
                      </div>
                    ) : order.status === 'AGUARDANDO_LIBERACAO' ? (
                      <div className="text-xs text-rose-300 py-1.5 px-3 rounded-xl bg-rose-950/60 border border-rose-500/40">
                        Aguardando liberação da diretoria comercial
                      </div>
                    ) : (
                      <div className="flex flex-col sm:items-end">
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Previsão de retirada: {order.ready_estimate_at ? new Date(order.ready_estimate_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '50 min'}</span>
                        </div>
                        {minutesLeft !== null && (
                          <span className="text-[11px] text-stone-400 mt-0.5">
                            {minutesLeft === 0 ? 'Finalizando embalagem nos próximos minutos...' : `Disponível em aproximadamente ${minutesLeft} minutos.`}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => onNavigate('orders')}
                      className="mt-3 text-xs text-amber-300 hover:text-white font-semibold flex items-center gap-1 self-end"
                    >
                      <span>Ver detalhes do pedido</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commercial Quota & Goals Cards (Item 9 & Item 31) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Monthly Goal Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  🎯
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Meta Mensal de Compras</h3>
                  <p className="text-xs text-stone-500">Mês vigente ({new Date().toLocaleString('pt-BR', { month: 'long' })})</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${percentMet >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {percentMet >= 100 ? 'Meta Atingida! 🏆' : `${percentMet}% concluído`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                <span>Comprado: <strong>R$ {purchased.toFixed(2)}</strong></span>
                <span>Meta: <strong>R$ {meta.toFixed(2)}</strong></span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-600 transition-all duration-500"
                  style={{ width: `${percentMet}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-stone-500">
                  {remaining === 0 ? 'Você atingiu o teto da meta mensal!' : `Falta comprar R$ ${remaining.toFixed(2)} para bater a meta.`}
                </span>
                <span className="text-amber-800 font-bold">
                  Desconto Ativo: {discount}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-stone-50">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Compra Mínima</span>
              <span className="font-bold text-stone-900 text-xs sm:text-sm">R$ {(franchisee?.valor_minimo_compra || 500).toFixed(2)}</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Desconto Contratual</span>
              <span className="font-bold text-emerald-600 text-xs sm:text-sm">{discount}% OFF</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Prazo de Preparo</span>
              <span className="font-bold text-amber-700 text-xs sm:text-sm">50 minutos</span>
            </div>
          </div>
        </div>

        {/* Latest Order & Quick Repeat Card (Item 32) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-stone-900">Último Pedido Realizado</h3>
            </div>

            {latestOrder ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">{latestOrder.order_number}</span>
                  <span className="text-[11px] text-stone-500">
                    {new Date(latestOrder.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Total:</span>
                    <strong className="text-amber-950">R$ {latestOrder.total.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>Itens:</span>
                    <span>{latestOrder.items.reduce((acc, i) => acc + i.quantity, 0)} unidades/centos</span>
                  </div>
                </div>

                <button
                  id="btn-repeat-latest-order"
                  onClick={() => onRepeatOrder(latestOrder.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repetir Este Pedido</span>
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-400">
                Nenhum pedido realizado ainda.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <button
              onClick={() => onNavigate('profile')}
              className="w-full text-xs text-stone-600 hover:text-amber-700 font-semibold flex items-center justify-between"
            >
              <span>Minhas Regras Comerciais</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('catalog')}
          className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            🥟
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900">Catálogo de Salgados</h4>
            <p className="text-[11px] text-stone-500">Montar novo pedido</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('orders')}
          className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            📦
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900">Histórico de Pedidos</h4>
            <p className="text-[11px] text-stone-500">Consultar e rastrear</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('profile')}
          className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            📋
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900">Dados do Franqueado</h4>
            <p className="text-[11px] text-stone-500">Endereço e regras</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('catalog')}
          className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
            ⏱️
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900">Retirada na Balbec</h4>
            <p className="text-[11px] text-stone-500">Prazo de 50 minutos</p>
          </div>
        </div>
      </div>
    </div>
  );
};
