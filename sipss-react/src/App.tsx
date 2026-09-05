import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Products from './components/Products';
import Attendance from './components/Attendance';
import Payroll from './components/Payroll';
import Staff from './components/Staff';
import Inventory from './components/Inventory';
import Ingredients from './components/Ingredients';
import Recipes from './components/Recipes';
import Suppliers from './components/Suppliers';
import StockTransactions from './components/StockTransactions';
import Expenses from './components/Expenses';
import Schedule from './components/Schedule';
import Sales from './components/Sales';
import { initDatabase } from './utils/db';

type View = 'home' | 'login' | 'signup' | 'dashboard' | 'pos' | 'attendance' | 'products' | 'sales' | 'inventory' | 'ingredients' | 'recipes' | 'suppliers' | 'stock-transactions' | 'payroll' | 'expenses' | 'schedule' | 'staff';

function App() {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    // Initialize database on app start
    const initializeApp = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbInitialized(true); // Continue even if initialization fails
      }
    };
    
    initializeApp();
  }, []);

  const handleLogin = (username: string, password: string) => {
    // Simulate login - in real app, this would call an API
    setUser({ full_name: username, role: 'owner' });
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  const handleNavigate = (viewName: string) => {
    setView(viewName as View);
  };

  const renderView = () => {
    if (!dbInitialized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'home':
        return <Home onNavigate={handleNavigate} onLogin={handleLogin} />;
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'signup':
        return <Login onLogin={handleLogin} initialMode="register" />;
      case 'dashboard':
        return user ? <Dashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'pos':
        return user ? <POS user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'attendance':
        return user ? <Attendance user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'products':
        return user ? <Products user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'sales':
        return user ? <Sales user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'inventory':
        return user ? <Inventory user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'ingredients':
        return user ? <Ingredients user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'recipes':
        return user ? <Recipes user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'suppliers':
        return user ? <Suppliers user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'stock-transactions':
        return user ? <StockTransactions user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'payroll':
        return user ? <Payroll user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'expenses':
        return user ? <Expenses user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'schedule':
        return user ? <Schedule user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      case 'staff':
        return user ? <Staff user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : null;
      default:
        return <Home onNavigate={handleNavigate} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
