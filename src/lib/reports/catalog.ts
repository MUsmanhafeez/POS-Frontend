import {
  BarChart3,
  Boxes,
  CreditCard,
  FileText,
  Package,
  Receipt,
  Store,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type ReportCategory = 'restaurant-sales' | 'pos' | 'inventory' | 'system';

export type ReportDef = {
  slug: string;
  title: string;
  description: string;
  category: ReportCategory;
  icon: LucideIcon;
};

export const REPORT_CATEGORIES: Array<{ id: ReportCategory; title: string }> = [
  { id: 'restaurant-sales', title: 'Restaurant Sales Reports' },
  { id: 'pos', title: 'POS Reports' },
  { id: 'inventory', title: 'Inventory Reports' },
  { id: 'system', title: 'System Reports' },
];

export const REPORT_CATALOG: ReportDef[] = [
  { slug: 'sales-report', title: 'Sales Report', description: 'Detailed breakdown of sales performance for the selected period.', category: 'restaurant-sales', icon: BarChart3 },
  { slug: 'restaurant-sales-summary', title: 'Restaurant Sales Summary', description: 'Summary with sales analysis, payment types, and tax bifurcation.', category: 'restaurant-sales', icon: TrendingUp },
  { slug: 'upcoming-orders', title: 'Upcoming Orders Report', description: 'Scheduled and pre-orders due in the selected window.', category: 'restaurant-sales', icon: Receipt },
  { slug: 'products-purchase', title: 'Products Purchase Report', description: 'Product procurement and purchase history analysis.', category: 'restaurant-sales', icon: Package },
  { slug: 'sales-by-creator', title: 'Sales By Creator', description: 'Sales grouped by the user who created each order.', category: 'restaurant-sales', icon: Users },
  { slug: 'sales-by-cashier', title: 'Sales By Cashier', description: 'Individual cashier performance and totals.', category: 'restaurant-sales', icon: Users },
  { slug: 'tax-report', title: 'Tax Report', description: 'Summarized tax collected across orders.', category: 'restaurant-sales', icon: FileText },
  { slug: 'product-tax-report', title: 'Product Tax Report', description: 'Tax breakdown by product line.', category: 'restaurant-sales', icon: FileText },
  { slug: 'branch-performance', title: 'Branch Performance Report', description: 'Compare key metrics across branches.', category: 'restaurant-sales', icon: Store },
  { slug: 'payments-report', title: 'Payments Report', description: 'Breakdown of received payments by method.', category: 'restaurant-sales', icon: CreditCard },
  { slug: 'invoice-report', title: 'Invoice Report', description: 'Invoice listing with amounts and status.', category: 'restaurant-sales', icon: Receipt },
  { slug: 'date-wise-sales', title: 'Date Wise Sales Analysis', description: 'Daily sales totals and order counts.', category: 'restaurant-sales', icon: BarChart3 },
  { slug: 'hourly-sales', title: 'Hourly Sales Report', description: 'Sales summary grouped by hour.', category: 'restaurant-sales', icon: BarChart3 },
  { slug: 'table-report', title: 'Table Report', description: 'Table usage, turns, and dine-in revenue.', category: 'restaurant-sales', icon: Store },
  { slug: 'cancellation-report', title: 'Cancellation Report', description: 'Voided and cancelled orders with reasons.', category: 'restaurant-sales', icon: FileText },
  { slug: 'home-delivery-cancellation', title: 'Home Delivery Cancellation', description: 'Cancelled home delivery orders only.', category: 'restaurant-sales', icon: FileText },
  { slug: 'item-wise-movement', title: 'Item Wise Movement', description: 'Quantity movement for menu items.', category: 'restaurant-sales', icon: Package },
  { slug: 'item-wise-consolidated-sales', title: 'Item Wise Consolidated Sales', description: 'Best sellers and revenue by item.', category: 'restaurant-sales', icon: BarChart3 },
  { slug: 'item-wise-return', title: 'Item Wise Return', description: 'Returned items and refund quantities.', category: 'restaurant-sales', icon: Package },
  { slug: 'food-panda-report', title: 'Food Panda Report', description: 'Orders synced from Food Panda aggregator.', category: 'restaurant-sales', icon: Receipt },
  { slug: 'golootlo-report', title: 'Golootlo Report', description: 'Orders synced from Golootlo aggregator.', category: 'restaurant-sales', icon: Receipt },
  { slug: 'discount-analysis', title: 'Discount Analysis', description: 'Discount usage and impact on revenue.', category: 'restaurant-sales', icon: TrendingUp },
  { slug: 'cost-revenue-by-order', title: 'Cost & Revenue by Order', description: 'Margin estimate per order (stub cost model).', category: 'restaurant-sales', icon: BarChart3 },
  { slug: 'cost-revenue-by-product', title: 'Cost & Revenue by Product', description: 'Margin estimate per product sold.', category: 'restaurant-sales', icon: BarChart3 },
  { slug: 'discounts-vouchers', title: 'Discounts & Vouchers', description: 'Promotion and voucher redemption summary.', category: 'restaurant-sales', icon: Receipt },
  { slug: 'register-summary', title: 'Register Summary Report', description: 'Financial summary of POS registers and sessions.', category: 'pos', icon: CreditCard },
  { slug: 'cash-register-difference', title: 'Cash Register Difference', description: 'Opening float, sales, movements, and declared cash variance.', category: 'pos', icon: CreditCard },
  { slug: 'till-shift-sales', title: 'Till / Shift Wise Sales Report', description: 'Sales totals grouped by shift session.', category: 'pos', icon: BarChart3 },
  { slug: 'ingredient-usage', title: 'Ingredient Usage Report', description: 'Ingredient consumption based on sold products.', category: 'inventory', icon: Boxes },
  { slug: 'low-stock-alerts', title: 'Low Stock Alerts', description: 'Ingredients and items nearing depletion.', category: 'inventory', icon: Boxes },
  { slug: 'tentative-stock', title: 'Tentative Stock in Hand', description: 'Opening stock, consumption, balance, and value.', category: 'inventory', icon: Boxes },
  { slug: 'materials-balance', title: 'Materials Balance Analysis', description: 'Opening, purchase, consumption, waste, and balance.', category: 'inventory', icon: Boxes },
  { slug: 'categorized-products', title: 'Categorized Products Report', description: 'Each category with total product count.', category: 'system', icon: Package },
];

export function reportBySlug(slug: string) {
  return REPORT_CATALOG.find((r) => r.slug === slug);
}
