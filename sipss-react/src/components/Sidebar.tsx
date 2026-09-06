import React, { useState } from 'react';
import { canAccess, Role } from '../utils/auth';
import {
  Home,
  Monitor,
  ShoppingCart,
  Package,
  Coffee,
  ChefHat,
  Truck,
  ScanLine,
  DollarSign,
  ClipboardList,
  Calendar,
  Users,
  Activity,
  X,
  User,
  BookOpen,
  LogOut,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;

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

interface OptionProps {
  Icon: IconType;
  title: string;
  view: string;
  selected: string;
  setSelected: (view: string) => void;
  onNavigate: (view: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const menuItems = [
  { view: 'dashboard', title: 'Dashboard', Icon: Home },
  { view: 'pos', title: 'POS', Icon: Monitor },
  { view: 'products', title: 'Products', Icon: ShoppingCart },
  { view: 'inventory', title: 'Inventory', Icon: Package },
  { view: 'ingredients', title: 'Ingredients', Icon: Coffee },
  { view: 'recipes', title: 'Recipes (BOM)', Icon: ChefHat },
  { view: 'suppliers', title: 'Suppliers', Icon: Truck },
  { view: 'stock-transactions', title: 'Stock Transactions', Icon: ScanLine },
  { view: 'sales', title: 'Sales & Reports', Icon: DollarSign },
  { view: 'attendance', title: 'Attendance', Icon: ClipboardList },
  { view: 'schedule', title: 'Schedule', Icon: Calendar },
  { view: 'payroll', title: 'Payroll', Icon: DollarSign },
  { view: 'expenses', title: 'Expenses', Icon: Activity },
  { view: 'staff', title: 'Staff', Icon: Users },
  { view: 'manual', title: 'Manual', Icon: BookOpen },
];

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onNavigate, currentView, isOpen, onClose }) => {
  const [selected, setSelected] = useState(currentView);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`top-0 left-0 z-50 h-screen shrink-0 border-r border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
          isOpen
            ? 'fixed md:sticky w-64'
            : 'sticky w-16'
        }`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center w-full'}`}>
            <Logo />
            {isOpen && (
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
          <button
            onClick={onClose}
            className={`grid size-10 place-content-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${
              isOpen ? '' : 'hidden'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mb-8 space-y-1">
          {menuItems
            .filter((item) => canAccess(user.role as Role, item.view))
            .map((item) => (
            <Option
              key={item.view}
              Icon={item.Icon}
              title={item.title}
              view={item.view}
              selected={selected}
              setSelected={setSelected}
              onNavigate={onNavigate}
              onClose={onClose}
              isOpen={isOpen}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3 dark:border-gray-800">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-content-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user.full_name}
                </p>
                <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-400">
                  {user.role}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="rounded-lg p-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onLogout}
                title="Logout"
                className="grid size-10 place-content-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const Option: React.FC<OptionProps> = ({
  Icon,
  title,
  view,
  selected,
  setSelected,
  onNavigate,
  onClose,
  isOpen,
}) => {
  const isSelected = selected === view;

  return (
    <button
      onClick={() => {
        setSelected(view);
        onNavigate(view);
        if (typeof window !== 'undefined' && window.innerWidth < 768 && isOpen) {
          onClose();
        }
      }}
      title={isOpen ? undefined : title}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected
          ? 'border-l-2 border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/50 dark:text-blue-300'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
      } ${isOpen ? '' : 'justify-center'}`}
    >
      <div className={`grid h-full place-content-center ${isOpen ? 'w-12' : 'w-full'}`}>
        <Icon className="h-4 w-4" />
      </div>
      {isOpen && <span className="truncate text-sm font-medium">{title}</span>}
    </button>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
      <Coffee className="h-5 w-5 text-white" />
    </div>
  );
};

export default Sidebar;
