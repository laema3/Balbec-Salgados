import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Franchisee } from '../types.js';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.js';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartEvaluation {
  allowed: boolean;
  reason?: string;
  meetsMinimum: boolean;
  minimumRequired: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  accumulatedMonth: number;
  metaMensal: number;
  metaRestante: number;
  metaPercentualAtingido: number;
  storeStatus: { isOpen: boolean; message?: string; nextOpening?: string };
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  evaluation: CartEvaluation | null;
  isEvaluating: boolean;
  reEvaluate: () => Promise<void>;
  populateItems: (rawItems: Array<{ product_id: string; quantity: number }>, allProducts: Product[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { franchisee } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('balbec_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [evaluation, setEvaluation] = useState<CartEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('balbec_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
    reEvaluate();
  }, [items, franchisee?.id]);

  const reEvaluate = async () => {
    if (!franchisee) {
      setEvaluation(null);
      return;
    }

    if (items.length === 0) {
      // Obter ao menos os dados da meta e horário
      try {
        const res = await api.evaluateCart(franchisee.id, []);
        setEvaluation(res);
      } catch (e) {
        setEvaluation(null);
      }
      return;
    }

    setIsEvaluating(true);
    try {
      const payload = items.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));
      const res = await api.evaluateCart(franchisee.id, payload);
      setEvaluation(res);
    } catch (err) {
      console.warn('Erro ao avaliar carrinho:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('balbec_cart_items');
  };

  const populateItems = (rawItems: Array<{ product_id: string; quantity: number }>, allProducts: Product[]) => {
    const newCart: CartItem[] = [];
    rawItems.forEach(ri => {
      const prod = allProducts.find(p => p.id === ri.product_id);
      if (prod && prod.active) {
        newCart.push({ product: prod, quantity: ri.quantity });
      }
    });
    setItems(newCart);
  };

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        evaluation,
        isEvaluating,
        reEvaluate,
        populateItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de CartProvider');
  }
  return context;
}
