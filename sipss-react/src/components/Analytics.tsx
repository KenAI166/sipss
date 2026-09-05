import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { AuthUser } from '../utils/auth';
import {
  getSales,
  getStaff,
  getAttendance,
  getIngredients,
  getProducts,
  getExpenses,
  getStockTransactions,
  getPayroll,
} from '../utils/db';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity,
  Package,
  ClipboardList,
} from 'lucide-react';

interface AnalyticsProps {
  user: AuthUser;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
        console.error('Analytics load error:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const formatCurrency = (value: number) =>
    '₱' + (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const totalStaff = staff.length;
  const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalOrders = sales.length;
  const avgOrder = totalOrders ? totalSales / totalOrders : 0;
  const lowStock = ingredients.filter(i => i.current_quantity <= i.minimum_quantity).length;

  const todaySales = sales.filter(s => s.created_at && s.created_at.startsWith(today)).reduce((sum, s) => sum + (s.total || 0), 0);
  const yesterdaySales = sales.filter(s => s.created_at && s.created_at.startsWith(yesterday)).reduce((sum, s) => sum + (s.total || 0), 0);
  const salesChange = yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

  const todayOrders = sales.filter(s => s.created_at && s.created_at.startsWith(today)).length;
  const yesterdayOrders = sales.filter(s => s.created_at && s.created_at.startsWith(yesterday)).length;
  const ordersChange = yesterdayOrders ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0;

  const productMap: { [name: string]: any } = {};
  products.forEach(p => productMap[p.name] = p);

  const productSales: { [name: string]: { name: string; sold: number; revenue: number } } = {};
  const categoryTotals: { [cat: string]: number } = {};
  let categoryTotalSales = 0;

  sales.forEach(sale => {
    let items: any[] = [];
    try {
      items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []);
    } catch (e) { /* ignore */ }

    items.forEach((item: any) => {
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const revenue = qty * price;

      if (!productSales[item.name]) productSales[item.name] = { name: item.name, sold: 0, revenue: 0 };
      productSales[item.name].sold += qty;
      productSales[item.name].revenue += revenue;

      const product = productMap[item.name];
      const cat = product?.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + revenue;
      categoryTotalSales += revenue;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.sold - a.sold)
    .slice(0, 5)
    .map(p => ({ ...p, revenue: formatCurrency(p.revenue) }));

  const categoryBreakdown = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      percent: categoryTotalSales ? Math.round((amount / categoryTotalSales) * 100) : 0,
      amount,
    }));

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

  const recentActivity = [
    ...sales
      .filter(s => s.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(s => ({
        icon: DollarSign,
        title: 'Sale completed',
        desc: `Order #${s.receipt_number || '-'} - ${formatCurrency(s.total)}`,
        time: formatTimeAgo(s.created_at),
        color: 'green',
      })),
    ...attendance
      .filter(a => a.time_in)
      .sort((a, b) => new Date(b.time_in || b.created_at).getTime() - new Date(a.time_in || a.created_at).getTime())
      .slice(0, 2)
      .map(a => ({
        icon: Users,
        title: 'Staff clocked in',
        desc: `${a.staff_name} started shift`,
        time: formatTimeAgo(a.time_in || a.created_at),
        color: 'blue',
      })),
    ...expenses
      .filter(e => e.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(e => ({
        icon: DollarSign,
        title: 'Expense recorded',
        desc: `${e.description} - ${formatCurrency(e.amount)}`,
        time: formatTimeAgo(e.created_at),
        color: 'red',
      })),
    ...stockTransactions
      .filter(s => s.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(s => ({
        icon: Package,
        title: 'Stock ' + (s.type || 'update'),
        desc: `${s.ingredient_name || 'Item'} ${s.quantity > 0 ? '+' : ''}${s.quantity}`,
        time: formatTimeAgo(s.created_at),
        color: 'purple',
      })),
    ...payroll
      .filter(p => p.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 1)
      .map(p => ({
        icon: ClipboardList,
        title: 'Payroll generated',
        desc: `${p.staff_name} - ${formatCurrency(p.net_pay)}`,
        time: formatTimeAgo(p.created_at),
        color: 'orange',
      })),
    ...ingredients
      .filter(i => i.current_quantity <= i.minimum_quantity)
      .slice(0, 2)
      .map(i => ({
        icon: Activity,
        title: 'Low stock alert',
        desc: `${i.name} below minimum`,
        time: 'Just now',
        color: 'red',
      })),
  ].sort((a, b) => 0).slice(0, 7);

  const getTrendClass = (change: number) => change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const getTrendIcon = (change: number) => change >= 0 ? ArrowUp : ArrowDown;

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentView="analytics"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        <Header title="Analytics" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className={`flex items-center text-xs font-medium ${getTrendClass(salesChange)}`}>
                  {React.createElement(getTrendIcon(salesChange), { className: 'h-3 w-3 mr-1' })}
                  {`${salesChange >= 0 ? '+' : ''}${Math.round(salesChange)}%`}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalSales)}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-2">
                  <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className={`flex items-center text-xs font-medium ${getTrendClass(ordersChange)}`}>
                  {React.createElement(getTrendIcon(ordersChange), { className: 'h-3 w-3 mr-1' })}
                  {`${ordersChange >= 0 ? '+' : ''}${Math.round(ordersChange)}%`}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalOrders}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-2">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Order Value</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(avgOrder)}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Staff</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalStaff}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800 md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2">
                  <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Items</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lowStock}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Category Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Sales by Category
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  All time
                </div>
              </div>
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No sales data</p>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{cat.percent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${cat.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Products</h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No product sales</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product: any, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.sold} sold</p>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{product.revenue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
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
      </div>
    </div>
  );
};

export default Analytics;
