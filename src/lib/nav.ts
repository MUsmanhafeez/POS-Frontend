import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Globe2,
  Grid2x2,
  Image as ImageIcon,
  LayoutDashboard,
  MapPinned,
  MonitorSmartphone,
  Package,
  Printer,
  Settings,
  ShoppingBag,
  Tag,
  Wrench,
  Users,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  children?: { href: string; label: string; permission?: string }[];
};

export type NavSection = {
  id: string;
  label?: string;
  items: NavItem[];
};

/** Trimmed nav for POS-first deployment (managers / HQ setup only). */
export const POS_BACKOFFICE_NAV: NavSection[] = [
  {
    id: 'operations',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permission: 'admin.dashboards.index',
      },
      {
        href: '/admin/orders',
        label: 'Sales',
        icon: ShoppingBag,
        permission: 'admin.orders.index',
        children: [
          { href: '/admin/orders', label: 'Orders' },
          { href: '/admin/invoices', label: 'Invoices' },
          { href: '/admin/payments', label: 'Payments' },
          { href: '/admin/reasons', label: 'Reasons' },
        ],
      },
      {
        href: '/admin/pos',
        label: 'POS',
        icon: MonitorSmartphone,
        permission: 'admin.pos_registers.index',
        children: [
          { href: '/admin/pos', label: 'Order Taker' },
          { href: '/admin/kitchen', label: 'Kitchen Viewer' },
          { href: '/admin/pos/opening-closing', label: 'Opening & Closing' },
          { href: '/admin/pos/registers', label: 'Registers' },
          { href: '/admin/shifts', label: 'Shifts' },
          { href: '/admin/shift-sessions', label: 'Shift Sessions' },
        ],
      },
      {
        href: '/admin/menus',
        label: 'Menus',
        icon: Grid2x2,
        permission: 'admin.menus.index',
        children: [
          { href: '/admin/menus', label: 'All Menus' },
          { href: '/admin/categories', label: 'Categories', permission: 'admin.categories.index' },
          { href: '/admin/products', label: 'Products', permission: 'admin.products.index' },
          { href: '/admin/combos', label: 'Combos', permission: 'admin.products.index' },
          { href: '/admin/options', label: 'Options', permission: 'admin.options.index' },
        ],
      },
      {
        href: '/admin/branches',
        label: 'Branches',
        icon: Building2,
        permission: 'admin.branches.index',
      },
      {
        href: '/admin/tables',
        label: 'Seating Plan',
        icon: MapPinned,
        permission: 'admin.floors.index',
        children: [
          { href: '/admin/tables', label: 'Tables', permission: 'admin.tables.index' },
          { href: '/admin/reservations', label: 'Reservations', permission: 'admin.tables.index' },
          { href: '/admin/table-merges', label: 'Table Merges' },
          { href: '/admin/zones', label: 'Zones', permission: 'admin.zones.index' },
          { href: '/admin/floors', label: 'Floors', permission: 'admin.floors.index' },
        ],
      },
      {
        href: '/admin/transfers',
        label: 'Transfers',
        icon: Boxes,
        permission: 'admin.inventory.index',
      },
      {
        href: '/admin/discounts',
        label: 'Promotions',
        icon: Tag,
        permission: 'admin.promotions.index',
        children: [
          { href: '/admin/discounts', label: 'Discounts' },
          { href: '/admin/vouchers', label: 'Vouchers' },
        ],
      },
    ],
  },
  {
    id: 'system',
    label: 'SYSTEM',
    items: [
      {
        href: '/admin/users',
        label: 'Users',
        icon: Users,
        permission: 'admin.users.index',
        children: [
          { href: '/admin/users', label: 'All Users' },
          { href: '/admin/roles', label: 'Roles', permission: 'admin.roles.index' },
          { href: '/admin/customers', label: 'Customers', permission: 'admin.customers.index' },
        ],
      },
      {
        href: '/admin/tools',
        label: 'Tools',
        icon: Wrench,
        permission: 'admin.settings.index',
        children: [
          { href: '/admin/tools', label: 'Utilities' },
          { href: '/admin/sync', label: 'Sync monitor' },
        ],
      },
      {
        href: '/admin/translations',
        label: 'Localization',
        icon: Globe2,
        permission: 'admin.translations.index',
        children: [
          { href: '/admin/taxes', label: 'Taxes', permission: 'admin.taxes.index' },
        ],
      },
      {
        href: '/admin/reports',
        label: 'Reports',
        icon: FileText,
        permission: 'admin.reports.index',
        children: [
          { href: '/admin/reports', label: 'Report catalog' },
          { href: '/admin/analytics', label: 'Analytics & Insights', permission: 'admin.dashboards.index' },
        ],
      },
      {
        href: '/admin/activity-logs',
        label: 'Activities',
        icon: Activity,
        permission: 'admin.activities.index',
        children: [
          { href: '/admin/activity-logs', label: 'Activity Logs' },
          { href: '/admin/authentication-logs', label: 'Authentication Logs' },
        ],
      },
      {
        href: '/admin/printers',
        label: 'Manage Printers',
        icon: Printer,
        permission: 'admin.printers.index',
        children: [
          { href: '/admin/printers', label: 'Printers' },
          { href: '/admin/print-agents', label: 'Print Agents' },
        ],
      },
      {
        href: '/admin/settings',
        label: 'Settings',
        icon: Settings,
        permission: 'admin.settings.index',
      },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = POS_BACKOFFICE_NAV;

/** Full ERP nav (inventory, tools, transfers) — enable when expanding beyond POS. */
export const FULL_ERP_NAV: NavSection[] = [
  {
    id: 'operations',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permission: 'admin.dashboards.index',
      },
      {
        href: '/admin/orders',
        label: 'Sales',
        icon: ShoppingBag,
        permission: 'admin.orders.index',
        children: [
          { href: '/admin/orders', label: 'Orders' },
          { href: '/admin/invoices', label: 'Invoices' },
          { href: '/admin/payments', label: 'Payments' },
          { href: '/admin/reasons', label: 'Reasons' },
        ],
      },
      {
        href: '/admin/pos',
        label: 'POS',
        icon: MonitorSmartphone,
        permission: 'admin.pos_registers.index',
        children: [
          { href: '/admin/pos', label: 'Order Taker' },
          { href: '/admin/kitchen', label: 'Kitchen Viewer' },
          { href: '/admin/pos/opening-closing', label: 'Opening & Closing' },
          { href: '/admin/pos/registers', label: 'Registers' },
          { href: '/admin/shifts', label: 'Shifts' },
          { href: '/admin/shift-sessions', label: 'Shift Sessions' },
        ],
      },
      {
        href: '/admin/menus',
        label: 'Menus',
        icon: Grid2x2,
        permission: 'admin.menus.index',
        children: [
          { href: '/admin/menus', label: 'All Menus' },
          { href: '/admin/online-menus', label: 'Online menus' },
          { href: '/admin/categories', label: 'Categories', permission: 'admin.categories.index' },
          { href: '/admin/products', label: 'Products', permission: 'admin.products.index' },
          { href: '/admin/options', label: 'Options', permission: 'admin.options.index' },
        ],
      },
      {
        href: '/admin/branches',
        label: 'Branches',
        icon: Building2,
        permission: 'admin.branches.index',
      },
      {
        href: '/admin/tables',
        label: 'Seating Plan',
        icon: MapPinned,
        permission: 'admin.floors.index',
        children: [
          { href: '/admin/tables', label: 'Tables', permission: 'admin.tables.index' },
          { href: '/admin/table-merges', label: 'Table Merges' },
          { href: '/admin/zones', label: 'Zones', permission: 'admin.zones.index' },
          { href: '/admin/floors', label: 'Floors', permission: 'admin.floors.index' },
        ],
      },
      {
        href: '/admin/inventory',
        label: 'Inventory',
        icon: Boxes,
        permission: 'admin.inventory.index',
        children: [
          { href: '/admin/inventory/analytics', label: 'Analytics' },
          { href: '/admin/units', label: 'Units' },
          { href: '/admin/suppliers', label: 'Suppliers' },
          { href: '/admin/ingredients', label: 'Ingredients' },
          { href: '/admin/stock-movements', label: 'Stock Movements' },
          { href: '/admin/stock-closings', label: 'Stock Closings' },
          { href: '/admin/purchases', label: 'Purchases' },
        ],
      },
      {
        href: '/admin/discounts',
        label: 'Promotions',
        icon: Tag,
        permission: 'admin.promotions.index',
        children: [
          { href: '/admin/discounts', label: 'Discounts' },
          { href: '/admin/vouchers', label: 'Vouchers' },
        ],
      },
      {
        href: '/admin/media',
        label: 'Media',
        icon: ImageIcon,
        permission: 'admin.media.index',
      },
    ],
  },
  {
    id: 'apps',
    label: 'APPS',
    items: [],
  },
  {
    id: 'system',
    label: 'SYSTEM',
    items: [
      {
        href: '/admin/users',
        label: 'Users',
        icon: Users,
        permission: 'admin.users.index',
        children: [
          { href: '/admin/users', label: 'All Users' },
          { href: '/admin/roles', label: 'Roles', permission: 'admin.roles.index' },
          { href: '/admin/customers', label: 'Customers', permission: 'admin.customers.index' },
        ],
      },
      {
        href: '/admin/tools',
        label: 'Tools',
        icon: Wrench,
        permission: 'admin.settings.index',
        children: [
          { href: '/admin/tools', label: 'Utilities' },
          { href: '/admin/tools/database', label: 'Database' },
          { href: '/admin/transfers', label: 'Inter-Branch Transfers', permission: 'admin.inventory.index' },
          { href: '/admin/queue', label: 'Queue / Tokens' },
        ],
      },
      {
        href: '/admin/translations',
        label: 'Localization',
        icon: Globe2,
        permission: 'admin.translations.index',
        children: [
          { href: '/admin/translations', label: 'Translations' },
          { href: '/admin/currency-rates', label: 'Currency Rates' },
          { href: '/admin/taxes', label: 'Taxes', permission: 'admin.taxes.index' },
        ],
      },
      {
        href: '/admin/reports',
        label: 'Reports',
        icon: FileText,
        permission: 'admin.reports.index',
      },
      {
        href: '/admin/activity-logs',
        label: 'Activities',
        icon: Activity,
        permission: 'admin.activities.index',
        children: [
          { href: '/admin/activity-logs', label: 'Activity Logs' },
          { href: '/admin/authentication-logs', label: 'Authentication Logs' },
        ],
      },
      {
        href: '/admin/printers',
        label: 'Manage Printers',
        icon: Printer,
        permission: 'admin.printers.index',
        children: [
          { href: '/admin/printers', label: 'Printers' },
          { href: '/admin/print-agents', label: 'Print Agents' },
        ],
      },
      {
        href: '/admin/settings',
        label: 'Settings',
        icon: Settings,
        permission: 'admin.settings.index',
      },
    ],
  },
];

export const LOCALIZATION_TABS = [
  { href: '/admin/translations', label: 'Translations' },
  { href: '/admin/currency-rates', label: 'Currency Rates' },
  { href: '/admin/taxes', label: 'Taxes' },
] as const;

export const PRINTERS_TABS = [
  { href: '/admin/printers', label: 'Printers' },
  { href: '/admin/print-agents', label: 'Print Agents' },
] as const;

export const TOOLS_TABS = [
  { href: '/admin/tools', label: 'Utilities' },
  { href: '/admin/tools/database', label: 'Database' },
  { href: '/admin/transfers', label: 'Inter-Branch Transfers' },
  { href: '/admin/sync', label: 'Sync monitor' },
  { href: '/admin/queue', label: 'Queue / Tokens' },
] as const;

export const ACTIVITIES_TABS = [
  { href: '/admin/activity-logs', label: 'Activity Logs' },
  { href: '/admin/authentication-logs', label: 'Authentication Logs' },
] as const;

export const SETTINGS_NAV = [
  { href: '/admin/settings/general', label: 'General', icon: Settings },
  { href: '/admin/settings/application', label: 'Application', icon: MonitorSmartphone },
  { href: '/admin/settings/logo', label: 'Logo', icon: ImageIcon },
  { href: '/admin/settings/appearance', label: 'Appearance', icon: Grid2x2 },
  { href: '/admin/settings/pwa', label: 'PWA', icon: MonitorSmartphone },
  { href: '/admin/settings/kitchen', label: 'Kitchen', icon: ClipboardList },
  { href: '/admin/settings/currency', label: 'Currency', icon: Tag },
  { href: '/admin/settings/mail', label: 'Mail', icon: FileText },
  { href: '/admin/settings/filesystem', label: 'Filesystem', icon: Boxes },
] as const;
