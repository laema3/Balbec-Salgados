import React from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Sliders,
  Clock,
  RefreshCw,
  Bell,
  BarChart3,
  ShieldCheck,
  Settings,
  Flame,
  AlertCircle
} from 'lucide-react';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingFranchiseesCount?: number;
  pendingOrdersCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingFranchiseesCount = 0,
  pendingOrdersCount = 0,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Pedidos & Produção',
      icon: Package,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} pendente${pendingOrdersCount > 1 ? 's' : ''}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'franchisees',
      label: 'Franqueados',
      icon: Users,
      badge: pendingFranchiseesCount > 0 ? `${pendingFranchiseesCount} novo${pendingFranchiseesCount > 1 ? 's' : ''}` : undefined,
      badgeColor: 'bg-amber-500 text-stone-950 font-bold',
    },
    { id: 'products', label: 'Produtos & Preços', icon: ShoppingBag },
    { id: 'rules', label: 'Regras Comerciais', icon: Sliders },
    { id: 'hours', label: 'Horários & Feriados', icon: Clock },
    { id: 'bluefocus', label: 'ERP Bluefocus', icon: RefreshCw },
    { id: 'ntfy', label: 'Notificações NTFY', icon: Bell },
    { id: 'reports', label: 'Relatórios & Vendas', icon: BarChart3 },
    { id: 'audit', label: 'Auditoria & Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-stone-200/80 p-3 sm:p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-stone-400">
          Painel de Gestão B2B
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-stone-200 text-stone-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <Flame className="w-3.5 h-3.5 text-amber-600" />
          <span>Fábrica Balbec B2B</span>
        </div>
        <p className="text-[10px] text-amber-800">
          Controle central de expedição, limites comerciais e retaguarda ERP.
        </p>
      </div>
    </aside>
  );
};
