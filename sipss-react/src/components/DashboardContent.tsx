import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSales, getStaff, getAttendance, getIngredients, getProducts, getExpenses, getStockTransactions, getPayroll } from '../utils/db';
import { DollarSign, Users, Package, ClipboardList, TrendingUp, Activity, Bell, Moon, Sun, User, Menu, LogOut } from 'lucide-react';

interface DashboardContentProps {
  open: boolean;
  onMenuClick: () => void;
  onLogout?: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ open, onMenuClick, onLogout }) => {
  const { isDark, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [sales, setSales] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stockTransactions, setStockTransactions] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [s, st, a, i, p, e, stx, pr] = await Promise.all([
          getSales(),
          getStaff(),
          getAttendance(),
          getIngredients(),
          getProducts(),
          getExpenses(),
          getStockTransactions(),
          getPayroll(),
        ]);
        if (mounted) {
          setSales(s);
          setStaff(st);
          setAttendance(a);
          setIngredients(i);
          setProducts(p);
          setExpenses(e);
          setStockTransactions(stx);
          setPayroll(pr);
        }
      } catch (err) {
        console.error('Dashboard data load error:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (value: number) => {
    return '₱' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isToday = (d?: string) => d && d.startsWith(today);
  const isYesterday = (d?: string) => d && d.startsWith(yesterday);

  const todaySales = sales.filter(s => isToday(s.created_at)).reduce((sum, s) => sum + (s.total || 0), 0);
  const yesterdaySales = sales.filter(s => isYesterday(s.created_at)).reduce((sum, s) => sum + (s.total || 0), 0);
  const salesChange = yesterdaySales ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : 0;

  const todayOrders = sales.filter(s => isToday(s.created_at)).length;
  const yesterdayOrders = sales.filter(s => isYesterday(s.created_at)).length;
  const ordersChange = yesterdayOrders ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) : 0;

  const staffPresent = attendance.filter(a => isToday(a.date) && a.time_in && !a.time_out).length;
  const staffOnBreak = attendance.filter(a => isToday(a.date) && a.break_start && !a.break_end).length;
  const totalStaff = staff.length;
  const staffOnDutyPct = totalStaff ? Math.round((staffPresent / totalStaff) * 100) : 0;

  const lowStock = ingredients.filter(i => i.current_quantity <= i.minimum_quantity).length;
  const inventoryLevel = ingredients.length ? Math.round(((ingredients.length - lowStock) / ingredients.length) * 100) : 0;

  const todayExpenses = expenses.filter(e => e.date === today).reduce((sum, e) => sum + (e.amount || 0), 0);
  const expenseRatio = todaySales ? Math.round((todayExpenses / todaySales) * 100) : 0;

  const formatTimeAgo = (d?: string) => {
    if (!d) return 'Just now';
    const diff = Date.now() - new Date(d).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 3)
    .map(s => ({
      icon: DollarSign,
      title: 'Sale completed',
      desc: `Order #${s.receipt_number || '-'} paid in ${s.payment_method || 'cash'}`,
      time: formatTimeAgo(s.created_at),
      color: 'green',
    }));

  const recentAttendance = [...attendance]
    .filter(a => a.time_in)
    .sort((a, b) => new Date(b.time_in || b.created_at || 0).getTime() - new Date(a.time_in || a.created_at || 0).getTime())
    .slice(0, 2)
    .map(a => ({
      icon: Users,
      title: 'Staff clocked in',
      desc: `${a.staff_name} started shift`,
      time: formatTimeAgo(a.time_in || a.created_at),
      color: 'blue',
    }));

  const lowStockAlerts = [...ingredients]
    .filter(i => i.current_quantity <= i.minimum_quantity)
    .slice(0, 2)
    .map(i => ({
      icon: Activity,
      title: 'Low stock alert',
      desc: `${i.name} below minimum`,
      time: 'Just now',
      color: 'orange',
    }));

  const recentExpenses = [...expenses]
    .filter(e => e.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2)
    .map(e => ({
      icon: DollarSign,
      title: 'Expense recorded',
      desc: `${e.description} - ${formatCurrency(e.amount)}`,
      time: formatTimeAgo(e.created_at),
      color: 'red',
    }));

  const recentStock = [...stockTransactions]
    .filter(s => s.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2)
    .map(s => ({
      icon: Package,
      title: 'Stock ' + (s.type || 'update'),
      desc: `${s.ingredient_name || 'Item'} ${s.quantity > 0 ? '+' : ''}${s.quantity}`,
      time: formatTimeAgo(s.created_at),
      color: 'purple',
    }));

  const recentPayroll = [...payroll]
    .filter(p => p.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 1)
    .map(p => ({
      icon: ClipboardList,
      title: 'Payroll generated',
      desc: `${p.staff_name} - ${formatCurrency(p.net_pay)}`,
      time: formatTimeAgo(p.created_at),
      color: 'orange',
    }));

  const activities = [
    ...recentSales,
    ...recentAttendance,
    ...recentExpenses,
    ...recentStock,
    ...recentPayroll,
    ...lowStockAlerts,
  ];

  const productCounts: { [key: string]: number } = {};
  sales.forEach(s => {
    try {
      const items = typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || []);
      items.forEach((item: any) => {
        productCounts[item.name] = (productCounts[item.name] || 0) + (item.quantity || 1);
      });
    } catch (e) { /* ignore */ }
  });
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, sold: count }));
  const topProductsList = topProducts.length
    ? topProducts
    : products.slice(0, 4).map(p => ({ name: p.name, sold: 0 }));

  const getTrendClass = (change: number) => change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const getTrendIcon = (change: number) => change >= 0 ? '+' : '';

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!open && (
            <button
              onClick={onMenuClick}
              className="grid size-10 place-content-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Welcome back to Sip Station</p>
          </div>
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <User className="h-5 w-5" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <button
                    onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
              </div>
            )}
          </div>
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
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">Today's Sales</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(todaySales)}</p>
          <p className={`mt-1 text-sm ${getTrendClass(salesChange)}`}>
            {`${getTrendIcon(salesChange)}${salesChange}% from yesterday`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">Staff Present</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{staffPresent}</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">{staffOnBreak} on break</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">Orders</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayOrders}</p>
          <p className={`mt-1 text-sm ${getTrendClass(ordersChange)}`}>
            {`${getTrendIcon(ordersChange)}${ordersChange}% from yesterday`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
              <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">Low Stock Items</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lowStock}</p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">Need restock</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">View all</button>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex cursor-pointer items-center space-x-4 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className={`rounded-lg p-2 ${getActivityColor(activity.color)}`}>
                      <activity.icon className={`h-4 w-4 ${getActivityTextColor(activity.color)}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{activity.desc}</p>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Cafe Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Inventory Level</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{inventoryLevel}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${inventoryLevel}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Staff On Duty</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{staffOnDutyPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${staffOnDutyPct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Expense Ratio</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{expenseRatio}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-orange-500" style={{ width: `${expenseRatio}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Top Products</h3>
            {topProductsList.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No product data</p>
            ) : (
              <div className="space-y-3">
                {topProductsList.map((product, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{product.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.sold} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Logout</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">No</button>
              <button onClick={() => { setShowLogoutConfirm(false); if (onLogout) onLogout(); }} className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getActivityColor = (color: string) => {
  switch (color) {
    case 'green': return 'bg-green-50 dark:bg-green-900/20';
    case 'blue': return 'bg-blue-50 dark:bg-blue-900/20';
    case 'purple': return 'bg-purple-50 dark:bg-purple-900/20';
    case 'orange': return 'bg-orange-50 dark:bg-orange-900/20';
    default: return 'bg-red-50 dark:bg-red-900/20';
  }
};

const getActivityTextColor = (color: string) => {
  switch (color) {
    case 'green': return 'text-green-600 dark:text-green-400';
    case 'blue': return 'text-blue-600 dark:text-blue-400';
    case 'purple': return 'text-purple-600 dark:text-purple-400';
    case 'orange': return 'text-orange-600 dark:text-orange-400';
    default: return 'text-red-600 dark:text-red-400';
  }
};

export default DashboardContent;
