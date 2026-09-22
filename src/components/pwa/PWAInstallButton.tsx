import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.js';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install-header"
        onClick={install}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold text-xs transition shadow-sm"
        title="Instalar App Balbec no Computador ou Celular"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios-header"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-medium text-xs transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Instalar no iPhone / iPad</h3>
                    <p className="text-xs text-stone-500">Balbec Salgados PWA</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-stone-700">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Role a lista para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito. Pronto!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('balbec_pwa_banner_dismissed');
    if (!hasDismissed && !isInstalled && (isInstallable || isIOS)) {
      setDismissed(false);
    }
  }, [isInstalled, isInstallable, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem('balbec_pwa_banner_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <div id="pwa-invitation-banner" className="bg-linear-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-xl shrink-0">
            📱
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight text-amber-100">Tenha a Balbec Salgados sempre à mão</h4>
            <p className="text-xs text-white/90">Instale nosso aplicativo para fazer seus pedidos com mais rapidez e receber alertas de preparo.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-pwa-dismiss"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-200 hover:text-white hover:bg-white/10 transition"
          >
            Agora Não
          </button>
          {isInstallable ? (
            <button
              id="btn-pwa-install-banner"
              onClick={install}
              className="px-4 py-1.5 rounded-lg bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition shadow-sm"
            >
              Instalar Aplicativo
            </button>
          ) : (
            <button
              id="btn-pwa-ios-banner"
              onClick={() => setShowIOSGuide(true)}
              className="px-4 py-1.5 rounded-lg bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition shadow-sm"
            >
              Instruções iOS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
