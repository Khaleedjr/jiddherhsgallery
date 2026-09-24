"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  key: string;
  /** Catalogue ids let the server re-price the order; carts saved before they existed fall back to slug. */
  productId?: string;
  variantId?: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  price: number;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  lastAdded: CartItem | null;
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "jidderhs-cart-v1";

const itemKey = (slug: string, variantLabel: string | null) =>
  variantLabel ? `${slug}::${variantLabel}` : slug;

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.key === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number"
  );
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem));
      }
    } catch {
      // A blocked or corrupt store just means we start with an empty cart.
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private browsing: the cart still works for this session.
    }
  }, [items]);

  // Close the drawer on Escape from anywhere.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const add: CartContextValue["add"] = useCallback((item, quantity = 1) => {
    const key = itemKey(item.slug, item.variantLabel);
    const next: CartItem = { ...item, key, quantity };
    setItems((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (existing) {
        return current.map((entry) =>
          entry.key === key ? { ...entry, quantity: entry.quantity + quantity } : entry,
        );
      }
      return [...current, next];
    });
    setLastAdded(next);
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((entry) => entry.key !== key)
        : current.map((entry) => (entry.key === key ? { ...entry, quantity } : entry)),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((entry) => entry.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      lastAdded,
      add,
      setQuantity,
      remove,
      clear,
      openCart,
      closeCart,
    };
  }, [items, isOpen, lastAdded, add, setQuantity, remove, clear, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
