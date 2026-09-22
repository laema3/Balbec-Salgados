import React, { useState } from 'react';
import { Store, ShieldCheck, Percent, DollarSign, Target, Clock, MapPin, Phone, Mail, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';

export const FranchiseeProfile: React.FC = () => {
  const { franchisee, refreshProfile } = useAuth();
  const [whatsapp, setWhatsapp] = useState(franchisee?.whatsapp || '');
  const [telefone, setTelefone] = useState(franchisee?.telefone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!franchisee) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">
        Nenhum perfil de franqueado associado a este login.
      </div>
    );
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateFranchisee(franchisee.id, {
        whatsapp,
        telefone,
      });
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center font-bold text-2xl shrink-0">
            🏬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
                {franchisee.nome_fantasia || franchisee.razao_social}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                franchisee.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' :
                franchisee.status === 'PENDENTE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {franchisee.status}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              CNPJ: {franchisee.cnpj} • Inscrição Estadual: {franchisee.inscricao_estadual || 'Isento/Não informado'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-stone-400 uppercase font-bold block">Situação Financeira</span>
          <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {franchisee.situacao_financeira || 'REGULAR'}
          </span>
        </div>
      </div>

      {/* Contractual Commercial Rules Card (Item 9 & 31) */}
      <div className="bg-linear-to-br from-stone-900 to-amber-950 text-white p-6 rounded-3xl border border-amber-900/40 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Condições Comerciais Exclusivas da Sua Franquia</span>
          </div>
          <span className="text-xs text-stone-300">Definidas em contrato com a Balbec</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>Compra Mínima</span>
            </div>
            <p className="text-xl font-extrabold text-white mt-2">
              R$ {(franchisee.valor_minimo_compra || 500).toFixed(2)}
            </p>
            <p className="text-[10px] text-stone-400 mt-1 leading-snug">
              Pedidos abaixo deste valor necessitam de liberação manual.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Percent className="w-4 h-4" />
              <span>Desconto Contratual</span>
            </div>
            <p className="text-xl font-extrabold text-emerald-300 mt-2">
              {franchisee.percentual_desconto || 0}% OFF
            </p>
            <p className="text-[10px] text-stone-400 mt-1 leading-snug">
              Aplicado automaticamente sobre o valor total do pedido.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Target className="w-4 h-4" />
              <span>Meta Mensal</span>
            </div>
            <p className="text-xl font-extrabold text-white mt-2">
              R$ {(franchisee.meta_mensal || 2500).toFixed(2)}
            </p>
            <p className="text-[10px] text-stone-400 mt-1 leading-snug">
              Volume mínimo de compras para manutenção das vantagens.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Clock className="w-4 h-4" />
              <span>Prazo de Retirada</span>
            </div>
            <p className="text-xl font-extrabold text-white mt-2">
              50 Minutos
            </p>
            <p className="text-[10px] text-stone-400 mt-1 leading-snug">
              Retirada no balcão de expedição da fábrica.
            </p>
          </div>
        </div>
      </div>

      {/* Cadastral Details & Contact Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Endereço & Dados Cadastrais */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 font-bold text-sm text-stone-900">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Endereço da Unidade Franqueada</span>
          </div>

          <div className="text-xs text-stone-700 space-y-2">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Logradouro</span>
              <span className="font-semibold text-stone-900">{franchisee.logradouro}, {franchisee.numero} {franchisee.complemento}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Bairro</span>
                <span className="font-semibold text-stone-900">{franchisee.bairro}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Cidade/UF</span>
                <span className="font-semibold text-stone-900">{franchisee.cidade} / {franchisee.estado}</span>
              </div>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">CEP</span>
              <span className="font-semibold text-stone-900">{franchisee.cep}</span>
            </div>
          </div>
        </div>

        {/* Contato & Representante */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 font-bold text-sm text-stone-900">
            <Phone className="w-4 h-4 text-amber-600" />
            <span>Contatos do Responsável</span>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
            <div>
              <label className="text-stone-400 block text-[10px] uppercase font-bold mb-0.5">
                Responsável Legal
              </label>
              <input
                type="text"
                disabled
                value={franchisee.responsavel_nome}
                className="w-full p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-stone-400 block text-[10px] uppercase font-bold mb-0.5">
                E-mail de Acesso
              </label>
              <input
                type="text"
                disabled
                value={franchisee.email}
                className="w-full p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-700 block font-semibold mb-0.5">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-700 block font-semibold mb-0.5">
                  Telefone Fixo
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-800" />
                    <span>Contatos Atualizados!</span>
                  </>
                ) : (
                  <span>Salvar Alterações de Contato</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
