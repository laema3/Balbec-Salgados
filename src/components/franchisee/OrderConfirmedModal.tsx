import React from 'react';
import { CheckCircle2, Clock, MapPin, AlertTriangle, ArrowRight, Printer } from 'lucide-react';
import { Order } from '../../types.js';

interface OrderConfirmedModalProps {
  order: Order | null;
  warning?: string;
  onClose: () => void;
  onViewOrders: () => void;
}

export const OrderConfirmedModal: React.FC<OrderConfirmedModalProps> = ({
  order,
  warning,
  onClose,
  onViewOrders,
}) => {
  if (!order) return null;

  const isPendingRelease = order.status === 'AGUARDANDO_LIBERACAO';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-6 animate-in zoom-in-95">
        {/* Celebration Badge */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-3xl shadow-md">
          {isPendingRelease ? '⏳' : '🎉'}
        </div>

        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-700">
            Balbec Salgados B2B
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            {isPendingRelease ? 'Pedido Registrado!' : 'Pedido Confirmado com Sucesso!'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Número oficial do pedido: <strong className="font-mono text-stone-900 text-sm">{order.order_number}</strong>
          </p>
        </div>

        {/* Warning if awaiting manual release */}
        {isPendingRelease && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Aguardando Liberação da Diretoria</span>
            </div>
            <p className="text-[11px] text-amber-800">
              {warning || 'Este pedido foi cadastrado abaixo do valor mínimo contratual e aguarda liberação manual da diretoria Balbec para iniciar a produção.'}
            </p>
          </div>
        )}

        {/* Preparation & Pickup Timeline Box */}
        <div className="p-4 rounded-2xl bg-stone-900 text-white text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Clock className="w-4 h-4" />
              <span>Prazo Estimado de Preparo: 50 minutos</span>
            </div>
            {order.ready_estimate_at && (
              <span className="text-xs font-mono font-bold text-amber-300">
                Previsão: {new Date(order.ready_estimate_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="text-xs text-stone-300 space-y-1 border-t border-white/10 pt-2">
            <div className="flex items-center gap-1.5 text-amber-200">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span><strong>Retirada:</strong> {order.pickup_location}</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Apresente o número do pedido <strong>{order.order_number}</strong> no balcão da expedição.
            </p>
          </div>
        </div>

        {/* Order Details Summary */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-left space-y-2">
          <div className="flex justify-between text-stone-600">
            <span>Forma de Pagamento:</span>
            <strong className="text-stone-900">{order.payment_method}</strong>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Quantidade de Itens:</span>
            <span>{order.items.reduce((acc, i) => acc + i.quantity, 0)} volumes</span>
          </div>
          <div className="flex justify-between text-stone-900 font-bold pt-2 border-t border-stone-200">
            <span>Total a Pagar:</span>
            <span className="text-amber-800 text-sm">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            id="btn-view-orders-after-checkout"
            onClick={onViewOrders}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Acompanhar Meus Pedidos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition"
          >
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};
