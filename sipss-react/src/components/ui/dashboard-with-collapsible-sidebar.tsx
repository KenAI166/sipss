import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
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
  ChevronDown,
  ChevronsRight,
  Moon,
  Sun,
  TrendingUp,
  Activity,
  ClipboardList,
  Bell,
  Settings,
  HelpCircle,
  User,
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
  open: boolean;
  notifs?: number;
}

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  role: string;
}

interface NewDashboardProps {
  currentView: string;
  onNavigate: (view: string) => void;
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

export const Example: React.FC<NewDashboardProps> = ({ currentView, onNavigate, role }) => {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Sidebar currentView={currentView} onNavigate={onNavigate} role={role} />
        <ExampleContent />
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, role }) => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(currentView);
  const visibleItems = menuItems.filter((item) => canAccess(role as Role, item.view));

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-16"
      } border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900`}
    >
      <TitleSection open={open} />

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
            open={open}
          />
          <Option
            view="help"
            Icon={HelpCircle}
            title="Help & Support"
            selected={selected}
            setSelected={setSelected}
            onNavigate={onNavigate}
            open={open}
          />
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
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
  open,
  notifs,
}) => {
  const isSelected = selected === view;

  return (
    <button
      onClick={() => {
        setSelected(view);
        onNavigate(view);
      }}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected
          ? "border-l-2 border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/50 dark:text-blue-300"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      }`}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && (
        <span
          className={`text-sm font-medium transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </span>
      )}

      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white dark:bg-blue-600">
          {notifs}
        </span>
      )}
    </button>
  );
};

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-800">
      <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div
              className={`transition-opacity duration-200 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Sip Station
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Cafe POS
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && (
          <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
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

const ToggleClose = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={`h-4 w-4 text-gray-500 transition-transform duration-300 dark:text-gray-400 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        {open && (
          <span
            className={`text-sm font-medium text-gray-600 transition-opacity duration-200 dark:text-gray-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            Hide
          </span>
        )}
      </div>
    </button>
  );
};

const ExampleContent = () => {
  const { isDark, toggle } = useTheme();

  const activities = [
    {
      icon: DollarSign,
      title: "Sale completed",
      desc: "Order #1234 paid in cash",
      time: "2 min ago",
      color: "green",
    },
    {
      icon: Users,
      title: "Staff clocked in",
      desc: "Juan Dela Cruz started shift",
      time: "5 min ago",
      color: "blue",
    },
    {
      icon: Package,
      title: "Stock update",
      desc: "Arabica beans restocked",
      time: "10 min ago",
      color: "purple",
    },
    {
      icon: Activity,
      title: "Low stock alert",
      desc: "Oat milk below minimum",
      time: "1 hour ago",
      color: "orange",
    },
    {
      icon: Bell,
      title: "Payroll reminder",
      desc: "Generate payroll for Sept 1-15",
      time: "2 hours ago",
      color: "red",
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Welcome back to Sip Station
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
          </button>
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">
            Today&apos;s Sales
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₱24,567</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            +12% from yesterday
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">
            Staff Present
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">8</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            2 on break
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">
            Orders
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">156</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            +8% from yesterday
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
              <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">
            Low Stock Items
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">4</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            Reorder soon
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex cursor-pointer items-center space-x-4 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div
                    className={`rounded-lg p-2 ${
                      activity.color === "green"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : activity.color === "blue"
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : activity.color === "purple"
                        ? "bg-purple-50 dark:bg-purple-900/20"
                        : activity.color === "orange"
                        ? "bg-orange-50 dark:bg-orange-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <activity.icon
                      className={`h-4 w-4 ${
                        activity.color === "green"
                          ? "text-green-600 dark:text-green-400"
                          : activity.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : activity.color === "purple"
                          ? "text-purple-600 dark:text-purple-400"
                          : activity.color === "orange"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {activity.desc}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cafe Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Inventory Level
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  78%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: "78%" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Staff On Duty
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  80%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: "80%" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Expense Budget
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  45%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: "45%" }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Products
            </h3>
            <div className="space-y-3">
              {["Caramel Latte", "Americano", "Croissant", "Matcha Frappe"].map(
                (product, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {product}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {Math.floor(Math.random() * 100 + 50)} sold
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Example;
