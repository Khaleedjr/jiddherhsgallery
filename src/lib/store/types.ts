import type { Product } from "@/lib/types";

export type ProductStatus = "published" | "draft";

/** A catalogue product as the store keeps it: the storefront shape plus admin bookkeeping. */
export type StoredProduct = Product & {
  status: ProductStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export const ORDER_STATUSES = ["pending", "confirmed", "dispatched", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_CHANNELS = ["website", "whatsapp", "instagram", "walk-in", "other"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const PAYMENT_METHODS = ["paystack", "transfer", "cash", "pos", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** An online payment for a website order. "awaiting": sent to Paystack, not paid (yet). */
export type OrderPayment = {
  provider: "paystack";
  status: "awaiting" | "paid";
  /** Reference of the latest payment attempt. */
  reference: string;
  /** Naira actually received. */
  amount: number | null;
  /** card, bank_transfer, ussd… as Paystack reports it. */
  channel: string | null;
  paidAt: string | null;
};

export type OrderItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  image: string | null;
  price: number;
  quantity: number;
};

export type OrderEvent = {
  at: string;
  status: OrderStatus | null;
  note: string;
  by: "customer" | "admin" | "system";
};

export type Order = {
  id: string;
  ref: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  channel: OrderChannel;
  customer: { name: string; phone: string; email: string | null };
  fulfilment: "delivery" | "pickup";
  /** `method`: the shipping option chosen at checkout, e.g. "Iddo Park" (website orders since Paystack). */
  shipping: { state: string | null; city: string | null; address: string | null; method?: string | null };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  /** Online payment, for website orders paid through Paystack. */
  payment?: OrderPayment;
  customerNote: string | null;
  history: OrderEvent[];
  /** True once the order's units have been taken out of stock, so a cancel knows to put them back. */
  stockDeducted: boolean;
  /** Sample orders from `npm run seed:demo`, so they can be cleared in one go. */
  demo?: boolean;
};

export const STOCK_REASONS = ["restock", "sale", "return", "correction", "damaged", "initial"] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

export type StockMovement = {
  id: string;
  at: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  change: number;
  before: number | null;
  after: number | null;
  reason: StockReason;
  note: string | null;
  orderRef: string | null;
  demo?: boolean;
};

export type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  state: string | null;
  city: string | null;
  orders: number;
  /** Revenue from orders that weren't cancelled. */
  spent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  refs: string[];
};
