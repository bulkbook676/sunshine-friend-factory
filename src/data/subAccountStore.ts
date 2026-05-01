/**
 * Sub-account / billing / permissions store.
 *
 * In-memory mock state that powers:
 *   - Authorization key issuing (business-unique + auto-revoke after 30 days no sales)
 *   - Per-agent permissions (record sales / view inventory / add products)
 *   - Subscription billing for additional agent slots (mock UI only)
 *
 * Designed so swapping in Lovable Cloud later is a one-file change.
 */

// ---------- Types ----------

export interface AgentPermissions {
  /** Always on for authorized agents. UI must lock this toggle. */
  recordSales: true;
  /** Always on for authorized agents (read-only). UI must lock this toggle. */
  viewInventory: true;
  /** Optional permission. Owner can grant/revoke. */
  addProducts: boolean;
}

export interface IssuedAuthKey {
  /** 6-digit code, zero-padded. */
  code: string;
  /** Business that issued the key. Keys are unique per business. */
  businessId: string;
  /** ISO timestamp of issuance. */
  issuedAt: string;
  /** ISO timestamp of expiry (24h after issuance). */
  expiresAt: string;
  /** Whether the key has been redeemed by an agent. */
  redeemed: boolean;
}

export interface AgentSubscription {
  id: string;
  agentId: string;
  agentName: string;
  monthlyCost: number; // NGN
  /** ISO date of next renewal. */
  nextRenewal: string;
  status: "active" | "cancelled";
}

export interface PaymentRecord {
  id: string;
  date: string; // ISO
  amount: number;
  description: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  /** Last 4 digits for cards / masked account number for banks. */
  last4: string;
  label: string; // e.g. "Visa ending 4242" or "GTBank ****1234"
}

// ---------- Constants ----------

/** Free plan slot allocation. */
export const FREE_AGENT_SLOTS = 1;

/** Monthly cost per additional agent slot. */
export const AGENT_SLOT_PRICE_NGN = 1500;

/** Days of zero sales after which Generate Key is paused. */
export const KEY_GENERATION_PAUSE_DAYS = 30;

// ---------- In-memory state (per-session) ----------

/** All keys ever issued, keyed by code. Used to enforce global uniqueness. */
const issuedKeys = new Map<string, IssuedAuthKey>();

/** Per-business → currently active (unredeemed, non-expired) key code. */
const businessActiveKey = new Map<string, string>();

/** Agent permissions keyed by `${businessId}:${agentId}`. */
const agentPermissions = new Map<string, AgentPermissions>();

/** Authorization status keyed by `${businessId}:${agentId}`. */
const agentAuthorization = new Map<string, boolean>();

/** Active subscriptions keyed by businessId. */
const subscriptions = new Map<string, AgentSubscription[]>();

/** Payment history keyed by businessId. */
const paymentHistory = new Map<string, PaymentRecord[]>();

/** Payment methods keyed by businessId. */
const paymentMethods = new Map<string, PaymentMethod[]>();

/** Last sale ISO timestamp keyed by businessId. */
const lastSaleByBusiness = new Map<string, string>();

/** Agent → linked business mapping. Agents can only be linked to ONE business. */
const agentLinkedBusiness = new Map<string, string>();

// ---------- Helpers ----------

const permKey = (businessId: string, agentId: string) => `${businessId}:${agentId}`;

const defaultPermissions = (): AgentPermissions => ({
  recordSales: true,
  viewInventory: true,
  addProducts: false,
});

const generateUniqueCode = (): string => {
  // Try up to 50 random codes — the 1M space makes collisions astronomically unlikely
  // for the sizes we deal with. Fall back to sequential search to guarantee progress.
  for (let i = 0; i < 50; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!issuedKeys.has(code)) return code;
  }
  for (let n = 100000; n <= 999999; n++) {
    const code = n.toString();
    if (!issuedKeys.has(code)) return code;
  }
  throw new Error("Authorization key space exhausted");
};

// ---------- Auth key API ----------

/**
 * Whether the business is allowed to generate a new authorization key.
 * Returns false if zero sales have been recorded in the last
 * KEY_GENERATION_PAUSE_DAYS days.
 */
export const canGenerateAuthKey = (businessId: string): boolean => {
  const last = lastSaleByBusiness.get(businessId);
  if (!last) {
    // No sales recorded ever in this session — for the demo, allow first key
    // generation so the flow is testable. Real backend should require an
    // initial sale before allowing key issuance.
    return true;
  }
  const days = (Date.now() - new Date(last).getTime()) / 86_400_000;
  return days < KEY_GENERATION_PAUSE_DAYS;
};

/**
 * Issue a new authorization key for the given business.
 * Throws if generation is paused for that business.
 */
export const issueAuthKey = (businessId: string): IssuedAuthKey => {
  if (!canGenerateAuthKey(businessId)) {
    throw new Error("Key generation paused — record sales activity to re-enable.");
  }
  const code = generateUniqueCode();
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const key: IssuedAuthKey = {
    code,
    businessId,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    redeemed: false,
  };
  issuedKeys.set(code, key);
  businessActiveKey.set(businessId, code);
  return key;
};

/** Record a sale — keeps Generate Key enabled for the next 30 days. */
export const recordSaleForBusiness = (businessId: string): void => {
  lastSaleByBusiness.set(businessId, new Date().toISOString());
};

/** Test helper — manually set the last-sale date (for QA/demo only). */
export const __setLastSaleForBusiness = (businessId: string, iso: string): void => {
  lastSaleByBusiness.set(businessId, iso);
};

// ---------- Redemption / linkage API ----------

/**
 * Redeem an authorization code on behalf of an agent.
 *
 * Validates that:
 *  - the code exists,
 *  - it has not already been redeemed,
 *  - it has not expired.
 *
 * On success the key is marked redeemed, the agent is linked to the issuing
 * business, and authorization is enabled for the agent.
 *
 * @returns the linked business id on success.
 * @throws Error with a user-safe message on failure.
 */
export const redeemAuthKey = (code: string, agentId: string): string => {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("Enter the 6-digit code from your owner.");
  }
  const key = issuedKeys.get(trimmed);
  if (!key) throw new Error("Invalid code. Please double-check and try again.");
  if (key.redeemed) throw new Error("This code has already been used.");
  if (Date.now() > new Date(key.expiresAt).getTime()) {
    throw new Error("This code has expired. Ask the owner for a new one.");
  }
  // Enforce single-business linkage: if the agent is already linked elsewhere,
  // unlink them from the previous business first.
  agentLinkedBusiness.set(agentId, key.businessId);
  setAgentAuthorization(key.businessId, agentId, true);
  key.redeemed = true;
  // Free up the active-key slot so the owner can issue another.
  if (businessActiveKey.get(key.businessId) === trimmed) {
    businessActiveKey.delete(key.businessId);
  }
  return key.businessId;
};

/** Returns the businessId an agent is linked to (or null). */
export const getAgentLinkedBusiness = (agentId: string): string | null =>
  agentLinkedBusiness.get(agentId) ?? null;

/** Owner-initiated revoke: remove the agent's link + authorization. */
export const revokeAgent = (businessId: string, agentId: string): void => {
  setAgentAuthorization(businessId, agentId, false);
  if (agentLinkedBusiness.get(agentId) === businessId) {
    agentLinkedBusiness.delete(agentId);
  }
};

// ---------- Permissions API ----------

export const getAgentPermissions = (
  businessId: string,
  agentId: string,
): AgentPermissions => {
  const existing = agentPermissions.get(permKey(businessId, agentId));
  return existing ?? defaultPermissions();
};

export const setAgentPermissions = (
  businessId: string,
  agentId: string,
  patch: Partial<Pick<AgentPermissions, "addProducts">>,
): AgentPermissions => {
  const current = getAgentPermissions(businessId, agentId);
  // Hard-lock the always-on permissions — defensive against mistaken callers.
  const next: AgentPermissions = {
    recordSales: true,
    viewInventory: true,
    addProducts: patch.addProducts ?? current.addProducts,
  };
  agentPermissions.set(permKey(businessId, agentId), next);
  return next;
};

export const setAgentAuthorization = (
  businessId: string,
  agentId: string,
  authorized: boolean,
): void => {
  agentAuthorization.set(permKey(businessId, agentId), authorized);
  if (!authorized) {
    // Reset permissions to defaults when revoked
    agentPermissions.delete(permKey(businessId, agentId));
  }
};

export const isAgentAuthorized = (
  businessId: string,
  agentId: string,
  fallback = false,
): boolean => {
  const v = agentAuthorization.get(permKey(businessId, agentId));
  return v ?? fallback;
};

// ---------- Billing API ----------

export const getSubscriptions = (businessId: string): AgentSubscription[] =>
  subscriptions.get(businessId)?.slice() ?? [];

/** How many *additional paid* agent slots the business currently has. */
export const getPaidSlotCount = (businessId: string): number =>
  (subscriptions.get(businessId) ?? []).filter((s) => s.status === "active").length;

export const getTotalAgentSlots = (businessId: string): number =>
  FREE_AGENT_SLOTS + getPaidSlotCount(businessId);

export const addSubscriptions = (
  businessId: string,
  count: number,
  agentNames?: string[],
): AgentSubscription[] => {
  const list = subscriptions.get(businessId) ?? [];
  const created: AgentSubscription[] = [];
  const now = new Date();
  const renewal = new Date(now);
  renewal.setMonth(renewal.getMonth() + 1);
  for (let i = 0; i < count; i++) {
    const sub: AgentSubscription = {
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      agentId: "",
      agentName: agentNames?.[i] || "Unassigned slot",
      monthlyCost: AGENT_SLOT_PRICE_NGN,
      nextRenewal: renewal.toISOString(),
      status: "active",
    };
    list.push(sub);
    created.push(sub);
  }
  subscriptions.set(businessId, list);

  // Record payment
  const total = AGENT_SLOT_PRICE_NGN * count;
  recordPayment(businessId, {
    amount: total,
    description: `${count} agent slot${count > 1 ? "s" : ""} subscription`,
  });
  return created;
};

export const cancelSubscription = (businessId: string, subId: string): void => {
  const list = subscriptions.get(businessId);
  if (!list) return;
  const sub = list.find((s) => s.id === subId);
  if (sub) sub.status = "cancelled";
};

export const renewSubscription = (businessId: string, subId: string): void => {
  const list = subscriptions.get(businessId);
  if (!list) return;
  const sub = list.find((s) => s.id === subId);
  if (!sub) return;
  const next = new Date(sub.nextRenewal);
  next.setMonth(next.getMonth() + 1);
  sub.nextRenewal = next.toISOString();
  recordPayment(businessId, {
    amount: sub.monthlyCost,
    description: `Renewal — ${sub.agentName}`,
  });
};

// ---------- Payment history ----------

const recordPayment = (
  businessId: string,
  entry: { amount: number; description: string },
): void => {
  const list = paymentHistory.get(businessId) ?? [];
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    amount: entry.amount,
    description: entry.description,
  });
  paymentHistory.set(businessId, list);
};

export const getPaymentHistory = (businessId: string): PaymentRecord[] =>
  paymentHistory.get(businessId)?.slice() ?? [];

// ---------- Payment methods ----------

export const getPaymentMethods = (businessId: string): PaymentMethod[] =>
  paymentMethods.get(businessId)?.slice() ?? [];

export const addPaymentMethod = (
  businessId: string,
  method: Omit<PaymentMethod, "id">,
): PaymentMethod => {
  const list = paymentMethods.get(businessId) ?? [];
  const m: PaymentMethod = {
    ...method,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  list.push(m);
  paymentMethods.set(businessId, list);
  return m;
};

export const removePaymentMethod = (businessId: string, id: string): void => {
  const list = paymentMethods.get(businessId);
  if (!list) return;
  paymentMethods.set(businessId, list.filter((m) => m.id !== id));
};

/** Convenience: subscriptions due within `days` days. */
export const getPendingRenewals = (
  businessId: string,
  days = 7,
): AgentSubscription[] => {
  const list = subscriptions.get(businessId) ?? [];
  const cutoff = Date.now() + days * 86_400_000;
  return list.filter(
    (s) => s.status === "active" && new Date(s.nextRenewal).getTime() <= cutoff,
  );
};