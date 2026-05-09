import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRecordSaleCart, type RecordSaleCartItem } from "@/contexts/RecordSaleCartContext";

/**
 * Generic Change Items page used by owner, agent and distributor record-sale flows.
 *
 * Cart state is held in the shared `RecordSaleCartProvider` keyed by `cartKey`,
 * so it survives navigation between the Check Before Recording page and this page.
 *
 * Required `location.state`:
 *   { returnTo: string; cartKey: string }
 */
export type EditCartItem = RecordSaleCartItem;

interface LocationState {
  returnTo: string;
  cartKey: string;
}

/**
 * Backwards-compatible no-ops. Older call sites used a callback registry —
 * the shared context replaces that, but exports are kept so stale imports
 * don't break the build during the refactor.
 */
export const registerCartCommit = (_key: string, _commit: (next: EditCartItem[]) => void) => {};
export const unregisterCartCommit = (_key: string) => {};

const EditCartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as LocationState | null;
  const cartKey = state?.cartKey ?? "";
  const { items, setItems } = useRecordSaleCart(cartKey);
  const recentlyRemoved = useRef<EditCartItem | null>(null);

  useEffect(() => {
    if (!state || !state.cartKey || !state.returnTo) {
      // Direct visit without proper state — bounce back defensively.
      navigate(-1);
    }
  }, [state, navigate]);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  const updateQty = (productId: string, delta: number) => {
    setItems((prev: EditCartItem[]) => {
      const next: EditCartItem[] = [];
      for (const item of prev) {
        if (item.productId !== productId) {
          next.push(item);
          continue;
        }
        const newQty = item.qty + delta;
        if (newQty <= 0) {
          recentlyRemoved.current = item;
          toast(`${item.name} removed`, {
            action: {
              label: "Undo",
              onClick: () => {
                if (recentlyRemoved.current) {
                  setItems((c: EditCartItem[]) => [...c, recentlyRemoved.current!]);
                  recentlyRemoved.current = null;
                }
              },
            },
          });
        } else {
          next.push({ ...item, qty: newQty });
        }
      }
      return next;
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev: EditCartItem[]) => {
      const target = prev.find((i) => i.productId === productId);
      if (target) {
        recentlyRemoved.current = target;
        toast(`${target.name} removed`, {
          action: {
            label: "Undo",
            onClick: () => {
              if (recentlyRemoved.current) {
                setItems((c: EditCartItem[]) => [...c, recentlyRemoved.current!]);
                recentlyRemoved.current = null;
              }
            },
          },
        });
      }
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const handleDone = () => {
    if (state) {
      // State is already persisted in the shared context — just navigate back.
      navigate(state.returnTo, { replace: true, state: { fromEditCart: true } });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-4 pb-28">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-4"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-xl font-bold text-foreground mb-1">Change Items</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Adjust quantities or remove items
        </p>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₦{item.price.toLocaleString()} per {item.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-critical transition-colors p-1"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-2">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="p-2 text-muted-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-8 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      className="p-2 text-primary"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    ₦{(item.qty * item.price).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-primary/10 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary">
              ₦{total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed Done button */}
      <div className="absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-background border-t border-border">
        <button
          onClick={handleDone}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default EditCartPage;