## Goal
Rewrite every label, header, subtext, badge and button across the whole app using the plain-market-English vocabulary you listed. No accounting terms, no abbreviations, no tech jargon — written for an Aba market trader.

## Approach

This touches ~150 files. I'll do it in a single sweep, file-by-file, using targeted text replacements (not rewrites) so layout, logic, colors and component structure stay exactly as they are. Only string content changes.

## Pass 1 — Add Product / Restock (Owner + Distributor)
Files: `AddProductPage`, `RestockProductPage`, `RestockPage`, `DistributorAddProductPage`, `DistributorRestockProductPage`.
Replace COGS, margin, buying/selling unit, projected revenue, opening stock, etc. with your plain phrasings. Dynamically inject the buying unit name (carton/roll/bag) and selling unit name (piece/bottle/yard) into the labels where the field already knows them.

## Pass 2 — Business Health (Owner + Distributor)
Files: `HealthBreakdownPage`, `DistributorHealthBreakdownPage`, the health card on `OwnerHome` / `DistributorDashboard`.
"Your Assets / Liabilities / Stock Value / Cash In Hand / Cash In Promise / Net Profit" → your plain versions. Header becomes "How Your Business Is Doing".

## Pass 3 — Reports (Owner + Distributor)
Files: `ReportsPage`, `DistributorReportsPage`, `RevenueBreakdownPage`, `CostBreakdownPage`, `NetProfitBreakdownPage`, `DistributorRevenueBreakdownPage`, `DistributorCostBreakdownPage`, `DistributorNetProfitBreakdownPage`.
Revenue → Money Collected, Cost → Money Spent, Net Profit → Your Profit, Top Products → Best Selling Products, Tap for breakdown → See details.

## Pass 4 — Inventory (Owner + Distributor)
Files: `InventoryPage`, `DistributorInventoryPage`, `ProductDetailPage`, `DistributorProductDetailPage`.
Badges: Dead Stock → Not Moving, Critical → Almost Finished, Low Stock → Running Low, Healthy → Well Stocked, Top Selling → Selling Fast, Trending → Hot Right Now.

## Pass 5 — Sales / Cart
Files: `AgentRecordSale`, `RecordSalePage`, `OwnerRecordSalePage`, `DistributorRecordSalePage`, `ServiceRecordSalePage`, `CartPage`, `EditCartPage`, `CheckoutPage`.
Grand Total → Total Amount, Subtotal → Amount to Collect Now, Goodwill Amount → Amount to Pay Later, Collaborator → Who else helped with this sale, Confirm Sale → Record This Sale, Edit Cart → Change Items, Sale Preview → Check Before Recording.

## Pass 6 — Cash In Promise / Promise Tracker
Files: `PromiseTrackerPage`, `DistributorPromiseTrackerPage`.
Total Outstanding → Total Owed to You, Mark as Paid → They've Paid, Record Deposit → They Paid Part of It, Outstanding amount → Still owed, Settled → Fully Paid.

## Pass 7 — Agent Home + Stats
Files: `AgentHomePage`, `PerformancePage`, `TargetBreakdownPage`.
Today's Target → Your Target Today, Day Streak → Days in a Row, Recent Sales → Sales You Recorded Today, All Time Total → Total Since You Started, Today's Total → Total Collected Today, Set Target → Set Your Target, Challenge a Friend → Challenge Another Agent, Collaborated Sales → Sales You Helped With, Consistency Score → How often you hit your target.

## Pass 8 — Distributor Goodwill
Files: `DistributorGoodwillConditionsPage`, `DistributorGoodwillTrackerPage`, the goodwill section on `DistributorReportsPage`, "Goodwill" badges on product cards.
Use your phrasings: "Allow buyers to pay after selling", "Buyer must have used Bulkbook for at least X months", "Buyer must sell at least ₦X every month", "Smallest order that qualifies", "How long they have to pay you back". Tracker: "How much has been sold", "Pay back by", "Sold so far", "Still with them", "Paying on time", "Pay back soon", "Late — follow up". Badge "Goodwill" → "Pay after selling".

## Pass 9 — Settings (all 3 account types)
Files: `OwnerSettingsPage`, `AgentSettingsPage`, `DistributorSettingsPage`, plus the destination pages for header titles: `BusinessProfilePage`, `PrivacySecurityPage`, `AboutBulkbookPage`, `OwnerNotificationsPage`, `BillingPage`, `PartnersPage` and their distributor twins.
Business Profile → Your Business Details, Privacy & Security → Password and Security, About Bulkbook → About This App, Notifications → Alerts and Notifications, Billing → Payments and Plans, Partners → Business Partners.

## Pass 10 — General sweep
Search the whole `src/pages` and `src/components` tree for any remaining instances of: COGS, Margin, Revenue, Net Profit, Cost of Goods, Outstanding, Subtotal, Grand Total, Liabilities, Assets, Restock (where it's a heading not a button), Dead Stock, Goodwill, etc., and replace any I missed using the same vocabulary rules.

## What stays the same
- All component structure, routing, state, calculations, colors and icons.
- The word "Restock" on action buttons (you said keep it).
- "Record a Sale" button label (you said keep it).
- "AI Summary" → "Summary" (confirm everywhere).
- Brand name "Bulkbook" only changes in the specific phrases you listed ("About Bulkbook" → "About This App"); the logo and brand mentions elsewhere stay.

## Out of scope
- No backend/data model changes. Field names in mock data and contexts stay as-is; only user-visible strings change.
- No new features, no layout changes, no new components.

## Verification
After the sweep I'll grep the codebase for the old terms (COGS, Margin, Revenue, Net Profit, Liabilities, Subtotal, Grand Total, Outstanding, Dead Stock, Goodwill badge, etc.) to confirm nothing user-facing slipped through, and check the build is clean.
