import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Home from './components/Home';
import Login from './components/Login';
import { Example as NewDashboard } from './components/ui/dashboard-with-collapsible-sidebar';
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
import Analytics from './components/Analytics';
import Manual from './components/Manual';
import InstallAppButton from './components/InstallAppButton';
import { initDatabase, seedSampleData } from './utils/db';
import { signIn, signOut, getSessionUser, onAuthChange, canAccess, AuthUser } from './utils/auth';

type View = 'home' | 'login' | 'dashboard' | 'pos' | 'attendance' | 'products' | 'sales' | 'inventory' | 'ingredients' | 'recipes' | 'suppliers' | 'stock-transactions' | 'payroll' | 'expenses' | 'schedule' | 'staff' | 'analytics' | 'manual';

function App() {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Initialize database on app start
    const initializeApp = async () => {
      try {
        const dbTimeout = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Database initialization timed out')), 3000)
        );
        await Promise.race([initDatabase(), dbTimeout]);
        await seedSampleData();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setDbInitialized(true);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Restore an existing Supabase session and keep auth state in sync.
    getSessionUser().then((u) => {
      setUser(u);
      if (u) setView('dashboard');
      setAuthChecked(true);
    });

    const { data: { subscription } } = onAuthChange((u) => {
      setUser(u);
      if (!u) setView('home');
    });
    return () => subscription.unsubscribe();
  }, []);

  // Returns an error message for the login form, or null on success.
  const handleLogin = async (username: string, password: string): Promise<string | null> => {
    try {
      const authUser = await signIn(username, password);
      setUser(authUser);
      setView('dashboard');
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Invalid username or password';
    }
  };

  const handleLogout = () => {
    // Always clear local state first so the logout button can't appear
    // unresponsive if the remote sign-out call fails or hangs.
    setUser(null);
    setView('home');

    // Fire the remote sign-out in the background with a hard timeout so a
    // hanging network request never blocks the UI.
    const signOutWithTimeout = Promise.race([
      signOut(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('signOut timed out')), 5000)
      ),
    ]);

    signOutWithTimeout
      .catch((err) => console.warn('signOut failed or timed out, local session already cleared:', err));
  };

  const handleNavigate = (viewName: string) => {
    // Enforce role-based access: managers cannot reach owner-only views.
    if (user && !canAccess(user.role, viewName)) {
      setView('dashboard');
      return;
    }
    setView(viewName as View);
  };

  const guard = (render: (u: AuthUser) => React.ReactNode, viewName: View) =>
    !user || !canAccess(user.role, viewName) ? null : render(user);

  const renderView = () => {
    if (!dbInitialized || !authChecked) {
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
      case 'dashboard':
        return user ? <NewDashboard onNavigate={handleNavigate} onLogout={handleLogout} currentView={view} role={user.role} /> : null;
      case 'pos':
        return guard((u) => <POS user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'pos');
      case 'attendance':
        return guard((u) => <Attendance user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'attendance');
      case 'products':
        return guard((u) => <Products user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'products');
      case 'sales':
        return guard((u) => <Sales user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'sales');
      case 'inventory':
        return guard((u) => <Inventory user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'inventory');
      case 'ingredients':
        return guard((u) => <Ingredients user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'ingredients');
      case 'recipes':
        return guard((u) => <Recipes user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'recipes');
      case 'suppliers':
        return guard((u) => <Suppliers user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'suppliers');
      case 'stock-transactions':
        return guard((u) => <StockTransactions user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'stock-transactions');
      case 'payroll':
        return guard((u) => <Payroll user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'payroll');
      case 'expenses':
        return guard((u) => <Expenses user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'expenses');
      case 'schedule':
        return guard((u) => <Schedule user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'schedule');
      case 'staff':
        return guard((u) => <Staff user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'staff');
      case 'analytics':
        return guard((u) => <Analytics user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'analytics');
      case 'manual':
        return guard((u) => <Manual user={u} onLogout={handleLogout} onNavigate={handleNavigate} />, 'manual');
      default:
        return <Home onNavigate={handleNavigate} onLogin={handleLogin} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="App">
        {renderView()}
        {user && <InstallAppButton />}
      </div>
    </ThemeProvider>
  );
}

export default App;
