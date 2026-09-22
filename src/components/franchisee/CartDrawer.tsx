import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  DollarSign,
  Info,
  ShieldCheck,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { Order, PaymentMethod } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order, warning?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const { showToast } = useToast();
  const { items, removeItem, updateQuantity, clearCart, evaluation, isEvaluating } = useCart();
  const { franchisee } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  if (!isOpen) return null;

  const minRequired = evaluation?.minimumRequired || franchisee?.valor_minimo_compra || 500;
  const currentSubtotal = evaluation?.subtotal || items.reduce((acc, i) => acc + (i.product.promo_price ?? i.product.price) * i.quantity, 0);
  const diffToMin = Math.max(0, minRequired - currentSubtotal);
  const meetsMin = currentSubtotal >= minRequired;
  const minPercent = Math.min(100, Math.round((currentSubtotal / minRequired) * 100));

  const handleCopyPix = () => {
    navigator.clipboard.writeText('financeiro@balbec.com.br');
    setCopiedPix(true);
    showToast('Chave PIX copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCheckout = async () => {
    if (!franchisee) return;
    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const idempotencyKey = `idemp_${franchisee.id}_${Date.now()}`;

    try {
      const payload = {
        franchisee_id: franchisee.id,
        items: items.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        idempotency_key: idempotencyKey,
      };

      const res = await api.createOrder(payload);
      clearCart();
      onClose();
      showToast('Pedido B2B gerado e enviado para a fábrica com sucesso!', 'success');
      onOrderCreated(res.order, res.warning);
    } catch (err: any) {
      const msg = err.message || 'Falha ao processar pedido.';
      setErrorMsg(msg);
      showToast(`Erro ao criar pedido: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 tracking-tight">Carrinho de Pedido B2B</h3>
            <p className="text-xs text-stone-500">
              {franchisee?.nome_fantasia || franchisee?.razao_social}
            </p>
          </div>
          <button
            id="btn-close-cart-drawer"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Minimum Purchase Progress Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span className="text-amber-950">Compra Mínima Contratual</span>
              <span className={meetsMin ? 'text-emerald-700' : 'text-amber-800'}>
                {meetsMin ? 'Requisito Atingido! ✓' : `R$ ${currentSubtotal.toFixed(2)} de R$ ${minRequired.toFixed(2)}`}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-amber-200/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${meetsMin ? 'bg-emerald-500' : 'bg-amber-600'}`}
                style={{ width: `${minPercent}%` }}
              />
            </div>

            {!meetsMin && (
              <p className="text-[11px] text-amber-900 leading-snug">
                ⚠️ Faltam <strong>R$ {diffToMin.toFixed(2)}</strong> para atingir a compra mínima. Se enviar agora, o pedido ficará aguardando liberação manual da diretoria Balbec antes de entrar na produção.
              </p>
            )}
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <p className="text-sm font-semibold">Seu carrinho está vazio.</p>
              <p className="text-xs">Selecione salgados do catálogo para montar seu pedido.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-1 border-b border-stone-100">
                <span>Itens Selecionados ({items.length})</span>
                <button
                  onClick={clearCart}
                  className="text-stone-400 hover:text-rose-600 flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3 h-3" /> Limpar tudo
                </button>
              </div>

              {items.map(({ product, quantity }) => {
                const unitPrice = product.custom_price ?? (product.promo_price ?? product.price);
                const lineTotal = unitPrice * quantity;

                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-stone-900 leading-tight">{product.name}</h4>
                        <span className="text-[10px] text-stone-500 block">{product.unit} • R$ {unitPrice.toFixed(2)} un</span>
                        <span className="text-xs font-extrabold text-amber-700 mt-0.5 block">
                          R$ {lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-200 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-stone-900 min-w-[24px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-200 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(product.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <>
              {/* Pickup & Prep Time Warning (Item 18 & 19) */}
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Prazo de Preparo: 50 Minutos</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Os salgados são preparados frescos na fábrica após o recebimento do pedido. Previsão de entrega para retirada: <strong>50 minutos</strong>.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 pt-1 border-t border-white/10">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Retirada: Balbec Salgados — Unidade Fabril (Balcão de Expedição)</span>
                </div>
              </div>

              {/* Payment Method Selector (Item 20) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3 rounded-2xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'PIX'
                        ? 'border-amber-500 bg-amber-50/60 font-bold text-amber-950 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        PIX
                      </span>
                      {paymentMethod === 'PIX' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal mt-1">Chave / QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={`p-3 rounded-2xl border text-left text-xs transition flex flex-col justify-between ${
                      paymentMethod === 'DINHEIRO'
                        ? 'border-amber-500 bg-amber-50/60 font-bold text-amber-950 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        Dinheiro
                      </span>
                      {paymentMethod === 'DINHEIRO' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal mt-1">Pagar na Retirada</span>
                  </button>
                </div>

                {paymentMethod === 'PIX' && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-stone-500">Chave PIX (E-mail):</span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="text-[11px] text-amber-700 font-bold flex items-center gap-1 hover:underline"
                      >
                        {copiedPix ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar Chave'}</span>
                      </button>
                    </div>
                    <p className="font-mono font-bold text-stone-900 text-xs">financeiro@balbec.com.br</p>
                    <p className="text-[10px] text-stone-500">
                      Favorecido: <strong>Balbec Salgados LTDA</strong> • Banco Itaú (341). Favor apresentar comprovante na retirada.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Notes Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-900">
                  Observações para a Fábrica (Opcional)
                </label>
                <textarea
                  id="input-order-notes"
                  rows={2}
                  placeholder="Ex: Embalar em caixas separadas para transporte..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer / Financial Calculation Breakdown */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal dos Produtos:</span>
                <span>R$ {(evaluation?.subtotal ?? currentSubtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Desconto Comercial ({evaluation?.discountPercent ?? franchisee?.percentual_desconto ?? 0}%):</span>
                <span>- R$ {(evaluation?.discountAmount ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-extrabold text-base pt-2 border-t border-stone-200">
                <span>Total Líquido:</span>
                <span className="text-amber-800">
                  R$ {(evaluation?.total ?? currentSubtotal).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              id="btn-confirm-checkout"
              onClick={handleCheckout}
              disabled={isSubmitting || isEvaluating}
              className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-stone-950 font-extrabold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Enviando Pedido...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>CONFIRMAR E ENVIAR PEDIDO</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
