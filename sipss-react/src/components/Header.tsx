import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Bell, Moon, Sun, User, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { isDark, toggle } = useTheme();

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
        <button className="grid size-10 place-content-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          <User className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Header;
