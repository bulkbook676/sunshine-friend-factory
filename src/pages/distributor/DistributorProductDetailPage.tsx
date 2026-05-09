import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Package, Truck, Handshake, Check, X } from "lucide-react";
import { useDistributor } from "@/contexts/DistributorContext";
import DistributorBottomNav from "@/components/DistributorBottomNav";

const DistributorProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products } = useDistributor();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="app-shell dark bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const margin = product.sellingPrice - product.costPrice;
  const marginPct = product.costPrice > 0 ? (margin / product.costPrice) * 100 : 0;

  return (
    <div className="app-shell dark bg-background">
      <div className="page-content px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => navigate(`/distributor/inventory/edit/${product.id}`)}
            className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"
          >
            <Edit className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
        </div>

        {/* Stock */}
        <div className="bg-card rounded-lg p-5 border border-border mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
          <p className="text-5xl font-bold text-foreground">{product.currentStock.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">units</p>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground">Cost Price</p>
            <p className="text-lg font-bold text-foreground mt-1">₦{product.costPrice.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground">Selling Price</p>
            <p className="text-lg font-bold text-primary mt-1">₦{product.sellingPrice.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Profit per piece</span>
            <span className="text-foreground font-medium">
              ₦{margin.toLocaleString()} ({marginPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Free shipping */}
        <div className="bg-card rounded-lg p-4 border border-border mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold text-foreground">Free Shipping</span>
          </div>
          {product.freeShippingThreshold ? (
            <p className="text-sm text-success">
              On orders above ₦{product.freeShippingThreshold.toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not configured</p>
          )}
        </div>

        {/* Goodwill */}
        <div className="bg-card rounded-lg p-4 border border-border mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Handshake className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold text-foreground">Buy Now Pay Later</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                product.goodwillEnabled
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {product.goodwillEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          {product.goodwillEnabled && product.goodwillConditions && (
            <div className="space-y-1.5 mt-3">
              <p className="text-xs text-muted-foreground">
                How long they have to pay you back:{" "}
                <span className="text-foreground font-medium">
                  {product.goodwillConditions.repaymentDays} days
                </span>
              </p>
              {product.goodwillConditions.minMonthsOnBulkbook != null && (
                <p className="text-xs text-muted-foreground">
                  Min months on Bulkbook:{" "}
                  <span className="text-foreground font-medium">
                    {product.goodwillConditions.minMonthsOnBulkbook}
                  </span>
                </p>
              )}
              {product.goodwillConditions.minMonthlySales != null && (
                <p className="text-xs text-muted-foreground">
                  Min monthly sales:{" "}
                  <span className="text-foreground font-medium">
                    ₦{product.goodwillConditions.minMonthlySales.toLocaleString()}
                  </span>
                </p>
              )}
              {product.goodwillConditions.minOrderValue != null && (
                <p className="text-xs text-muted-foreground">
                  Min order value:{" "}
                  <span className="text-foreground font-medium">
                    {product.goodwillConditions.minOrderValue.toLocaleString()}
                  </span>
                </p>
              )}
              {product.goodwillConditions.customCondition && (
                <p className="text-xs text-muted-foreground">
                  Other:{" "}
                  <span className="text-foreground font-medium">
                    {product.goodwillConditions.customCondition}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="bg-card rounded-lg p-4 border border-border mb-6">
          <p className="text-sm font-semibold text-foreground mb-2">Payment Methods Accepted</p>
          <div className="flex flex-wrap gap-2">
            {product.paymentMethods.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium"
              >
                <Check className="w-3 h-3" />
                {m}
              </span>
            ))}
            {product.paymentMethods.length === 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <X className="w-3 h-3" />
                None configured
              </span>
            )}
          </div>
        </div>
      </div>
      <DistributorBottomNav />
    </div>
  );
};

export default DistributorProductDetailPage;
