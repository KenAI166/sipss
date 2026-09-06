import React, { useState } from "react";
import { useSidebarOpen } from "../../hooks/useSidebarOpen";
import DashboardContent from "../DashboardContent";
import { canAccess, Role } from "../../utils/auth";
import {
  Home,
  DollarSign,
  Monitor,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Coffee,
  Activity,
  ClipboardList,
  Settings,
  HelpCircle,
  X,
  ChefHat,
  Truck,
  ScanLine,
  Calendar,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;

interface OptionProps {
  view: string;
  Icon: IconType;
  title: string;
  selected: string;
  setSelected: (view: string) => void;
  onNavigate: (view: string) => void;
  onClose: () => void;
  open: boolean;
  notifs?: number;
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  role: string;
}

interface NewDashboardProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  role: string;
}

const menuItems: { view: string; title: string; Icon: IconType; notifs?: number }[] = [
  { view: "dashboard", title: "Dashboard", Icon: Home },
  { view: "pos", title: "POS", Icon: Monitor },
  { view: "sales", title: "Sales", Icon: DollarSign, notifs: 3 },
  { view: "products", title: "Products", Icon: ShoppingCart },
  { view: "inventory", title: "Inventory", Icon: Package },
  { view: "ingredients", title: "Ingredients", Icon: Coffee },
  { view: "recipes", title: "Recipes", Icon: ChefHat },
  { view: "suppliers", title: "Suppliers", Icon: Truck },
  { view: "stock-transactions", title: "Stock Transactions", Icon: ScanLine },
  { view: "staff", title: "Staff", Icon: Users, notifs: 12 },
  { view: "attendance", title: "Attendance", Icon: ClipboardList },
  { view: "schedule", title: "Schedule", Icon: Calendar },
  { view: "payroll", title: "Payroll", Icon: DollarSign },
  { view: "expenses", title: "Expenses", Icon: Activity },
  { view: "analytics", title: "Analytics", Icon: BarChart3 },
];

export const Example: React.FC<NewDashboardProps> = ({ currentView, onNavigate, onLogout, role }) => {
  const [open, setOpen] = useSidebarOpen();

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative flex w-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <Sidebar open={open} setOpen={setOpen} currentView={currentView} onNavigate={onNavigate} role={role} />
        <ExampleContent open={open} onMenuClick={() => setOpen(!open)} onLogout={onLogout} />
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen, currentView, onNavigate, role }) => {
  const [selected, setSelected] = useState(currentView);
  const visibleItems = menuItems.filter((item) => canAccess(role as Role, item.view));

  return (
    <nav
      className={`top-0 left-0 z-40 h-screen shrink-0 border-r border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
        open
          ? "fixed md:sticky w-64"
          : "sticky w-16"
      }`}
    >
      <TitleSection open={open} onClose={() => setOpen(false)} />

      <div className="mb-8 space-y-1">
        {visibleItems.map((item) => (
          <Option
            key={item.view}
            view={item.view}
            Icon={item.Icon}
            title={item.title}
            selected={selected}
            setSelected={setSelected}
            onNavigate={onNavigate}
            onClose={() => setOpen(false)}
            open={open}
            notifs={item.notifs}
          />
        ))}
      </div>

      {open && (
        <div className="space-y-1 border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Account
          </div>
          <Option
            view="settings"
            Icon={Settings}
            title="Settings"
            selected={selected}
            setSelected={setSelected}
            onNavigate={onNavigate}
            onClose={() => setOpen(false)}
            open={open}
          />
          <Option
            view="help"
            Icon={HelpCircle}
            title="Help & Support"
            selected={selected}
            setSelected={setSelected}
            onNavigate={onNavigate}
            onClose={() => setOpen(false)}
            open={open}
          />
        </div>
      )}
    </nav>
  );
};

const Option: React.FC<OptionProps> = ({
  view,
  Icon,
  title,
  selected,
  setSelected,
  onNavigate,
  onClose,
  open,
  notifs,
}) => {
  const isSelected = selected === view;

  return (
    <button
      onClick={() => {
        setSelected(view);
        onNavigate(view);
        if (typeof window !== 'undefined' && window.innerWidth < 768 && open) {
          onClose();
        }
      }}
      title={open ? undefined : title}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected
          ? "border-l-2 border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/50 dark:text-blue-300"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      } ${open ? '' : 'justify-center'}`}
    >
      <div className={`grid h-full place-content-center ${open ? 'w-12' : 'w-full'}`}>
        <Icon className="h-4 w-4" />
      </div>

      {open && (
        <span className="truncate text-sm font-medium">{title}</span>
      )}

      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white dark:bg-blue-600">
          {notifs}
        </span>
      )}
    </button>
  );
};

const TitleSection = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-800">
      <div className="flex items-center justify-between rounded-md p-2">
        <div className={`flex items-center ${open ? 'gap-3' : 'justify-center w-full'}`}>
          <Logo />
          {open && (
            <div>
              <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Sip Station
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Cafe POS
              </span>
            </div>
          )}
        </div>
        {open ? (
          <button
            onClick={onClose}
            className="grid size-8 place-content-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
      <Coffee className="h-5 w-5 text-white" />
    </div>
  );
};

const ExampleContent = ({ open, onMenuClick, onLogout }: { open: boolean; onMenuClick: () => void; onLogout: () => void }) => {
  return <DashboardContent open={open} onMenuClick={onMenuClick} onLogout={onLogout} />;
};

export default Example;
