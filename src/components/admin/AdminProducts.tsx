import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  X,
  Check,
  DollarSign,
  Tag
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Product, Category, Franchisee } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminProducts: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [search, setSearch] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [customPriceModalProduct, setCustomPriceModalProduct] = useState<Product | null>(null);
  const [selectedFranchiseeId, setSelectedFranchiseeId] = useState<string>('');
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [prods, cats, frans] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getFranchisees(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setFranchisees(frans);
    } catch (e: any) {
      showToast(`Erro ao carregar produtos: ${e.message}`, 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct);
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        await api.createProduct(editingProduct);
        showToast('Produto cadastrado com sucesso!', 'success');
      }
      setEditingProduct(null);
      await loadAll();
    } catch (err: any) {
      showToast(`Erro ao salvar produto: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await api.deleteProduct(id);
      showToast('Produto excluído com sucesso!', 'success');
      await loadAll();
    } catch (err: any) {
      showToast(`Erro ao excluir produto: ${err.message}`, 'error');
    }
  };

  const handleSetCustomPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPriceModalProduct || !selectedFranchiseeId || !customPriceInput) return;

    try {
      await api.setFranchiseeProductPrice(
        customPriceModalProduct.id,
        selectedFranchiseeId,
        parseFloat(customPriceInput)
      );
      showToast('Preço especial por franqueado configurado com sucesso!', 'success');
      setSelectedFranchiseeId('');
      setCustomPriceInput('');
      setCustomPriceModalProduct(null);
      await loadAll();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Catálogo & Preços de Salgados
          </h2>
          <p className="text-xs text-stone-500">
            Gerencie itens do cardápio, fotos, centos e tabelas de preço diferenciadas por franqueado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar salgado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            id="btn-add-product"
            onClick={() => setEditingProduct({
              name: '',
              sku: `SKU-${Date.now().toString().slice(-4)}`,
              internal_code: 'BAL-NEW',
              category_id: categories[0]?.id || 'cat-1',
              price: 110,
              unit: 'Cento (100 un)',
              image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
              active: true,
              description: '',
            })}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Salgado</span>
          </button>
        </div>
      </div>

      {/* Product Cards Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-100">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">SKU / Categoria</th>
                <th className="p-4">Preço Padrão</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-stone-50/70 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100"
                      />
                      <div>
                        <span className="font-bold text-stone-900 block text-xs sm:text-sm">{p.name}</span>
                        <span className="text-[11px] text-stone-500 line-clamp-1">{p.description}</span>
                        <span className="text-[10px] text-stone-400 block">{p.unit}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-mono font-bold text-stone-800 block">{p.sku}</span>
                    <span className="text-[11px] text-stone-500">
                      {categories.find(c => c.id === p.category_id)?.name || 'Geral'}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="font-extrabold text-stone-900 text-sm">
                      R$ {p.price.toFixed(2)}
                    </div>
                    {p.promo_price && (
                      <span className="text-[11px] text-emerald-700 block">
                        Promo: R$ {p.promo_price.toFixed(2)}
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setCustomPriceModalProduct(p)}
                        className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1"
                        title="Tabela de preço especial para um franqueado específico"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Preço Especial</span>
                      </button>

                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-stone-100"
                        title="Excluir produto"
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

      {/* Edit / Add Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-extrabold text-sm text-stone-900">
                {editingProduct.id ? 'Editar Salgado' : 'Novo Salgado Balbec'}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Categoria *</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Unidade de Venda</label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'Cento (100 un)'}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">URL da Imagem</label>
                <input
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 text-[11px]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editingProduct.active ?? true}
                  onChange={e => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="activeCheck" className="text-stone-700 font-semibold cursor-pointer">
                  Produto Ativo no Catálogo B2B
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="py-2 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Price Modal (Item 12: Preço Diferenciado por Franqueado) */}
      {customPriceModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Preço Especial por Franqueado</span>
              </div>
              <button onClick={() => setCustomPriceModalProduct(null)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Defina um valor customizado para <strong>{customPriceModalProduct.name}</strong> (Preço padrão: R$ {customPriceModalProduct.price.toFixed(2)}).
            </p>

            <form onSubmit={handleSetCustomPrice} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Selecione o Franqueado *
                </label>
                <select
                  required
                  value={selectedFranchiseeId}
                  onChange={e => setSelectedFranchiseeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 text-stone-900"
                >
                  <option value="">Escolha um franqueado...</option>
                  {franchisees.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome_fantasia || f.razao_social} ({f.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Preço Especial (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 95.00"
                  value={customPriceInput}
                  onChange={e => setCustomPriceInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 font-bold text-amber-900 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCustomPriceModalProduct(null)}
                  className="py-2 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
                >
                  Aplicar Preço Especial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
