import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Bell,
  UserCheck,
  Clock,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Store,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useCart } from '../../context/CartContext.js';
import { api } from '../../lib/api.js';
import { PWAInstallButton } from '../pwa/PWAInstallButton.js';
import { AppNotification } from '../../types.js';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenCart }) => {
  const { user, franchisee, quickSwitch, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; message?: string; nextOpening?: string }>({ isOpen: true });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadStoreStatus();
    loadNotifications();
    const interval = setInterval(() => {
      loadStoreStatus();
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id, franchisee?.id]);

  const loadStoreStatus = async () => {
    try {
      const res = await api.getStoreStatus();
      setStoreStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications(franchisee?.id);
      setNotifications(res);
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(user?.role === 'admin' ? 'admin-dashboard' : 'catalog')}>
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-600 to-orange-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <img src="/icon.svg" alt="Balbec Salgados" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-stone-900 tracking-tight font-serif">BALBEC</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">B2B</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium -mt-0.5">Portal do Franqueado</p>
          </div>
        </div>

        {/* Store Status Pill */}
        <div className="hidden md:flex items-center gap-2">
          {storeStatus.isOpen ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Fábrica Aberta • Pedidos Disponíveis</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
              title={storeStatus.message}
            >
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span className="truncate max-w-[200px]">{storeStatus.nextOpening || 'Fábrica Fechada'}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* PWA Button */}
          <PWAInstallButton />

          {/* Notifications Bell */}
          <div className="relative">
            <button
              id="btn-notifications-toggle"
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-3 shadow-2xl border border-stone-200 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                  <span className="font-bold text-stone-900">Avisos e Notificações</span>
                  <span className="text-[10px] text-stone-400">{notifications.length} registros</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-center text-stone-400 py-4">Nenhuma notificação no momento.</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer ${n.read ? 'bg-stone-50 border-stone-100 text-stone-600' : 'bg-amber-50/80 border-amber-200 text-stone-900 font-medium'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-950">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-stone-400 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            id="btn-open-cart-header"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {totalItemsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-amber-900 font-extrabold text-[11px] flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-stone-500 hover:text-rose-600 hover:bg-stone-100 rounded-xl transition"
            title="Sair do Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
