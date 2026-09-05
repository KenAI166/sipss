import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Bell, Moon, Sun, User, Menu, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick, onLogout }) => {
  const { isDark, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="grid size-10 place-content-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative grid size-10 place-content-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
        </button>
        <button
          onClick={toggle}
          className="grid size-10 place-content-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          {isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="grid size-10 place-content-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <User className="h-5 w-5" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Logout
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                No
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
