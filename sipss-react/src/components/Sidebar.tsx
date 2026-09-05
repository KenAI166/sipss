import React from 'react';

interface SidebarProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onNavigate, currentView, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { id: 'pos', label: 'POS', icon: 'fa-cash-register' },
    { id: 'products', label: 'Products', icon: 'fa-box' },
    { id: 'inventory', label: 'Inventory', icon: 'fa-list' },
    { id: 'ingredients', label: 'Ingredients', icon: 'fa-leaf' },
    { id: 'recipes', label: 'Recipes (BOM)', icon: 'fa-utensils' },
    { id: 'suppliers', label: 'Suppliers', icon: 'fa-truck' },
    { id: 'stock-transactions', label: 'Stock Transactions', icon: 'fa-exchange-alt' },
    { id: 'sales', label: 'Sales & Reports', icon: 'fa-chart-bar' },
    { id: 'attendance', label: 'Attendance', icon: 'fa-clock' },
    { id: 'schedule', label: 'Schedule', icon: 'fa-calendar-alt' },
    { id: 'payroll', label: 'Payroll', icon: 'fa-wallet' },
    { id: 'expenses', label: 'Expenses', icon: 'fa-receipt' },
    { id: 'staff', label: 'Staff', icon: 'fa-users' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-80`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <i className="fas fa-coffee text-2xl text-green-500"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sip Station</h1>
              <p className="text-xs text-gray-500">Point of Sale</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <i className="fas fa-times text-gray-700 text-xl"></i>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onNavigate(item.id as any);
                    onClose();
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition ${
                    currentView === item.id
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <i className={`fas ${item.icon} ${currentView === item.id ? 'text-green-500' : 'text-green-500'}`}></i>
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <i className="fas fa-user text-green-500"></i>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{user.full_name}</p>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
