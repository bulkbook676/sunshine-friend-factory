import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface GoodwillConditions {
  minMonthsOnBulkbook?: number;
  minMonthlySales?: number;
  minOrderValue?: number;
  repaymentDays: number;
  customCondition?: string;
}

export interface DistributorOwnProduct {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  freeShippingThreshold?: number;
  goodwillEnabled: boolean;
  goodwillRepaymentDays?: number;
  goodwillConditions?: GoodwillConditions;
  paymentMethods: string[];
}

export type DistributorOrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "declined";

export interface DistributorIncomingOrder {
  id: string;
  date: string;
  buyerId: string;
  buyerName: string;
  buyerLocation: string;
  items: { productId: string; productName: string; qty: number; unitPrice: number; paymentType: "cash" | "goodwill" }[];
  paymentMethod: string;
  status: DistributorOrderStatus;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  // Goodwill repayment tracking (only relevant when items contain goodwill)
  goodwillPaid?: boolean;
  goodwillPaidAt?: string;
  goodwillDeposits?: { amount: number; date: string }[];
}

interface DistributorState {
  businessName: string;
  ownerName: string;
  phone: string;
  state: string;
  area: string;
  categories: string[];
  customCategories: string[];
  freeShippingThreshold?: number;
  defaultGoodwillDays: number;
  autoApproveGoodwill: boolean;
  products: DistributorOwnProduct[];
  orders: DistributorIncomingOrder[];
  // Recorded sales the distributor makes from their own walk-in/over-the-counter
  // (separate from incoming buyer orders).
  ownSales: DistributorOwnSale[];
  ownExpenses: DistributorOwnExpense[];
}

export interface DistributorOwnSale {
  id: string;
  items: { productId: string; productName: string; qty: number; unitPrice: number }[];
  total: number;
  paymentMethod: "cash" | "transfer" | "goodwill";
  customerNote?: string;
  collaborator?: string;
  date: string;
}

export type DistributorExpenseType =
  | "Fuel/Generator"
  | "Rent"
  | "Transport"
  | "Handling"
  | "Salary"
  | "Electricity"
  | "Miscellaneous";

export interface DistributorOwnExpense {
  id: string;
  name: string;
  amount: number;
  type: DistributorExpenseType;
  date: string;
  note?: string;
}

interface DistributorContextType extends DistributorState {
  setProfile: (data: Partial<DistributorState>) => void;
  addProduct: (p: Omit<DistributorOwnProduct, "id">) => void;
  updateProduct: (id: string, p: Partial<Omit<DistributorOwnProduct, "id">>) => void;
  removeProduct: (id: string) => void;
  addCustomCategory: (cat: string) => void;
  addIncomingOrder: (o: Omit<DistributorIncomingOrder, "id" | "status" | "date"> & { id?: string; date?: string }) => void;
  setOrderStatus: (id: string, status: DistributorOrderStatus) => void;
  // Goodwill repayment tracking on incoming orders
  markGoodwillPaid: (orderId: string) => void;
  recordGoodwillDeposit: (orderId: string, amount: number) => void;
  // Distributor's own counter sales
  addOwnSale: (s: Omit<DistributorOwnSale, "id" | "date"> & { date?: string }) => void;
  // Distributor's own expenses
  addOwnExpense: (e: Omit<DistributorOwnExpense, "id">) => void;
  deleteOwnExpense: (id: string) => void;
}

const seedProducts: DistributorOwnProduct[] = [
  {
    id: "dop1",
    name: "Peak Milk (Tin)",
    category: "Dairy",
    costPrice: 280,
    sellingPrice: 350,
    currentStock: 2400,
    freeShippingThreshold: 30000,
    goodwillEnabled: true,
    goodwillRepaymentDays: 60,
    goodwillConditions: { repaymentDays: 60, minMonthsOnBulkbook: 6, minOrderValue: 10000 },
    paymentMethods: ["Cash", "Bank Transfer", "Goodwill"],
  },
  {
    id: "dop2",
    name: "Peak Milk (Sachet x10)",
    category: "Dairy",
    costPrice: 220,
    sellingPrice: 280,
    currentStock: 4000,
    goodwillEnabled: false,
    paymentMethods: ["Cash", "Bank Transfer"],
  },
];

const seedOrders: DistributorIncomingOrder[] = [
  {
    id: "io1",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    buyerId: "owner-mn",
    buyerName: "Mama Nkechi Provisions",
    buyerLocation: "Alaba, Lagos",
    items: [
      { productId: "dop1", productName: "Peak Milk (Tin)", qty: 50, unitPrice: 350, paymentType: "goodwill" },
    ],
    paymentMethod: "Bank Transfer",
    status: "pending",
  },
];

const DistributorContext = createContext<DistributorContextType | null>(null);

export const useDistributor = () => {
  const ctx = useContext(DistributorContext);
  if (!ctx) throw new Error("useDistributor must be used within DistributorProvider");
  return ctx;
};

export const DistributorProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DistributorState>({
    businessName: "",
    ownerName: "",
    phone: "",
    state: "",
    area: "",
    categories: [],
    customCategories: [],
    defaultGoodwillDays: 30,
    autoApproveGoodwill: false,
    products: seedProducts,
    orders: seedOrders,
    ownSales: [],
    ownExpenses: [
      {
        id: "de1",
        name: "Generator fuel",
        amount: 4500,
        type: "Fuel/Generator",
        date: new Date().toISOString().split("T")[0],
      },
      {
        id: "de2",
        name: "Loader handling",
        amount: 2000,
        type: "Handling",
        date: new Date().toISOString().split("T")[0],
      },
    ],
  });

  const setProfile = (data: Partial<DistributorState>) => setState((p) => ({ ...p, ...data }));

  const addProduct = (p: Omit<DistributorOwnProduct, "id">) =>
    setState((s) => ({ ...s, products: [...s.products, { ...p, id: `dop-${Date.now()}` }] }));

  const updateProduct = (id: string, p: Partial<Omit<DistributorOwnProduct, "id">>) =>
    setState((s) => ({
      ...s,
      products: s.products.map((prod) => (prod.id === id ? { ...prod, ...p } : prod)),
    }));

  const removeProduct = (id: string) =>
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));

  const addCustomCategory = (cat: string) =>
    setState((s) =>
      s.customCategories.includes(cat) ? s : { ...s, customCategories: [...s.customCategories, cat] }
    );

  const addIncomingOrder = (o: Omit<DistributorIncomingOrder, "id" | "status" | "date"> & { id?: string; date?: string }) =>
    setState((s) => ({
      ...s,
      orders: [
        {
          ...o,
          id: o.id ?? `io-${Date.now()}`,
          status: "pending",
          date: o.date ?? new Date().toISOString(),
        } as DistributorIncomingOrder,
        ...s.orders,
      ],
    }));

  const setOrderStatus = useCallback((id: string, status: DistributorOrderStatus) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== id) return o;
        const stamp = new Date().toISOString();
        return {
          ...o,
          status,
          confirmedAt: status === "confirmed" ? stamp : o.confirmedAt,
          shippedAt: status === "shipped" ? stamp : o.shippedAt,
          deliveredAt: status === "delivered" ? stamp : o.deliveredAt,
        };
      }),
    }));
  }, []);

  const markGoodwillPaid = (orderId: string) =>
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === orderId
          ? { ...o, goodwillPaid: true, goodwillPaidAt: new Date().toISOString() }
          : o
      ),
    }));

  const recordGoodwillDeposit = (orderId: string, amount: number) => {
    if (amount <= 0) return;
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const deposits = [...(o.goodwillDeposits ?? []), { amount, date: new Date().toISOString() }];
        const goodwillTotal = o.items
          .filter((i) => i.paymentType === "goodwill")
          .reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
        const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
        return totalDeposited >= goodwillTotal
          ? { ...o, goodwillDeposits: deposits, goodwillPaid: true, goodwillPaidAt: new Date().toISOString() }
          : { ...o, goodwillDeposits: deposits };
      }),
    }));
  };

  const addOwnSale = (sale: Omit<DistributorOwnSale, "id" | "date"> & { date?: string }) =>
    setState((s) => {
      // Reduce stock on sold products
      const newProducts = s.products.map((p) => {
        const sold = sale.items.find((i) => i.productId === p.id);
        return sold ? { ...p, currentStock: Math.max(0, p.currentStock - sold.qty) } : p;
      });
      return {
        ...s,
        products: newProducts,
        ownSales: [
          { ...sale, id: `dos-${Date.now()}`, date: sale.date ?? new Date().toISOString() },
          ...s.ownSales,
        ],
      };
    });

  const addOwnExpense = (e: Omit<DistributorOwnExpense, "id">) =>
    setState((s) => ({
      ...s,
      ownExpenses: [{ ...e, id: `de-${Date.now()}` }, ...s.ownExpenses],
    }));

  const deleteOwnExpense = (id: string) =>
    setState((s) => ({ ...s, ownExpenses: s.ownExpenses.filter((e) => e.id !== id) }));

  return (
    <DistributorContext.Provider
      value={{
        ...state,
        setProfile,
        addProduct,
        updateProduct,
        removeProduct,
        addCustomCategory,
        addIncomingOrder,
        setOrderStatus,
        markGoodwillPaid,
        recordGoodwillDeposit,
        addOwnSale,
        addOwnExpense,
        deleteOwnExpense,
      }}
    >
      {children}
    </DistributorContext.Provider>
  );
};
