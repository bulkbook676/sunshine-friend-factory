import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Shared, in-memory cart state for record-sale flows (owner, agent, distributor).
 *
 * State lives in a single provider mounted at the app root, so it survives
 * navigation between the record-sale page and the Edit Cart page. Each flow
 * uses its own namespace key so multiple carts cannot collide.
 *
 * Items are intentionally typed as a generic, payment-agnostic shape — every
 * record-sale page already maps to/from this shape internally.
 */
export interface RecordSaleCartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  unit?: string;
}

type CartMap = Record<string, RecordSaleCartItem[]>;

interface RecordSaleCartContextValue {
  getCart: (key: string) => RecordSaleCartItem[];
  setCart: (key: string, items: RecordSaleCartItem[]) => void;
  clearCart: (key: string) => void;
}

const RecordSaleCartContext = createContext<RecordSaleCartContextValue | null>(null);

export const RecordSaleCartProvider = ({ children }: { children: React.ReactNode }) => {
  const [carts, setCarts] = useState<CartMap>({});

  const setCart = useCallback((key: string, items: RecordSaleCartItem[]) => {
    setCarts((prev) => ({ ...prev, [key]: items }));
  }, []);

  const clearCart = useCallback((key: string) => {
    setCarts((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Reading from a stale closure is fine because consumers also subscribe via
  // useRecordSaleCart() which re-renders on state change.
  const getCart = useCallback((key: string) => carts[key] ?? [], [carts]);

  const value = useMemo(
    () => ({ getCart, setCart, clearCart }),
    [getCart, setCart, clearCart],
  );

  return (
    <RecordSaleCartContext.Provider value={value}>
      {children}
    </RecordSaleCartContext.Provider>
  );
};

/**
 * Hook for a specific record-sale flow. Returns reactive cart + helpers.
 * The same `key` must be used by the record-sale page and the Edit Cart page.
 */
export const useRecordSaleCart = (key: string) => {
  const ctx = useContext(RecordSaleCartContext);
  if (!ctx) {
    throw new Error("useRecordSaleCart must be used within RecordSaleCartProvider");
  }
  const items = ctx.getCart(key);
  const setItems = useCallback(
    (next: RecordSaleCartItem[] | ((prev: RecordSaleCartItem[]) => RecordSaleCartItem[])) => {
      const resolved = typeof next === "function" ? (next as (p: RecordSaleCartItem[]) => RecordSaleCartItem[])(items) : next;
      ctx.setCart(key, resolved);
    },
    [ctx, key, items],
  );
  const clear = useCallback(() => ctx.clearCart(key), [ctx, key]);
  return { items, setItems, clear };
};