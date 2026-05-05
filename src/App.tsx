import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ExpensesProvider } from "@/contexts/ExpensesContext";
import { ServiceProvider } from "@/contexts/ServiceContext";
import { SalesProvider } from "@/contexts/SalesContext";
import { CartProvider } from "@/contexts/CartContext";
import { DistributorProvider } from "@/contexts/DistributorContext";
import { RecordSaleCartProvider } from "@/contexts/RecordSaleCartContext";

// Auth pages
import LandingPage from "./pages/LandingPage";
import OwnerSignupPage from "./pages/OwnerSignupPage";
import AgentSignupPage from "./pages/AgentSignupPage";
import DistributorSignupPage from "./pages/DistributorSignupPage";
import LoginPage from "./pages/LoginPage";

// Owner pages
import HealthBreakdownPage from "./pages/owner/HealthBreakdownPage";
import WhatYouHavePage from "./pages/owner/WhatYouHavePage";
import WhatYouSpentPage from "./pages/owner/WhatYouSpentPage";
import InventoryPage from "./pages/owner/InventoryPage";
import ProductDetailPage from "./pages/owner/ProductDetailPage";
import AddProductPage from "./pages/owner/AddProductPage";
import AgentsPage from "./pages/owner/AgentsPage";
import AgentDetailPage from "./pages/owner/AgentDetailPage";
import ReportsPage from "./pages/owner/ReportsPage";
import RevenueBreakdownPage from "./pages/owner/RevenueBreakdownPage";
import CostBreakdownPage from "./pages/owner/CostBreakdownPage";
import NetProfitBreakdownPage from "./pages/owner/NetProfitBreakdownPage";
import RestockPage from "./pages/owner/RestockPage";
import RestockProductPage from "./pages/owner/RestockProductPage";
import DistributorPage from "./pages/owner/DistributorPage";
import DistributorProfilePage from "./pages/owner/DistributorProfilePage";
import OwnerNotificationsPage from "./pages/owner/OwnerNotificationsPage";
import OwnerSettingsPage from "./pages/owner/OwnerSettingsPage";
import LogExpensePage from "./pages/owner/LogExpensePage";
import ExpensesHistoryPage from "./pages/owner/ExpensesHistoryPage";
import ServicesChipsPage from "./pages/owner/ServicesChipsPage";
import AddServicePage from "./pages/owner/AddServicePage";
import OwnerRecordSalePage from "./pages/owner/OwnerRecordSalePage";
import PromiseTrackerPage from "./pages/owner/PromiseTrackerPage";
import CartPage from "./pages/owner/CartPage";
import CheckoutPage from "./pages/owner/CheckoutPage";
import GoodwillDistributorsPage from "./pages/owner/GoodwillDistributorsPage";
import OwnerOrdersPage from "./pages/owner/OwnerOrdersPage";
import OwnerOrderDetailPage from "./pages/owner/OwnerOrderDetailPage";
import EditCartPage from "./pages/EditCartPage";
import BillingPage from "./pages/owner/BillingPage";
import UnlockAgentsPage from "./pages/owner/UnlockAgentsPage";
import PartnersPage from "./pages/owner/PartnersPage";
import BusinessProfilePage from "./pages/owner/BusinessProfilePage";
import AccountSettingsPage from "./pages/owner/AccountSettingsPage";
import NotificationsSettingsPage from "./pages/owner/NotificationsSettingsPage";
import PrivacySecurityPage from "./pages/owner/PrivacySecurityPage";
import AboutBulkbookPage from "./pages/owner/AboutBulkbookPage";

// Agent pages
import AgentHomePage from "./pages/agent/AgentHomePage";
import RecordSalePage from "./pages/agent/RecordSalePage";
import ServiceRecordSalePage from "./pages/agent/ServiceRecordSalePage";
import StockCountPage from "./pages/agent/StockCountPage";
import PerformancePage from "./pages/agent/PerformancePage";
import RecommendationsPage from "./pages/agent/RecommendationsPage";
import AgentSettingsPage from "./pages/agent/AgentSettingsPage";
import ChangePinPage from "./pages/agent/ChangePinPage";
import TargetBreakdownPage from "./pages/agent/TargetBreakdownPage";
import AgentLogExpensePage from "./pages/agent/LogExpensePage";

// Distributor pages
import DistributorDashboard from "./pages/distributor/DistributorDashboard";
import DistributorInventoryPage from "./pages/distributor/DistributorInventoryPage";
import DistributorAddProductPage from "./pages/distributor/DistributorAddProductPage";
import DistributorRestockProductPage from "./pages/distributor/DistributorRestockProductPage";
import DistributorProductDetailPage from "./pages/distributor/DistributorProductDetailPage";
import DistributorGoodwillConditionsPage from "./pages/distributor/DistributorGoodwillConditionsPage";
import DistributorHealthBreakdownPage from "./pages/distributor/DistributorHealthBreakdownPage";
import DistributorOrdersPage from "./pages/distributor/DistributorOrdersPage";
import DistributorOrderDetailPage from "./pages/distributor/DistributorOrderDetailPage";
import DistributorReportsPage from "./pages/distributor/DistributorReportsPage";
import DistributorNotificationsPage from "./pages/distributor/DistributorNotificationsPage";
import DistributorSettingsPage from "./pages/distributor/DistributorSettingsPage";
import DistributorProfileSelfPage from "./pages/distributor/DistributorProfileSelfPage";
import DistributorPromiseTrackerPage from "./pages/distributor/DistributorPromiseTrackerPage";
import DistributorAgentsPage from "./pages/distributor/DistributorAgentsPage";
import DistributorAgentDetailPage from "./pages/distributor/DistributorAgentDetailPage";
import DistributorRecordSalePage from "./pages/distributor/DistributorRecordSalePage";
import DistributorLogExpensePage from "./pages/distributor/DistributorLogExpensePage";
import DistributorExpensesHistoryPage from "./pages/distributor/DistributorExpensesHistoryPage";
import DistributorRevenueBreakdownPage from "./pages/distributor/DistributorRevenueBreakdownPage";
import DistributorCostBreakdownPage from "./pages/distributor/DistributorCostBreakdownPage";
import DistributorNetProfitBreakdownPage from "./pages/distributor/DistributorNetProfitBreakdownPage";
import DistributorAccountSettingsPage from "./pages/distributor/DistributorAccountSettingsPage";
import DistributorNotificationsSettingsPage from "./pages/distributor/DistributorNotificationsSettingsPage";
import DistributorPartnersPage from "./pages/distributor/DistributorPartnersPage";
import DistributorBillingPage from "./pages/distributor/DistributorBillingPage";
import DistributorPrivacySecurityPage from "./pages/distributor/DistributorPrivacySecurityPage";
import DistributorAboutPage from "./pages/distributor/DistributorAboutPage";

// Shared pages
import FeedPage from "./pages/shared/FeedPage";
import OwnerProfilePage from "./pages/shared/OwnerProfilePage";
import StockAuditPage from "./pages/shared/StockAuditPage";
import OwnerBottomNav from "./components/OwnerBottomNav";
import AgentBottomNav from "./components/AgentBottomNav";
import DistributorBottomNav from "./components/DistributorBottomNav";

// Smart router components
import OwnerHome from "./pages/owner/OwnerHome";
import AgentRecordSale from "./pages/agent/AgentRecordSale";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ExpensesProvider>
          <ServiceProvider>
            <SalesProvider>
              <DistributorProvider>
                <CartProvider>
                  <RecordSaleCartProvider>
                    <BrowserRouter>
                      <Routes>
                      {/* Auth */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/signup/owner" element={<OwnerSignupPage />} />
                      <Route path="/signup/agent" element={<AgentSignupPage />} />
                      <Route path="/signup/distributor" element={<DistributorSignupPage />} />
                      <Route path="/login" element={<LoginPage />} />

                      {/* Owner */}
                      <Route path="/owner" element={<OwnerHome />} />
                      <Route path="/owner/health" element={<HealthBreakdownPage />} />
                     <Route path="/owner/health/what-you-have" element={<WhatYouHavePage />} />
                     <Route path="/owner/health/what-you-spent" element={<WhatYouSpentPage />} />
                      <Route path="/owner/inventory" element={<InventoryPage />} />
                      <Route path="/owner/product/:id" element={<ProductDetailPage />} />
                      <Route path="/owner/product/add" element={<AddProductPage />} />
                      <Route path="/owner/product/edit/:id" element={<AddProductPage />} />
                      <Route path="/owner/services" element={<ServicesChipsPage />} />
                      <Route path="/owner/service/add" element={<AddServicePage />} />
                      <Route path="/owner/agents" element={<AgentsPage />} />
                      <Route path="/owner/agent/:id" element={<AgentDetailPage />} />
                      <Route path="/owner/reports" element={<ReportsPage />} />
                      <Route path="/owner/reports/revenue" element={<RevenueBreakdownPage />} />
                      <Route path="/owner/reports/cost" element={<CostBreakdownPage />} />
                      <Route path="/owner/reports/profit" element={<NetProfitBreakdownPage />} />
                      <Route path="/owner/restock" element={<RestockPage />} />
                      <Route path="/owner/restock/:id" element={<RestockProductPage />} />
                      <Route path="/owner/distributor" element={<DistributorPage />} />
                      <Route path="/owner/distributor/:id" element={<DistributorProfilePage />} />
                      <Route path="/owner/cart" element={<CartPage />} />
                      <Route path="/owner/checkout" element={<CheckoutPage />} />
                      <Route path="/owner/goodwill-distributors" element={<GoodwillDistributorsPage />} />
                      <Route path="/owner/orders" element={<OwnerOrdersPage />} />
                      <Route path="/owner/order/:id" element={<OwnerOrderDetailPage />} />
                      <Route path="/owner/notifications" element={<OwnerNotificationsPage />} />
                      <Route path="/owner/settings" element={<OwnerSettingsPage />} />
                      <Route path="/owner/expenses" element={<ExpensesHistoryPage />} />
                      <Route path="/owner/expenses/log" element={<LogExpensePage />} />
                      <Route path="/owner/record-sale" element={<OwnerRecordSalePage />} />
                      <Route path="/owner/promises" element={<PromiseTrackerPage />} />
                      <Route path="/owner/feed" element={<FeedPage variant="owner" BottomNav={OwnerBottomNav} />} />
                      <Route path="/owner/edit-cart" element={<EditCartPage />} />
                      <Route path="/owner/billing" element={<BillingPage />} />
                      <Route path="/owner/billing/unlock-agents" element={<UnlockAgentsPage />} />
                      <Route path="/owner/settings/business-profile" element={<BusinessProfilePage />} />
                      <Route path="/owner/settings/account" element={<AccountSettingsPage />} />
                      <Route path="/owner/settings/notifications" element={<NotificationsSettingsPage />} />
                      <Route path="/owner/settings/privacy" element={<PrivacySecurityPage />} />
                      <Route path="/owner/settings/partners" element={<PartnersPage />} />
                      <Route path="/owner/settings/about" element={<AboutBulkbookPage />} />
                      <Route path="/owner/stock-audit" element={<StockAuditPage variant="owner" />} />

                      {/* Agent */}
                      <Route path="/agent" element={<AgentHomePage />} />
                      <Route path="/agent/record-sale" element={<AgentRecordSale />} />
                      <Route path="/agent/stock-count" element={<StockCountPage />} />
                      <Route path="/agent/performance" element={<PerformancePage />} />
                      <Route path="/agent/recommendations" element={<RecommendationsPage />} />
                      <Route path="/agent/settings" element={<AgentSettingsPage />} />
                      <Route path="/agent/settings/change-pin" element={<ChangePinPage />} />
                      <Route path="/agent/target-breakdown" element={<TargetBreakdownPage />} />
                      <Route path="/agent/log-expense" element={<AgentLogExpensePage />} />
                      <Route path="/agent/feed" element={<FeedPage variant="agent" BottomNav={AgentBottomNav} />} />
                      <Route path="/agent/edit-cart" element={<EditCartPage />} />

                      {/* Distributor */}
                      <Route path="/distributor" element={<DistributorDashboard />} />
                      <Route path="/distributor/health" element={<DistributorHealthBreakdownPage />} />
                      <Route path="/distributor/inventory" element={<DistributorInventoryPage />} />
                      <Route path="/distributor/inventory/add" element={<DistributorAddProductPage />} />
                      <Route path="/distributor/inventory/edit/:id" element={<DistributorAddProductPage />} />
                      <Route path="/distributor/restock/:id" element={<DistributorRestockProductPage />} />
                      <Route path="/distributor/inventory/goodwill-conditions" element={<DistributorGoodwillConditionsPage />} />
                      <Route path="/distributor/inventory/:id" element={<DistributorProductDetailPage />} />
                      <Route path="/distributor/orders" element={<DistributorOrdersPage />} />
                      <Route path="/distributor/order/:id" element={<DistributorOrderDetailPage />} />
                      <Route path="/distributor/reports" element={<DistributorReportsPage />} />
                      <Route path="/distributor/notifications" element={<DistributorNotificationsPage />} />
                      <Route path="/distributor/settings" element={<DistributorSettingsPage />} />
                      <Route path="/distributor/profile" element={<DistributorProfileSelfPage />} />
                      <Route path="/distributor/owner/:id" element={<OwnerProfilePage />} />
                      <Route path="/distributor/feed" element={<FeedPage variant="owner" BottomNav={DistributorBottomNav} />} />
                      <Route path="/distributor/promises" element={<DistributorPromiseTrackerPage />} />
                      <Route path="/distributor/record-sale" element={<DistributorRecordSalePage />} />
                      <Route path="/distributor/expenses" element={<DistributorExpensesHistoryPage />} />
                      <Route path="/distributor/expenses/log" element={<DistributorLogExpensePage />} />
                      <Route path="/distributor/reports/revenue" element={<DistributorRevenueBreakdownPage />} />
                      <Route path="/distributor/reports/cost" element={<DistributorCostBreakdownPage />} />
                      <Route path="/distributor/reports/profit" element={<DistributorNetProfitBreakdownPage />} />
                      <Route path="/distributor/settings/account" element={<DistributorAccountSettingsPage />} />
                      <Route path="/distributor/settings/notifications" element={<DistributorNotificationsSettingsPage />} />
                      <Route path="/distributor/settings/partners" element={<DistributorPartnersPage />} />
                      <Route path="/distributor/settings/billing" element={<DistributorBillingPage />} />
                      <Route path="/distributor/settings/privacy" element={<DistributorPrivacySecurityPage />} />
                      <Route path="/distributor/settings/about" element={<DistributorAboutPage />} />
                      <Route path="/distributor/stock-audit" element={<StockAuditPage variant="distributor" />} />
                     <Route path="/distributor/agents" element={<DistributorAgentsPage />} />
                      <Route path="/distributor/agent/:id" element={<DistributorAgentDetailPage />} />
                      <Route path="/distributor/edit-cart" element={<EditCartPage />} />

                      <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </RecordSaleCartProvider>
                </CartProvider>
              </DistributorProvider>
            </SalesProvider>
          </ServiceProvider>
        </ExpensesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
