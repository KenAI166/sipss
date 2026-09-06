import React, { useState, useMemo } from 'react';
import { useSidebarOpen } from '../hooks/useSidebarOpen';
import Sidebar from './Sidebar';
import Header from './Header';
import { BookOpen, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ManualProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

interface Guide {
  title: string;
  tagline: string;
  steps: string[];
  note?: string;
}

const guides: Guide[] = [
  {
    title: 'Dashboard',
    tagline: 'See how the coffee shop is doing today.',
    steps: [
      'Open the Dashboard page from the sidebar.',
      'Look at the big number cards to see sales, expenses, and present staff.',
      'Pick a time range using the buttons, like Today or Month.',
      'Pick a chart type, like Sales or Inventory, to see a colorful line.',
      'Use the numbers to help the shop make good choices.',
    ],
  },
  {
    title: 'POS (Point of Sale)',
    tagline: 'Take orders and payments from customers.',
    steps: [
      'Open the POS page.',
      'Tap the drink or food the customer wants.',
      'Tap the size and add extras if asked.',
      'Tap Pay when the order is ready.',
      'Choose how the customer paid: Cash, Card, or Online.',
      'Tap Complete and give the customer their receipt.',
    ],
  },
  {
    title: 'Products',
    tagline: 'Add or change the drinks and snacks you sell.',
    steps: [
      'Open the Products page.',
      'Tap the Add Product button.',
      'Type the name, price, cost, and how many you have.',
      'Pick a color and shape to make it easy to find.',
      'Tap Save. The new product is ready for the POS.',
      'To fix a product, tap Edit and change the details.',
    ],
  },
  {
    title: 'Inventory',
    tagline: 'Count the finished drinks and items in the shop.',
    steps: [
      'Open the Inventory page.',
      'Look at the list of finished goods.',
      'If a number is red, it means the stock is low.',
      'Tap Edit to change the amount on hand.',
      'Save the new number so everyone sees the same count.',
    ],
  },
  {
    title: 'Ingredients',
    tagline: 'Keep track of the raw stuff used to make drinks.',
    steps: [
      'Open the Ingredients page.',
      'Tap Add Ingredient to add a new raw item.',
      'Type the name, unit, and how much you have.',
      'Set a low-stock number so the app warns you.',
      'Save the ingredient for use in recipes.',
    ],
  },
  {
    title: 'Recipes (BOM)',
    tagline: 'Write down what goes into each drink or snack.',
    steps: [
      'Open the Recipes page.',
      'Tap Add Recipe.',
      'Pick the finished product.',
      'Add each ingredient and how much is needed.',
      'Save the recipe. The app will use it to count stock.',
    ],
  },
  {
    title: 'Suppliers',
    tagline: 'Save the names and numbers of the people who sell you supplies.',
    steps: [
      'Open the Suppliers page.',
      'Tap Add Supplier.',
      'Type the company name, phone, and email.',
      'Tap Save to keep the contact safe.',
      'When you need more stock, tap the supplier to get their info.',
    ],
  },
  {
    title: 'Stock Transactions',
    tagline: 'Record when ingredients come in or go out.',
    steps: [
      'Open the Stock Transactions page.',
      'Tap Add Transaction.',
      'Pick the ingredient and type In if you received stock or Out if you used it.',
      'Type the amount and the date.',
      'Tap Save. The stock number will change automatically.',
    ],
  },
  {
    title: 'Sales & Reports',
    tagline: 'Look at money and sales over time.',
    steps: [
      'Open the Sales & Reports page.',
      'Pick a date range to look at.',
      'See the list of sold orders.',
      'Tap a receipt to see what the customer bought.',
      'Use the totals to know if the shop is earning well.',
    ],
  },
  {
    title: 'Attendance',
    tagline: 'Check who came to work and who did not.',
    steps: [
      'Open the Attendance page.',
      'Tap the staff name.',
      'Tap Present, Absent, Late, or On Leave.',
      'Set the time in and time out.',
      'Tap Save so the record is stored.',
    ],
  },
  {
    title: 'Schedule',
    tagline: 'Plan when each staff member will work.',
    steps: [
      'Open the Schedule page.',
      'Pick a week or day you want to plan.',
      'Tap Add Shift.',
      'Choose the staff and the start and end times.',
      'Tap Save to put it on the calendar.',
    ],
  },
  {
    title: 'Payroll',
    tagline: 'Figure out how much to pay the staff.',
    steps: [
      'Open the Payroll page.',
      'Pick a staff member.',
      'Pick the month and the pay period.',
      'Tap Calculate. The app counts the hours from attendance.',
      'Check the net pay number.',
      'Tap Save when the payment is ready.',
    ],
  },
  {
    title: 'Expenses',
    tagline: 'Record money the shop spends.',
    steps: [
      'Open the Expenses page.',
      'Tap Add Expense.',
      'Type what the money was spent on.',
      'Enter the amount and the date.',
      'Pick a category like Rent, Supplies, or Utilities.',
      'Tap Save to keep track of spending.',
    ],
  },
  {
    title: 'Staff',
    tagline: 'Add or manage coffee shop workers.',
    note: 'This one is only for the Owner.',
    steps: [
      'Open the Staff page.',
      'Tap Add Staff.',
      'Type the name, position, and hourly rate.',
      'Tap Save to add the worker to the system.',
      'To remove or edit a worker, tap the buttons beside their name.',
    ],
  },
];

const Manual: React.FC<ManualProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(guides.map((g) => [g.title, true]))
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return guides;
    return guides.filter(
      (g) =>
        g.title.toLowerCase().includes(term) ||
        g.tagline.toLowerCase().includes(term) ||
        g.steps.some((s) => s.toLowerCase().includes(term))
    );
  }, [search]);

  const toggle = (title: string) => {
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const setAll = (value: boolean) => {
    setOpen(Object.fromEntries(guides.map((g) => [g.title, value])));
  };

  const scrollTo = (id: string, title: string) => {
    setOpen((prev) => ({ ...prev, [title]: true }));
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentView="manual"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title="User Manual"
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                    How to use Sip Station
                  </h2>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                    This guide explains each part of the app in very simple steps. If you are ever unsure what a page does, come back here.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a topic..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                  aria-label="Search manual topics"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAll(true)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Open all
                </button>
                <button
                  onClick={() => setAll(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Close all
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filtered.map((guide, index) => {
                    const isOpen = open[guide.title] ?? true;

                    return (
                      <article
                        id={`guide-${index}`}
                        key={guide.title}
                        className="scroll-mt-24 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        aria-labelledby={`guide-title-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3
                              id={`guide-title-${index}`}
                              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                            >
                              {guide.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {guide.tagline}
                            </p>
                          </div>
                          <button
                            onClick={() => toggle(guide.title)}
                            aria-expanded={isOpen}
                            aria-controls={`guide-body-${index}`}
                            aria-label={
                              isOpen
                                ? `Close ${guide.title} guide`
                                : `Open ${guide.title} guide`
                            }
                            className="grid size-7 shrink-0 place-content-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {isOpen && (
                          <div id={`guide-body-${index}`} className="mt-2">
                            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
                              {guide.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="leading-snug">
                                  {step}
                                </li>
                              ))}
                            </ol>
                            {guide.note && (
                              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                {guide.note}
                              </p>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                {filtered.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                    No guide found. Try a different word.
                  </div>
                )}
              </div>

              <aside className="hidden lg:block">
                <nav className="sticky top-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    On this page
                  </h4>
                  <ul className="space-y-1">
                    {filtered.map((guide, index) => (
                      <li key={guide.title}>
                        <button
                          onClick={() => scrollTo(`guide-${index}`, guide.title)}
                          className="w-full truncate rounded-md px-2 py-1 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          aria-label={`Jump to ${guide.title}`}
                        >
                          {guide.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Manual;
