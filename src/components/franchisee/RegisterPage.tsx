import React, { useState } from 'react';
import { Store, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    responsavel_nome: '',
    responsavel_cpf: '',
    email: '',
    telefone: '',
    whatsapp: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.register(formData);
      setRegisteredSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-in zoom-in-95">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-4xl mx-auto shadow-md">
          ⏳
        </div>

        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-600">
            Balbec Salgados B2B
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            Cadastro Recebido com Sucesso!
          </h2>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Seu cadastro foi recebido e está aguardando aprovação da Balbec Salgados.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left space-y-2">
          <p className="font-bold">Próximos Passos:</p>
          <ul className="list-disc pl-5 space-y-1 text-amber-800">
            <li>Nossa equipe comercial da fábrica avaliará os dados cadastrais da sua empresa.</li>
            <li>Após a validação e definição das suas regras comerciais (compra mínima, desconto e meta), seu acesso ao catálogo e compras será ativado.</li>
            <li>Você receberá avisos no WhatsApp cadastrado: <strong>{formData.whatsapp || formData.telefone}</strong>.</li>
          </ul>
        </div>

        <button
          onClick={() => onSuccess(formData.email)}
          className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
        >
          Acessar Portal (Visualizar Status de Análise)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar ao Portal</span>
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-600">
            Balbec Salgados — Parceria Comercial B2B
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            Cadastre sua Franquia ou Ponto de Venda
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Preencha os dados da sua empresa para solicitar aprovação de acesso ao portal exclusivo.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Seção 1: Dados da Empresa */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-stone-900 pb-1 border-b border-stone-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <span>1. Dados da Empresa</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  name="razao_social"
                  required
                  placeholder="Ex: Salgados Nobres Alimentos LTDA"
                  value={formData.razao_social}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="nome_fantasia"
                  placeholder="Ex: Balbec Franquia Paulista"
                  value={formData.nome_fantasia}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  name="cnpj"
                  required
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  name="inscricao_estadual"
                  placeholder="Ex: 123.456.789.110"
                  value={formData.inscricao_estadual}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Contato e Responsável */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-stone-900 pb-1 border-b border-stone-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>2. Responsável e Contatos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Nome do Responsável *
                </label>
                <input
                  type="text"
                  name="responsavel_nome"
                  required
                  placeholder="Ex: Carlos Eduardo de Souza"
                  value={formData.responsavel_nome}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  CPF do Responsável
                </label>
                <input
                  type="text"
                  name="responsavel_cpf"
                  placeholder="000.000.000-00"
                  value={formData.responsavel_cpf}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="contato@minhaempresa.com.br"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  required
                  placeholder="(11) 99999-8888"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Telefone Fixo
                </label>
                <input
                  type="text"
                  name="telefone"
                  placeholder="(11) 3333-4444"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço da Unidade */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-stone-900 pb-1 border-b border-stone-100 flex items-center gap-2">
              <span>📍 3. Endereço da Unidade</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-semibold mb-1">
                  Logradouro (Rua, Av.) *
                </label>
                <input
                  type="text"
                  name="logradouro"
                  required
                  placeholder="Ex: Av. Paulista"
                  value={formData.logradouro}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  name="numero"
                  required
                  placeholder="1500"
                  value={formData.numero}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  name="complemento"
                  placeholder="Loja 12"
                  value={formData.complemento}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  name="bairro"
                  required
                  placeholder="Bela Vista"
                  value={formData.bairro}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  name="cidade"
                  required
                  value={formData.cidade}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  CEP *
                </label>
                <input
                  type="text"
                  name="cep"
                  required
                  placeholder="01310-100"
                  value={formData.cep}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="py-3 px-5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold"
            >
              Cancelar
            </button>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando Cadastro...' : 'Enviar Solicitação de Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
