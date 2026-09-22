import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sliders,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  ShieldCheck,
  Phone,
  DollarSign
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Franchisee, FranchiseeStatus } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminFranchisees: React.FC = () => {
  const { showToast } = useToast();
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');
  const [editingFranchisee, setEditingFranchisee] = useState<Franchisee | null>(null);
  const [blockModalFranchisee, setBlockModalFranchisee] = useState<Franchisee | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<Franchisee | null>(null);

  useEffect(() => {
    loadFranchisees();
  }, [filterStatus]);

  const loadFranchisees = async () => {
    try {
      const data = await api.getFranchisees(filterStatus === 'TODOS' ? undefined : filterStatus);
      setFranchisees(data);
    } catch (e: any) {
      showToast(`Erro ao carregar franqueados: ${e.message}`, 'error');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.updateFranchiseeStatus(id, 'APROVADO', 'Aprovado pela Diretoria Balbec');
      showToast('Franqueado aprovado com sucesso!', 'success');
      await loadFranchisees();
    } catch (e: any) {
      showToast(`Erro ao aprovar franqueado: ${e.message}`, 'error');
    }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockModalFranchisee || !blockReason.trim()) return;

    try {
      await api.updateFranchiseeStatus(blockModalFranchisee.id, 'BLOQUEADO', blockReason.trim());
      setBlockModalFranchisee(null);
      setBlockReason('');
      showToast('Franqueado bloqueado.', 'success');
      await loadFranchisees();
    } catch (e: any) {
      showToast(`Erro ao bloquear franqueado: ${e.message}`, 'error');
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await api.updateFranchiseeStatus(id, 'APROVADO', 'Desbloqueado pela Diretoria');
      showToast('Franqueado desbloqueado com sucesso!', 'success');
      await loadFranchisees();
    } catch (e: any) {
      showToast(`Erro ao desbloquear franqueado: ${e.message}`, 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFranchisee) return;

    try {
      await api.updateFranchisee(editingFranchisee.id, {
        valor_minimo_compra: Number(editingFranchisee.valor_minimo_compra),
        percentual_desconto: Number(editingFranchisee.percentual_desconto),
        meta_mensal: Number(editingFranchisee.meta_mensal),
        situacao_financeira: editingFranchisee.situacao_financeira,
        responsavel_nome: editingFranchisee.responsavel_nome,
        telefone: editingFranchisee.telefone,
        whatsapp: editingFranchisee.whatsapp,
      });
      setEditingFranchisee(null);
      await loadFranchisees();
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteFranchisee(deleteTarget.id);
      setDeleteTarget(null);
      await loadFranchisees();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  const filtered = franchisees.filter(f => {
    const q = search.toLowerCase();
    return (
      f.razao_social.toLowerCase().includes(q) ||
      f.nome_fantasia.toLowerCase().includes(q) ||
      f.cnpj.includes(q) ||
      f.cidade.toLowerCase().includes(q) ||
      f.responsavel_nome.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Gestão da Rede de Franqueados
            </h2>
            <p className="text-xs text-stone-500">
              Aprovação de cadastros, controle de status, regras contratuais e limites individuais.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Razão, CNPJ ou Cidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['TODOS', 'PENDENTE', 'APROVADO', 'BLOQUEADO', 'INATIVO'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {st === 'TODOS' ? 'Todos os Franqueados' :
               st === 'PENDENTE' ? '⏳ Pendentes de Aprovação' :
               st === 'BLOQUEADO' ? '🚫 Bloqueados' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-100">
              <tr>
                <th className="p-4">Franquia / CNPJ</th>
                <th className="p-4">Responsável / Contato</th>
                <th className="p-4">Status</th>
                <th className="p-4">Regras Comerciais</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-stone-50/70 transition">
                  <td className="p-4">
                    <span className="font-bold text-stone-900 text-sm block">{f.nome_fantasia || f.razao_social}</span>
                    <span className="text-[11px] text-stone-500 font-mono">CNPJ: {f.cnpj}</span>
                    <span className="text-[11px] text-stone-400 block">{f.cidade}/{f.estado}</span>
                  </td>

                  <td className="p-4 space-y-0.5">
                    <span className="font-semibold text-stone-900 block">{f.responsavel_nome}</span>
                    <span className="text-[11px] text-stone-500 block">{f.whatsapp || f.telefone}</span>
                    <span className="text-[10px] text-stone-400 block">{f.email}</span>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      f.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' :
                      f.status === 'PENDENTE' ? 'bg-amber-100 text-amber-900 animate-pulse' :
                      f.status === 'BLOQUEADO' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {f.status}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Financ: {f.situacao_financeira || 'REGULAR'}
                    </span>
                  </td>

                  <td className="p-4 space-y-0.5">
                    <div>
                      <span className="text-stone-400 text-[10px]">Mínimo: </span>
                      <strong className="text-stone-900">R$ {(f.valor_minimo_compra || 500).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px]">Desconto: </span>
                      <strong className="text-emerald-700">{f.percentual_desconto || 0}% OFF</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px]">Meta: </span>
                      <strong className="text-stone-700">R$ {(f.meta_mensal || 2500).toFixed(2)}</strong>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {f.status === 'PENDENTE' && (
                        <button
                          id={`btn-approve-franchisee-${f.id}`}
                          onClick={() => handleApprove(f.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          title="Aprovar franqueado e liberar compras"
                        >
                          Aprovar
                        </button>
                      )}

                      {f.status === 'APROVADO' && (
                        <button
                          onClick={() => setBlockModalFranchisee(f)}
                          className="px-2 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                          title="Bloquear franqueado"
                        >
                          Bloquear
                        </button>
                      )}

                      {f.status === 'BLOQUEADO' && (
                        <button
                          onClick={() => handleUnblock(f.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                          title="Desbloquear franqueado"
                        >
                          Desbloquear
                        </button>
                      )}

                      <button
                        onClick={() => setEditingFranchisee(f)}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100"
                        title="Editar regras comerciais e limites"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(f)}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-stone-100"
                        title="Excluir franqueado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rules Modal */}
      {editingFranchisee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">
                  Regras Comerciais: {editingFranchisee.nome_fantasia || editingFranchisee.razao_social}
                </h3>
                <p className="text-[11px] text-stone-500">CNPJ: {editingFranchisee.cnpj}</p>
              </div>
              <button
                onClick={() => setEditingFranchisee(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Valor Mínimo de Compra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFranchisee.valor_minimo_compra || 500}
                    onChange={e => setEditingFranchisee({ ...editingFranchisee, valor_minimo_compra: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">Pedidos abaixo exigem liberação manual</span>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Percentual de Desconto (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingFranchisee.percentual_desconto || 0}
                    onChange={e => setEditingFranchisee({ ...editingFranchisee, percentual_desconto: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">Desconto comercial automático</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Meta Mensal de Compras (R$)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={editingFranchisee.meta_mensal || 2500}
                    onChange={e => setEditingFranchisee({ ...editingFranchisee, meta_mensal: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Situação Financeira
                  </label>
                  <select
                    value={editingFranchisee.situacao_financeira || 'REGULAR'}
                    onChange={e => setEditingFranchisee({ ...editingFranchisee, situacao_financeira: e.target.value as any })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="PENDENCIA_FINANCEIRA">Pendência Financeira</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFranchisee(null)}
                  className="py-2 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow-xs"
                >
                  Salvar Regras Comerciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {blockModalFranchisee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 text-rose-700 font-bold text-sm">
              <span>Bloquear Acesso do Franqueado</span>
              <button onClick={() => setBlockModalFranchisee(null)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Você está bloqueando: <strong>{blockModalFranchisee.nome_fantasia || blockModalFranchisee.razao_social}</strong>. O usuário não conseguirá realizar novos pedidos até o desbloqueio.
            </p>

            <form onSubmit={handleBlock} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Motivo do Bloqueio *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Pendência financeira ou solicitação da diretoria..."
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setBlockModalFranchisee(null)}
                  className="py-2 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              🗑️
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">Excluir Franqueado?</h3>
            <p className="text-xs text-stone-500">
              Tem certeza que deseja excluir o cadastro de <strong>{deleteTarget.nome_fantasia}</strong>? Esta ação criará um log de auditoria.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
