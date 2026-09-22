import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CartProvider, useCart } from './context/CartContext.js';
import { ToastProvider, useToast } from './context/ToastContext.js';
import { Header } from './components/layout/Header.js';
import { OfflineIndicator } from './components/pwa/OfflineIndicator.js';
import { ProductCatalog } from './components/franchisee/ProductCatalog.js';
import { FranchiseeDashboard } from './components/franchisee/FranchiseeDashboard.js';
import { OrderHistory } from './components/franchisee/OrderHistory.js';
import { FranchiseeProfile } from './components/franchisee/FranchiseeProfile.js';
import { RegisterPage } from './components/franchisee/RegisterPage.js';
import { CartDrawer } from './components/franchisee/CartDrawer.js';
import { OrderConfirmedModal } from './components/franchisee/OrderConfirmedModal.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { AdminLoginModal } from './components/auth/AdminLoginModal.js';
import { AIAssistantWidget } from './components/franchisee/AIAssistantWidget.js';

// Admin Views
import { AdminSidebar } from './components/admin/AdminSidebar.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { AdminOrders } from './components/admin/AdminOrders.js';
import { AdminFranchisees } from './components/admin/AdminFranchisees.js';
import { AdminProducts } from './components/admin/AdminProducts.js';
import { AdminCommercialRules } from './components/admin/AdminCommercialRules.js';
import { AdminHours } from './components/admin/AdminHours.js';
import { AdminBluefocus } from './components/admin/AdminBluefocus.js';
import { AdminNtfy } from './components/admin/AdminNtfy.js';
import { AdminReports } from './components/admin/AdminReports.js';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.js';
import { AdminSettings } from './components/admin/AdminSettings.js';

import { Order, Product } from './types.js';
import { api } from './lib/api.js';
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  Store,
  MessageCircle,
  Clock,
  Flame,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, franchisee, quickSwitch, isLoading } = useAuth();
  const { populateItems } = useCart();

  // Navigation State
  // Franchisee views: 'catalog' | 'dashboard' | 'orders' | 'profile' | 'register'
  // Admin views: 'admin' (with adminTab)
  const [currentView, setCurrentView] = useState<string>('catalog');
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Drawer and Modals
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedWarning, setConfirmedWarning] = useState<string | undefined>(undefined);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  // Quick stats for Admin sidebar badges
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [pendingFranchiseesCount, setPendingFranchiseesCount] = useState<number>(0);

  // Synchronize initial view based on role
  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminBadges();
    }
    // Sempre iniciar na página de vendas (catalog) ao logar
    setCurrentView('catalog');
  }, [user?.role]);

  const loadAdminBadges = async () => {
    try {
      const stats = await api.getDashboardStats();
      setPendingOrdersCount(stats.ordersPendingRelease || 0);
      setPendingFranchiseesCount(stats.pendingApprovalFranchisees || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepeatOrder = async (orderId: string) => {
    try {
      const [order, allProducts] = await Promise.all([
        api.getOrderById(orderId),
        api.getProducts(franchisee?.id),
      ]);

      if (order && order.items) {
        populateItems(order.items, allProducts);
        setIsCartOpen(true);
      }
    } catch (err: any) {
      alert(`Não foi possível carregar o pedido: ${err.message}`);
    }
  };

  const handleOrderSuccess = (order: Order, warning?: string) => {
    setIsCartOpen(false);
    setConfirmedOrder(order);
    setConfirmedWarning(warning);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center font-black text-xl text-stone-950 animate-bounce">
            B
          </div>
          <p className="text-xs font-bold text-stone-400">Carregando Balbec B2B...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col font-sans text-stone-900 selection:bg-amber-500 selection:text-stone-950">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin-dashboard') {
            setCurrentView('admin');
            setAdminTab('dashboard');
          } else {
            setCurrentView(view);
          }
        }}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Franchisee Subnavigation Bar */}
      {(user?.role === 'franchisee' || (user?.role === 'admin' && currentView !== 'admin')) && currentView !== 'register' && (
        <nav className="bg-white border-b border-stone-200/80 sticky top-16 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-none py-1.5 gap-2 text-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                id="tab-franchisee-catalog"
                onClick={() => setCurrentView('catalog')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                  currentView === 'catalog'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cardápio B2B</span>
              </button>

              <button
                id="tab-franchisee-dashboard"
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                  currentView === 'dashboard'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel & Metas</span>
              </button>

              <button
                id="tab-franchisee-orders"
                onClick={() => setCurrentView('orders')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                  currentView === 'orders'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Meus Pedidos</span>
              </button>

              <button
                id="tab-franchisee-profile"
                onClick={() => setCurrentView('profile')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                  currentView === 'profile'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Regras & Unidade</span>
              </button>
            </div>

            {franchisee && (
              <div className="hidden md:flex items-center gap-2 text-[11px] text-stone-500">
                <span className="font-semibold text-stone-900">{franchisee.nome_fantasia}</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">{franchisee.percentual_desconto}% Desconto</span>
                <span>•</span>
                <span>Mínimo R$ {franchisee.valor_minimo_compra?.toFixed(2)}</span>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* CATALOG / SALES / FRANCHISEE VIEWS */}
        {currentView !== 'admin' && (
          <>
            {currentView === 'catalog' && (
              <ProductCatalog onOpenCart={() => setIsCartOpen(true)} />
            )}

            {currentView === 'dashboard' && (
              <FranchiseeDashboard
                onNavigate={setCurrentView}
                onRepeatOrder={handleRepeatOrder}
              />
            )}

            {currentView === 'orders' && (
              <OrderHistory
                onRepeatOrder={handleRepeatOrder}
                onNavigateToCatalog={() => setCurrentView('catalog')}
              />
            )}

            {currentView === 'profile' && (
              <FranchiseeProfile />
            )}

            {currentView === 'register' && (
              <RegisterPage
                onBack={() => setCurrentView('catalog')}
                onSuccess={(email) => {
                  quickSwitch(email);
                  setCurrentView('dashboard');
                }}
              />
            )}
          </>
        )}

        {/* ADMIN PANEL VIEW */}
        {user?.role === 'admin' && currentView === 'admin' && (
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
            <AdminSidebar
              currentTab={adminTab}
              onSelectTab={setAdminTab}
              pendingOrdersCount={pendingOrdersCount}
              pendingFranchiseesCount={pendingFranchiseesCount}
            />

            <div className="flex-1 overflow-y-auto">
              {adminTab === 'dashboard' && <AdminDashboard onNavigateTab={setAdminTab} />}
              {adminTab === 'orders' && <AdminOrders />}
              {adminTab === 'franchisees' && <AdminFranchisees />}
              {adminTab === 'products' && <AdminProducts />}
              {adminTab === 'rules' && <AdminCommercialRules />}
              {adminTab === 'hours' && <AdminHours />}
              {adminTab === 'bluefocus' && <AdminBluefocus />}
              {adminTab === 'ntfy' && <AdminNtfy />}
              {adminTab === 'reports' && <AdminReports />}
              {adminTab === 'audit' && <AdminAuditLogs />}
              {adminTab === 'settings' && <AdminSettings />}
            </div>
          </div>
        )}
      </main>

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderCreated={handleOrderSuccess}
      />

      {/* Order Confirmed / Pending Release Modal */}
      <OrderConfirmedModal
        order={confirmedOrder}
        warning={confirmedWarning}
        onClose={() => setConfirmedOrder(null)}
        onViewOrders={() => {
          setConfirmedOrder(null);
          setCurrentView('orders');
        }}
      />

      {/* Floating Support WhatsApp Button (Item 25) */}
      <a
        id="btn-whatsapp-support"
        href="https://wa.me/5511999998888?text=Ol%C3%A1%2C%20sou%20franqueado%20Balbec%20e%20preciso%20de%20suporte%20sobre%20meu%20pedido"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition hover:scale-105"
        title="Canal direto com a expedição Balbec"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Suporte Expedição</span>
      </a>

      {/* Balbec AI Assistant Widget */}
      {user?.role === 'franchisee' && <AIAssistantWidget />}

      {/* Offline Status Bar indicator */}
      <OfflineIndicator />

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-4 px-6 text-center text-xs text-stone-500 relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-stone-700">
              Balbec Salgados — Portal do Franqueado & Sistema B2B da Fábrica
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Retirada expressa em 50 minutos • Integração ERP Bluefocus com Contingência Ativa • PWA Offline First
            </p>
          </div>

          <button
            onClick={() => setIsAdminLoginModalOpen(true)}
            className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition flex items-center gap-1.5 text-[11px] font-medium"
            title="Acesso Administrativo (Diretoria)"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => setCurrentView('admin')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
