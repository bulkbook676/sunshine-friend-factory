import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Search, Plus, Minus, X, ShoppingCart, Check, Layers, ScanLine } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { products } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import AgentBottomNav from "@/components/AgentBottomNav";
import SalesScannerCamera, { type ScannedSaleItem } from "@/components/SalesScannerCamera";
import { toast } from "@/hooks/use-toast";
import { registerCartCommit, unregisterCartCommit, type EditCartItem } from "@/pages/EditCartPage";

interface CartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
}

interface ProductGroup {
  id: string;
  name: string;
  productIds: string[];
  useCount: number;
}

const RecordSalePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthorized, businessName } = useAuth();
  const [tab, setTab] = useState<"search" | "camera">("search");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [qty, setQty] = useState("1");
  const [showPreview, setShowPreview] = useState(false);
  const [collaborators, setCollaborators] = useState<{ id: string; name: string }[]>([]);
  const [collabQuery, setCollabQuery] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [groups, setGroups] = useState<ProductGroup[]>([
    { id: "1", name: "Provision", productIds: ["1", "2", "3"], useCount: 12 },
    { id: "2", name: "Drinks", productIds: ["4", "5"], useCount: 8 },
    { id: "3", name: "Fruit", productIds: ["1"], useCount: 5 },
  ]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [selectedGroupProducts, setSelectedGroupProducts] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = "agent-record-sale";
    registerCartCommit(key, (next: EditCartItem[]) => setCart(next));
    return () => unregisterCartCommit(key);
  }, []);

  useEffect(() => {
    const fromEdit = (location.state as { fromEditCart?: boolean } | null)?.fromEditCart;
    if (fromEdit) setShowPreview(true);
  }, [location.state]);

  // Mock agents for collaborator suggestions
  const linkedAgents = [
    { id: "u1", name: "Blessing Okoro" },
    { id: "u2", name: "Emeka Uche" },
    { id: "u3", name: "Funmi Adeyemi" },
    { id: "u4", name: "Chinedu Eze" },
    { id: "u5", name: "Ada Obi" },
  ];

  const collabSuggestions = collabQuery.length > 0
    ? linkedAgents.filter(
        (a) =>
          a.name.toLowerCase().includes(collabQuery.toLowerCase()) &&
          !collaborators.find((c) => c.id === a.id)
      )
    : [];

  const filtered = query.length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const sortedGroups = [...groups].sort((a, b) => b.useCount - a.useCount);

  const activeGroupProducts = activeGroupId
    ? products.filter((p) => groups.find((g) => g.id === activeGroupId)?.productIds.includes(p.id))
    : [];

  useEffect(() => {
    if (tab === "search" && searchRef.current) {
      searchRef.current.focus();
    }
  }, [tab]);

  const mergeScanned = (item: ScannedSaleItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.productId);
      if (existing) {
        return prev.map((c) =>
          c.productId === item.productId ? { ...c, qty: c.qty + item.qty } : c
        );
      }
      return [...prev, item];
    });
  };

  const handleScannerContinue = (item: ScannedSaleItem) => {
    mergeScanned(item);
  };

  const handleScannerCheckout = (item: ScannedSaleItem) => {
    mergeScanned(item);
    setCameraOpen(false);
    setTimeout(() => setShowPreview(true), 0);
  };

  const addToCart = (product: typeof products[0], quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, qty: c.qty + quantity } : c
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty: quantity,
        price: product.sellingPrice,
        unit: product.sellingUnit,
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const handleSearchAdd = () => {
    if (!selectedProduct || !qty || parseInt(qty) < 1) return;
    addToCart(selectedProduct, parseInt(qty));
    setSelectedProduct(null);
    setQty("1");
    setQuery("");
    searchRef.current?.focus();
  };

  const addCollaborator = (agent: { id: string; name: string }) => {
    setCollaborators((prev) => [...prev, agent]);
    setCollabQuery("");
  };

  const removeCollaborator = (id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveGroup = () => {
    if (!newGroupName.trim()) return;
    if (editingGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroup.id
            ? { ...g, name: newGroupName, productIds: selectedGroupProducts }
            : g
        )
      );
    } else {
      setGroups((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newGroupName, productIds: selectedGroupProducts, useCount: 0 },
      ]);
    }
    setNewGroupName("");
    setSelectedGroupProducts([]);
    setEditingGroup(null);
  };

  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      navigate("/agent");
    }, 1800);
  };

  // Manage Groups Screen
  if (showManageGroups) {
    return (
      <div className="app-shell bg-background">
        <div className="page-content px-4 pt-4">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => { setShowManageGroups(false); setEditingGroup(null); setNewGroupName(""); setSelectedGroupProducts([]); }} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Manage Groups</h1>
          </div>

          {/* Create / Edit group */}
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {editingGroup ? "Edit Group" : "Create New Group"}
            </h3>
            <input
              type="text"
              placeholder="Group name (e.g. Provision)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mb-3"
            />
            <p className="text-xs text-muted-foreground mb-2">Select products for this group:</p>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedGroupProducts((prev) =>
                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                    );
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    selectedGroupProducts.includes(p.id)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{p.name}</span>
                  {selectedGroupProducts.includes(p.id) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveGroup}
              disabled={!newGroupName.trim()}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
            >
              {editingGroup ? "Save Changes" : "Create Group"}
            </button>
          </div>

          {/* Existing groups */}
          <h3 className="text-sm font-semibold text-foreground mb-3">Your Groups</h3>
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.productIds.length} products</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingGroup(g);
                      setNewGroupName(g.name);
                      setSelectedGroupProducts(g.productIds);
                    }}
                    className="text-xs text-primary font-medium"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteGroup(g.id)} className="text-xs text-destructive font-medium">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <AgentBottomNav />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="app-shell bg-background flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Sale Recorded!</h2>
          <p className="text-sm text-muted-foreground">{cart.length} items · ₦{grandTotal.toLocaleString()}</p>
          {collaborators.length > 0 && (
            <p className="text-xs text-primary mt-1">Collaborators: {collaborators.map((c) => c.name).join(", ")}</p>
          )}
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="app-shell bg-background">
        <div className="page-content px-4 pt-4">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-1 text-muted-foreground mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Edit Cart</span>
          </button>
          <h1 className="text-xl font-bold text-foreground mb-1">Sale Preview</h1>
          <p className="text-sm text-muted-foreground mb-6">Review before confirming</p>
          <div className="space-y-3 mb-6">
            {cart.map((item) => (
              <div key={item.productId} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm font-bold text-primary">₦{(item.qty * item.price).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.qty} {item.unit}{item.qty > 1 ? "s" : ""} × ₦{item.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-primary/10 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Grand Total</span>
              <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Collaborators */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">Collaborators</label>

            {/* Collaborator tags */}
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium">
                    <span>{c.name}</span>
                    <button onClick={() => removeCollaborator(c.id)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search agent name…"
                value={collabQuery}
                onChange={(e) => setCollabQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              {collabSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl mt-1 overflow-hidden z-10">
                  {collabSuggestions.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => addCollaborator(a)}
                      className="w-full px-4 py-3 text-sm text-foreground text-left hover:bg-muted/50 border-b border-border last:border-0"
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/agent/edit-cart", { state: { cart, returnTo: "/agent/record-sale", cartKey: "agent-record-sale" } })}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground"
            >
              Edit
            </button>
            <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              Confirm Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell bg-background">
      <div className="page-content px-4 pt-4" style={{ paddingBottom: cart.length > 0 ? 220 : 80 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Record a Sale</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowManageGroups(true)} className="text-muted-foreground">
              <Layers className="w-5 h-5" />
            </button>
            {cart.length > 0 && (
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {cart.length}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex bg-muted rounded-xl p-1 mb-5">
          <button
            onClick={() => setTab("camera")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "camera" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => setTab("search")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "search" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {tab === "camera" && (
          <div className="mb-4">
            <button
              onClick={() => setCameraOpen(true)}
              className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-1">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Open scanner</span>
              <span className="text-xs text-muted-foreground">Auto-detects products from your inventory</span>
            </button>
          </div>
        )}

        <SalesScannerCamera
          open={cameraOpen}
          inventory={products}
          cartCount={cart.length}
          onAddAndContinue={handleScannerContinue}
          onAddAndCheckout={handleScannerCheckout}
          onClose={() => setCameraOpen(false)}
        />

        {tab === "search" && (
          <div className="mb-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search product name..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedProduct(null); setActiveGroupId(null); }}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Group pills */}
            {sortedGroups.length > 0 && !query && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                {sortedGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroupId(activeGroupId === g.id ? null : g.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                      activeGroupId === g.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* Group products */}
            {activeGroupId && activeGroupProducts.length > 0 && !query && (
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-3 max-h-48 overflow-y-auto">
                {activeGroupProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setQuery(p.name); setActiveGroupId(null); }}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-0 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.currentStock} in stock</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">₦{p.sellingPrice.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}

            {query && !selectedProduct && filtered.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-3 max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setQuery(p.name); }}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-0 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.currentStock} in stock</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">₦{p.sellingPrice.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}

            {query && !selectedProduct && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
            )}

            {selectedProduct && (
              <div className="bg-card rounded-2xl p-4 border border-border mb-3 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedProduct.name}</p>
                    <p className="text-xs text-muted-foreground">₦{selectedProduct.sellingPrice.toLocaleString()} per {selectedProduct.sellingUnit}</p>
                  </div>
                  <button onClick={() => { setSelectedProduct(null); setQuery(""); }} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Quantity ({selectedProduct.sellingUnit}s)</label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      min="1"
                      className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm font-bold text-foreground mt-1"
                      onKeyDown={(e) => e.key === "Enter" && handleSearchAdd()}
                    />
                  </div>
                  <button onClick={handleSearchAdd} className="px-6 py-2.5 mt-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                    Add
                  </button>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium animate-scale-in">
                    <span>{item.name} × {item.qty}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="absolute bottom-16 left-0 right-0 bg-card border-t border-border px-4 py-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">{cart.length} item{cart.length > 1 ? "s" : ""} in cart</span>
            <span className="text-lg font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
          </div>
          <button onClick={() => setShowPreview(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Preview & Submit
          </button>
        </div>
      )}

      <AgentBottomNav />
    </div>
  );
};

export default RecordSalePage;
