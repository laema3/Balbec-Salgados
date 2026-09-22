import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, DollarSign, Package, TrendingUp, Percent } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Order } from '../../types.js';

export const AdminReports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<string>('MONTH');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders(undefined, 'TODOS');
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (period === 'ALL') return true;
    const orderDate = new Date(o.created_at);
    const now = new Date();

    if (period === 'TODAY') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (period === 'WEEK') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }
    if (period === 'MONTH') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscounts = filteredOrders.reduce((sum, o) => sum + o.discount_amount, 0);
  const totalCount = filteredOrders.length;
  const avgTicket = totalCount > 0 ? totalSales / totalCount : 0;

  // Product sales ranking
  const productSalesMap: Record<string, { name: string; quantity: number; total: number }> = {};
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.product_name,
          quantity: 0,
          total: 0,
        };
      }
      productSalesMap[item.product_id].quantity += item.quantity;
      productSalesMap[item.product_id].total += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('Nenhum pedido para exportar no período.');
      return;
    }

    const headers = ['Numero', 'Data', 'Franqueado', 'CNPJ', 'Subtotal', 'Desconto', 'Total', 'Pagamento', 'Status'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleString('pt-BR'),
      `"${(o.franchisee_name || 'Franqueado').replace(/"/g, '""')}"`,
      o.franchisee_cnpj || '-',
      o.subtotal.toFixed(2),
      o.discount_amount.toFixed(2),
      o.total.toFixed(2),
      o.payment_method,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `balbec_relatorio_pedidos_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Relatórios Comerciais & Vendas B2B
          </h2>
          <p className="text-xs text-stone-500">
            Faturamento, descontos concedidos e ranking dos salgados mais vendidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="p-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-800"
          >
            <option value="TODAY">Hoje</option>
            <option value="WEEK">Últimos 7 Dias</option>
            <option value="MONTH">Mês Atual</option>
            <option value="ALL">Todo o Período</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
          <span className="text-stone-400 text-xs font-semibold">Total Faturado</span>
          <div className="text-2xl font-black text-stone-900">R$ {totalSales.toFixed(2)}</div>
          <span className="text-[10px] text-stone-500">{totalCount} pedidos emitidos</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
          <span className="text-stone-400 text-xs font-semibold">Descontos Comerciais</span>
          <div className="text-2xl font-black text-emerald-700">R$ {totalDiscounts.toFixed(2)}</div>
          <span className="text-[10px] text-stone-500">Concedidos em contrato</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
          <span className="text-stone-400 text-xs font-semibold">Volume de Pedidos</span>
          <div className="text-2xl font-black text-amber-900">{totalCount}</div>
          <span className="text-[10px] text-stone-500">No período selecionado</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
          <span className="text-stone-400 text-xs font-semibold">Ticket Médio</span>
          <div className="text-2xl font-black text-stone-900">R$ {avgTicket.toFixed(2)}</div>
          <span className="text-[10px] text-stone-500">Valor médio por compra</span>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>Ranking de Salgados Mais Vendidos (Centos)</span>
        </h3>

        {topProducts.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-4 text-center">Nenhuma venda registrada no período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Posição</th>
                  <th className="p-3">Salgado</th>
                  <th className="p-3">Centos Vendidos</th>
                  <th className="p-3 rounded-r-xl text-right">Faturamento Gerado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {topProducts.map((p, idx) => (
                  <tr key={p.name} className="hover:bg-stone-50/70 transition">
                    <td className="p-3 font-bold text-amber-900">#{idx + 1}</td>
                    <td className="p-3 font-semibold text-stone-900">{p.name}</td>
                    <td className="p-3 font-bold">{p.quantity} centos ({p.quantity * 100} un)</td>
                    <td className="p-3 text-right font-black text-stone-900">
                      R$ {p.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
