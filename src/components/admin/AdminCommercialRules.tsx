import React, { useState, useEffect } from 'react';
import { Sliders, Percent, DollarSign, Target, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Franchisee, SystemSettings } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminCommercialRules: React.FC = () => {
  const { showToast } = useToast();
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ min: number; desc: number; meta: number }>({ min: 500, desc: 5, meta: 2500 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [frans, setts] = await Promise.all([
        api.getFranchisees(),
        api.getSettings(),
      ]);
      setFranchisees(frans);
      setSettings(setts);
    } catch (e: any) {
      showToast(`Erro ao carregar regras comerciais: ${e.message}`, 'error');
    }
  };

  const handleToggleEnforce = async () => {
    if (!settings) return;
    try {
      const updated = await api.updateSettings({
        enforce_commercial_rules: !settings.enforce_commercial_rules,
      });
      setSettings(updated);
      showToast('Política de restrição comercial atualizada com sucesso!', 'success');
    } catch (e: any) {
      showToast(`Erro ao atualizar política: ${e.message}`, 'error');
    }
  };

  const startEdit = (f: Franchisee) => {
    setEditingId(f.id);
    setEditValues({
      min: f.valor_minimo_compra || 500,
      desc: f.percentual_desconto || 0,
      meta: f.meta_mensal || 2500,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await api.updateFranchisee(id, {
        valor_minimo_compra: editValues.min,
        percentual_desconto: editValues.desc,
        meta_mensal: editValues.meta,
      });
      setEditingId(null);
      showToast('Regras do franqueado salvas com sucesso!', 'success');
      await loadData();
    } catch (e: any) {
      showToast(`Erro ao salvar regras: ${e.message}`, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Global Policy Control */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Regras Comerciais & Metas
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              Políticas Individuais
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Configuração de compra mínima, descontos comerciais e metas mensais por franqueado.
          </p>
        </div>

        {/* Global Enforcement Toggle */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <div className="text-xs">
            <span className="font-bold text-stone-900 block">Exigir Compra Mínima no Checkout</span>
            <span className="text-[10px] text-stone-500">
              {settings?.enforce_commercial_rules ? 'Ativo: Retém como Aguardando Liberação' : 'Inativo: Libera todos'}
            </span>
          </div>
          <button
            onClick={handleToggleEnforce}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              settings?.enforce_commercial_rules
                ? 'bg-amber-600 text-white'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {settings?.enforce_commercial_rules ? 'Ligado' : 'Desligado'}
          </button>
        </div>
      </div>

      {/* Franchisees Commercial Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-100">
              <tr>
                <th className="p-4">Franqueado</th>
                <th className="p-4">Compra Mínima</th>
                <th className="p-4">Desconto (%)</th>
                <th className="p-4">Meta Mensal</th>
                <th className="p-4">Progresso da Meta</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {franchisees.map(f => {
                const isEditing = editingId === f.id;
                const purchased = f.total_purchased_month || 0;
                const meta = f.meta_mensal || 2500;
                const percent = meta > 0 ? Math.min(100, Math.round((purchased / meta) * 100)) : 100;

                return (
                  <tr key={f.id} className="hover:bg-stone-50/70 transition">
                    <td className="p-4">
                      <span className="font-bold text-stone-900 block text-xs sm:text-sm">
                        {f.nome_fantasia || f.razao_social}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">CNPJ: {f.cnpj}</span>
                    </td>

                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="50"
                          value={editValues.min}
                          onChange={e => setEditValues({ ...editValues, min: Number(e.target.value) })}
                          className="w-24 p-1 rounded-lg border border-stone-300 text-xs font-bold"
                        />
                      ) : (
                        <strong className="text-stone-900">R$ {(f.valor_minimo_compra || 500).toFixed(2)}</strong>
                      )}
                    </td>

                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editValues.desc}
                          onChange={e => setEditValues({ ...editValues, desc: Number(e.target.value) })}
                          className="w-20 p-1 rounded-lg border border-stone-300 text-xs font-bold text-emerald-700"
                        />
                      ) : (
                        <span className="font-bold text-emerald-700">{f.percentual_desconto || 0}% OFF</span>
                      )}
                    </td>

                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="100"
                          value={editValues.meta}
                          onChange={e => setEditValues({ ...editValues, meta: Number(e.target.value) })}
                          className="w-24 p-1 rounded-lg border border-stone-300 text-xs font-bold"
                        />
                      ) : (
                        <strong className="text-stone-800">R$ {(f.meta_mensal || 2500).toFixed(2)}</strong>
                      )}
                    </td>

                    <td className="p-4 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span>R$ {purchased.toFixed(2)}</span>
                          <span className="font-bold text-stone-900">{percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(f.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded-lg border border-stone-200 text-stone-600 text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(f)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs"
                        >
                          Alterar Regras
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
