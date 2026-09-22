import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Check, Sparkles, AlertCircle, ShoppingBag, Filter } from 'lucide-react';
import { Product, Category } from '../../types.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useCart } from '../../context/CartContext.js';

interface ProductCatalogProps {
  onOpenCart: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ onOpenCart }) => {
  const { franchisee } = useAuth();
  const { addItem, totalItemsCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; message?: string; nextOpening?: string }>({ isOpen: true });

  useEffect(() => {
    loadCatalog();
  }, [franchisee?.id]);

  const loadCatalog = async () => {
    try {
      const [prods, cats, status] = await Promise.all([
        api.getProducts(franchisee?.id),
        api.getCategories(),
        api.getStoreStatus(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setStoreStatus(status);
    } catch (e) {
      console.error('Erro ao carregar catálogo:', e);
    }
  };

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    addItem(product, qty);
    setAddedNotice(`${qty}x ${product.name} adicionado ao pedido!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchesCat = selectedCategory === 'TODAS' || p.category_id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notice */}
      {addedNotice && (
        <div className="fixed top-20 right-4 z-50 rounded-2xl bg-stone-900 text-white px-4 py-3 shadow-2xl border border-amber-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xs">
            ✓
          </div>
          <span className="text-xs font-semibold">{addedNotice}</span>
          <button
            onClick={onOpenCart}
            className="text-xs text-amber-400 font-bold underline hover:text-amber-300 ml-2"
          >
            Ver Carrinho
          </button>
        </div>
      )}

      {/* Store Closed Banner Notice if applicable */}
      {!storeStatus.isOpen && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm">Fábrica Fora do Horário de Atendimento</h4>
            <p className="mt-0.5">{storeStatus.message}</p>
            {storeStatus.nextOpening && (
              <p className="font-semibold text-rose-800 mt-1">{storeStatus.nextOpening}</p>
            )}
          </div>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Catálogo de Salgados B2B</h2>
            <p className="text-xs text-stone-500">
              Salgados artesanais finos para eventos e lanchonetes da franquia Balbec.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-products"
              type="text"
              placeholder="Buscar salgado ou código SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="cat-pill-all"
            onClick={() => setSelectedCategory('TODAS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'TODAS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Todas as Linhas ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id && p.active).length;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8">
          <p className="text-sm font-semibold text-stone-500">Nenhum salgado encontrado para os filtros selecionados.</p>
          <button
            onClick={() => { setSelectedCategory('TODAS'); setSearchQuery(''); }}
            className="mt-3 text-xs text-amber-700 font-bold hover:underline"
          >
            Limpar filtros de busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map(product => {
            const currentQty = quantities[product.id] || 1;
            const hasCustomPrice = product.custom_price !== undefined && product.custom_price !== null;
            const effectivePrice = hasCustomPrice ? product.custom_price! : (product.promo_price ?? product.price);

            return (
              <div
                key={product.id}
                id={`card-product-${product.id}`}
                className="bg-white rounded-3xl border border-stone-200/80 hover:border-amber-400 hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Photo & Badges */}
                <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white">
                      {product.sku}
                    </span>
                    {hasCustomPrice && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                        Tabela Franqueado
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-stone-800 shadow-xs">
                      {product.unit}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 leading-snug group-hover:text-amber-800 transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing Details */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
                    <div>
                      {hasCustomPrice ? (
                        <div>
                          <span className="text-[10px] text-stone-400 line-through block">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="text-lg font-extrabold text-amber-700">
                            R$ {effectivePrice.toFixed(2)}
                          </span>
                        </div>
                      ) : product.promo_price ? (
                        <div>
                          <span className="text-[10px] text-stone-400 line-through block">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="text-lg font-extrabold text-emerald-700">
                            R$ {effectivePrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-stone-900">
                          R$ {effectivePrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 block -mt-0.5">por {product.unit}</span>
                    </div>

                    {/* Stock indicator */}
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Estoque OK
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 pt-0">
                  <div className="flex items-center gap-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                      <button
                        onClick={() => handleQtyChange(product.id, -1)}
                        className="px-2.5 py-2 hover:bg-stone-200 text-stone-600 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold text-stone-900 min-w-[28px] text-center">
                        {currentQty}
                      </span>
                      <button
                        onClick={() => handleQtyChange(product.id, 1)}
                        className="px-2.5 py-2 hover:bg-stone-200 text-stone-600 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      id={`btn-add-${product.id}`}
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
