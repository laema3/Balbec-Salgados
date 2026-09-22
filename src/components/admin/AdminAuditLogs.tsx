import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, FileText, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { AuditLog } from '../../types.js';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.reason && l.reason.toLowerCase().includes(search.toLowerCase())) ||
    l.target_entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Auditoria & Rastreabilidade de Ações
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
              Trilha Imutável
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro de liberação manual de pedidos, alterações de regras e bloqueios de franqueados.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por ação, responsável ou motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-100">
              <tr>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Ação Executada</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">Entidade / Alvo</th>
                <th className="p-4">Motivo Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/70 transition">
                  <td className="p-4 text-stone-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>

                  <td className="p-4">
                    <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-900">
                      {log.action}
                    </span>
                  </td>

                  <td className="p-4 font-semibold text-stone-900">
                    {log.user_name}
                  </td>

                  <td className="p-4 text-stone-600 font-mono text-[11px]">
                    {log.target_entity} #{log.target_id.slice(-6)}
                  </td>

                  <td className="p-4">
                    {log.reason ? (
                      <span className="text-stone-900 font-medium bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/60 block">
                        "{log.reason}"
                      </span>
                    ) : (
                      <span className="text-stone-400 italic">-</span>
                    )}
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
