import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Bot, X, Send, Sparkles, MessageSquare, ExternalLink, Loader2, ShoppingBag } from 'lucide-react';

export const AIAssistantWidget: React.FC = () => {
  const { franchisee } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Olá, ${franchisee?.responsavel_nome || 'Franqueado(a)'}! Sou o **Balbec IA**, seu assistente virtual de vendas e suporte. Posso tirar dúvidas sobre o cardápio, calcular seu desconto de ${franchisee?.percentual_desconto || 10}%, sugerir combos de alta rotatividade e ajudar a fechar seu pedido para retirada em 50 minutos! Como posso te ajudar hoje?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeStr }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          franchisee_id: franchisee?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na comunicação com a I.A.');

      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Desculpe, ocorreu um erro ao consultar o assistente de I.A.: ${err.message}. Verifique a chave de API nas configurações do painel admin.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="btn-ai-assistant-toggle"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-24 z-40 p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition hover:scale-105"
          title="Falar com o Assistente Balbec IA"
        >
          <Sparkles className="w-5 h-5 fill-stone-950 text-amber-500 animate-pulse" />
          <span className="hidden sm:inline">Balbec IA</span>
        </button>
      )}

      {/* Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-stone-950 font-bold shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  Balbec IA <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[11px] text-stone-400">Assistente de Vendas & Suporte B2B</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="p-4 flex-1 h-80 overflow-y-auto space-y-3 bg-stone-50/50 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-stone-900 text-white rounded-br-xs'
                      : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">{m.text}</div>
                  <div className={`text-[10px] mt-1.5 text-right ${m.sender === 'user' ? 'text-stone-400' : 'text-stone-400'}`}>
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 p-3 rounded-2xl flex items-center gap-2 text-stone-500 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Balbec IA está analisando cardápio e preços...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ex: Quais os centos em promoção hoje?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold rounded-xl shadow-sm transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
