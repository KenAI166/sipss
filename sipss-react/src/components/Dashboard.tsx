import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getSales, getInventory, getExpenses, getAttendance, getProducts, getPayroll } from '../utils/db';
import Sidebar from './Sidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todaySales, setTodaySales] = useState(0);
  const [todayProductsSold, setTodayProductsSold] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [presentEmployees, setPresentEmployees] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salesHistory, setSalesHistory] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'month'>('month');
  const [metricType, setMetricType] = useState<'sales' | 'inventory' | 'product' | 'expenses' | 'payroll'>('sales');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, metricType]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get today's sales
      const sales = await getSales();
      const today = new Date().toDateString();
      const todaySalesData = sales.filter((sale: any) => 
        new Date(sale.created_at).toDateString() === today
      );
      const todayTotal = todaySalesData.reduce((sum: number, sale: any) => 
        sum + (sale.total || 0), 0
      );
      setTodaySales(todayTotal);

      // Calculate today's products sold
      const todayProducts = todaySalesData.reduce((sum: number, sale: any) => {
        try {
          const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
          if (Array.isArray(items)) {
            return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 1), 0);
          }
          return sum;
        } catch (error) {
          console.error('Error parsing sale items:', error);
          return sum;
        }
      }, 0);
      setTodayProductsSold(todayProducts);

      // Get today's expenses
      const expenses = await getExpenses();
      const todayExpensesData = expenses.filter((exp: any) => 
        new Date(exp.created_at).toDateString() === today
      );
      const todayExpensesTotal = todayExpensesData.reduce((sum: number, exp: any) => 
        sum + (exp.amount || 0), 0
      );
      setTodayExpenses(todayExpensesTotal);

      // Get today's inventory changes
      const inventory = await getInventory();
      const totalInventoryStock = inventory.length;

      // Get payroll data
      const payroll = await getPayroll();
      const todayPayrollData = payroll.filter((pay: any) => 
        new Date(pay.created_at).toDateString() === today
      );
      const todayPayrollTotal = todayPayrollData.reduce((sum: number, pay: any) => 
        sum + (pay.net_pay || 0), 0
      );

      // Generate history based on selected metric type
      const history: number[] = [];
      
      if (timeRange === 'today') {
        if (metricType === 'sales') {
          history.push(todayTotal);
        } else if (metricType === 'product') {
          history.push(todayProducts);
        } else if (metricType === 'expenses') {
          history.push(todayExpensesTotal);
        } else if (metricType === 'inventory') {
          history.push(totalInventoryStock);
        } else if (metricType === 'payroll') {
          history.push(todayPayrollTotal);
        }
      } else if (timeRange === 'month') {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(now.getFullYear(), now.getMonth(), day);
          const dateString = date.toDateString();
          
          if (metricType === 'sales') {
            const daySales = sales.filter((sale: any) => 
              new Date(sale.created_at).toDateString() === dateString
            );
            const dayTotal = daySales.reduce((sum: number, sale: any) => 
              sum + (sale.total || 0), 0
            );
            history.push(dayTotal);
          } else if (metricType === 'product') {
            const daySales = sales.filter((sale: any) => 
              new Date(sale.created_at).toDateString() === dateString
            );
            const productsSold = daySales.reduce((sum: number, sale: any) => {
              try {
                const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
                if (Array.isArray(items)) {
                  return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 1), 0);
                }
                return sum;
              } catch (error) {
                console.error('Error parsing sale items:', error);
                return sum;
              }
            }, 0);
            history.push(productsSold);
          } else if (metricType === 'expenses') {
            const dayExpenses = expenses.filter((exp: any) => 
              new Date(exp.created_at).toDateString() === dateString
            );
            const dayTotal = dayExpenses.reduce((sum: number, exp: any) => 
              sum + (exp.amount || 0), 0
            );
            history.push(dayTotal);
          } else if (metricType === 'inventory') {
            const dayInventory = inventory.filter((item: any) => 
              new Date(item.last_updated).toDateString() === dateString
            );
            const stockChange = dayInventory.reduce((sum: number, item: any) => 
              sum + item.current_quantity, 0
            );
            history.push(stockChange);
          } else if (metricType === 'payroll') {
            const dayPayroll = payroll.filter((pay: any) => 
              new Date(pay.created_at).toDateString() === dateString
            );
            const dayTotal = dayPayroll.reduce((sum: number, pay: any) => 
              sum + (pay.net_pay || 0), 0
            );
            history.push(dayTotal);
          }
        }
      }
      
      setSalesHistory(history);

      // Get products count
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const products = await getProducts();
      
      // Get low stock count
      const lowStock = inventory.filter((item: any) => 
        item.current_quantity <= item.minimum_quantity
      );
      setLowStockCount(lowStock.length);

      // Get total expenses
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const totalExpensesAmount = expenses.reduce((sum: number, exp: any) => 
        sum + (exp.amount || 0), 0
      );

      // Get present employees
      const attendance = await getAttendance();
      const todayAttendance = attendance.filter((att: any) => 
        new Date(att.created_at).toDateString() === today && att.time_in && !att.time_out
      );
      setPresentEmployees(todayAttendance.length);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case 'sales': return 'Sales';
      case 'product': return 'Products Sold';
      case 'inventory': return 'Inventory';
      case 'expenses': return 'Expenses';
      case 'payroll': return 'Payroll';
    }
  };

  const formatCurrency = (value: number) => {
    return '₱' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const getChartData = () => {
    const labels = timeRange === 'today' 
      ? ['Today'] 
      : Array.from({ length: salesHistory.length }, (_, i) => (i + 1).toString());

    return {
      labels,
      datasets: [
        {
          label: getMetricLabel(),
          data: salesHistory,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (metricType === 'sales' || metricType === 'expenses' || metricType === 'payroll') {
              return '₱' + value.toLocaleString();
            }
            return value.toLocaleString();
          },
        },
      },
    },
  };

  const stats = [
    { label: "Today's Sales", value: formatCurrency(todaySales), period: 'Today', icon: 'fa-dollar-sign', color: 'green' },
    { label: 'Products Sold', value: formatNumber(todayProductsSold), period: 'Today', icon: 'fa-box', color: 'blue' },
    { label: 'Today\'s Expenses', value: formatCurrency(todayExpenses), period: 'Today', icon: 'fa-receipt', color: 'red' },
    { label: 'Employees Present', value: formatNumber(presentEmployees), period: 'Present', icon: 'fa-users', color: 'purple' },
  ];

  const quickActions = [
    { label: 'New Sale', icon: 'fa-plus', view: 'pos' as const },
    { label: 'Time In/Out', icon: 'fa-clock', view: 'attendance' as const },
    { label: 'Add Product', icon: 'fa-box', view: 'products' as const },
    { label: 'View Reports', icon: 'fa-chart-pie', view: 'sales' as const },
  ];

  const recentSales: any[] = []; // Will be populated from database in real implementation

  const lowStockProducts: any[] = []; // Will be populated from database in real implementation

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Toggleable Sidebar */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentView="dashboard"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header with Menu Button */}
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <i className="fas fa-bars text-gray-700 text-xl"></i>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-black">Dashboard</h1>
              <p className="text-gray-600 text-sm">Welcome back, {user.full_name}!</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <i className={`fas ${stat.icon} text-${stat.color}-500 text-xl`}></i>
                  </div>
                  <span className="text-sm text-gray-500">{stat.period}</span>
                </div>
                <h3 className="text-2xl font-bold text-black">{stat.value}</h3>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-black">{getMetricLabel()} Overview</h2>
              <div className="flex space-x-2">
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="sales">Sales</option>
                  <option value="product">Products Sold</option>
                  <option value="inventory">Inventory</option>
                  <option value="expenses">Expenses</option>
                  <option value="payroll">Payroll</option>
                </select>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTimeRange('today')}
                    className={`px-3 py-1 rounded-md text-sm ${timeRange === 'today' ? 'bg-white shadow text-black' : 'text-gray-600'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeRange('month')}
                    className={`px-3 py-1 rounded-md text-sm ${timeRange === 'month' ? 'bg-white shadow text-black' : 'text-gray-600'}`}
                  >
                    Month
                  </button>
                </div>
              </div>
            </div>
            <div className="h-64">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onNavigate(action.view)}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className={`fas ${action.icon} text-green-500 text-xl`}></i>
                  </div>
                  <span className="text-sm font-medium text-black">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-4">Recent Sales</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentSales.length > 0 ? recentSales.map((sale: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{sale.receipt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{sale.cashier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">{sale.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{sale.payment}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{sale.time}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No sales yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-black mb-4">Low Stock Alert ({lowStockCount} items)</h2>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lowStockProducts.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.product_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{item.current_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.minimum_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
