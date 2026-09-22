import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  ChevronRight,
  Eye,
  Search,
  X,
  MapPin,
  Calendar
} from 'lucide-react';
import { Order } from '../../types.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface OrderHistoryProps {
  onRepeatOrder: (orderId: string) => void;
  onNavigateToCatalog: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onRepeatOrder, onNavigateToCatalog }) => {
  const { franchisee } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, [franchisee?.id]);

  const loadOrders = async () => {
    if (!franchisee?.id) return;
    try {
      const list = await api.getOrders(franchisee.id);
      setOrders(list);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'TODOS' || o.status === filterStatus;
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'AGUARDANDO_LIBERACAO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Aguardando Liberação</span>;
      case 'RECEBIDO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Recebido</span>;
      case 'EM_PREPARACAO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 animate-pulse">Em Preparação</span>;
      case 'PRONTO_RETIRADA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Pronto para Retirada</span>;
      case 'RETIRADO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">Retirado</span>;
      case 'CANCELADO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  const getStepProgress = (status: Order['status']) => {
    const steps = [
      { key: 'RECEBIDO', label: 'Recebido' },
      { key: 'EM_PREPARACAO', label: 'Em Preparo' },
      { key: 'PRONTO_RETIRADA', label: 'Pronto' },
      { key: 'RETIRADO', label: 'Retirado' },
    ];

    if (status === 'AGUARDANDO_LIBERACAO') {
      return (
        <div className="text-xs text-rose-700 font-semibold py-1 px-2.5 rounded-lg bg-rose-50 border border-rose-200 inline-block">
          Aguardando liberação da diretoria comercial Balbec
        </div>
      );
    }

    if (status === 'CANCELADO') {
      return (
        <div className="text-xs text-red-700 font-semibold py-1 px-2.5 rounded-lg bg-red-50 border border-red-200 inline-block">
          Pedido Cancelado
        </div>
      );
    }

    const orderIndex = steps.findIndex(s => s.key === status);

    return (
      <div className="flex items-center gap-2 py-2">
        {steps.map((step, idx) => {
          const isDone = idx <= orderIndex;
          const isCurrent = idx === orderIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-1">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-300'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className={`text-[11px] font-medium hidden sm:inline ${isCurrent ? 'text-amber-800 font-bold' : isDone ? 'text-stone-800' : 'text-stone-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 w-4 sm:w-8 ${idx < orderIndex ? 'bg-emerald-600' : 'bg-stone-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Meus Pedidos</h2>
            <p className="text-xs text-stone-500">
              Acompanhe o status de preparo e histórico de compras da sua franquia.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código ou produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['TODOS', 'RECEBIDO', 'EM_PREPARACAO', 'PRONTO_RETIRADA', 'RETIRADO', 'AGUARDANDO_LIBERACAO'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {st === 'TODOS' ? 'Todos os Pedidos' :
               st === 'EM_PREPARACAO' ? 'Em Preparação' :
               st === 'PRONTO_RETIRADA' ? 'Prontos para Retirada' :
               st === 'AGUARDANDO_LIBERACAO' ? 'Aguardando Liberação' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8 space-y-3">
          <Package className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-sm font-semibold text-stone-600">Nenhum pedido encontrado.</p>
          <button
            onClick={onNavigateToCatalog}
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-600 transition shadow-xs"
          >
            Fazer Novo Pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs hover:border-amber-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-stone-900 font-mono">
                    {order.order_number}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="bg-stone-50/70 p-3 rounded-2xl border border-stone-100 flex items-center justify-between flex-wrap gap-2">
                {getStepProgress(order.status)}
                {order.ready_estimate_at && order.status !== 'RETIRADO' && order.status !== 'CANCELADO' && (
                  <div className="text-xs text-amber-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Previsão de Retirada: {new Date(order.ready_estimate_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {/* Items Preview */}
              <div className="text-xs text-stone-700">
                <p className="font-medium text-stone-500 mb-1">Itens do pedido:</p>
                <div className="flex flex-wrap gap-1.5">
                  {order.items.map(item => (
                    <span key={item.id} className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-medium">
                      {item.quantity}x {item.product_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Financial summary & Action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <div className="text-xs">
                  <span className="text-stone-500">Total Líquido: </span>
                  <span className="font-black text-amber-900 text-base">R$ {order.total.toFixed(2)}</span>
                  <span className="text-stone-400 ml-1">({order.payment_method})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedOrder(order); setShowThermalModal(true); }}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Imprimir comprovante térmico para expedição"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Comprovante</span>
                  </button>

                  <button
                    onClick={() => onRepeatOrder(order.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                    title="Carregar itens no carrinho com preços atualizados"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pedir Novamente</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thermal Receipt Voucher Modal (Item 33) */}
      {showThermalModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="font-bold text-xs text-stone-900">Comprovante de Pedido B2B</span>
              <button
                onClick={() => setShowThermalModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Content */}
            <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/60 font-mono text-xs text-stone-800 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-stone-300">
                <h4 className="font-black text-sm">BALBEC SALGADOS LTDA</h4>
                <p className="text-[10px]">Fábrica & Centro de Distribuição</p>
                <p className="text-[10px]">CNPJ: 12.345.678/0001-90</p>
              </div>

              <div className="text-[11px] space-y-0.5">
                <p><strong>PEDIDO:</strong> {selectedOrder.order_number}</p>
                <p><strong>DATA:</strong> {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</p>
                <p><strong>FRANQUEADO:</strong> {selectedOrder.franchisee_name}</p>
                <p><strong>CNPJ:</strong> {selectedOrder.franchisee_cnpj}</p>
              </div>

              <div className="pt-2 border-t border-dashed border-stone-300 space-y-1">
                <p className="font-bold text-[11px]">ITENS SOLICITADOS:</p>
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span>R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-stone-300 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Desconto ({selectedOrder.discount_percent}%):</span>
                    <span>- R$ {selectedOrder.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-stone-300">
                  <span>TOTAL:</span>
                  <span>R$ {selectedOrder.total.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-stone-500 pt-1">
                  Pagamento: {selectedOrder.payment_method}
                </p>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-stone-300 text-[10px] text-stone-500">
                <p>LOCAL DE RETIRADA: BALCÃO EXPEDIÇÃO</p>
                <p>PRAZO MÉDIO: 50 MINUTOS</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Via Balcão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
