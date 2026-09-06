import React from 'react';
import { Printer, X } from 'lucide-react';

export interface ReceiptItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  receipt_number: string;
  created_at: string;
  customer_name?: string;
  cashier_name?: string;
  payment_method?: string;
  items: ReceiptItem[] | string;
  subtotal: number;
  tax: number;
  tax_enabled?: boolean;
  discount: number;
  discount_type?: string;
  total: number;
  notes?: string;
}

interface ReceiptProps {
  receipt: ReceiptData;
  onClose: () => void;
}

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatCurrency = (value: number) => `₱${value.toFixed(2)}`;

export const Receipt: React.FC<ReceiptProps> = ({ receipt, onClose }) => {
  const items: ReceiptItem[] =
    typeof receipt.items === 'string'
      ? (JSON.parse(receipt.items) as ReceiptItem[])
      : receipt.items;

  const handlePrint = () => window.print();

  return (
    <div className="receipt-print-layer fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 print:bg-white">
      <div className="receipt relative w-full max-w-sm rounded-xl bg-white p-6 text-slate-900 shadow-2xl print:rounded-none print:shadow-none">
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute right-2 top-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close receipt"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="mb-6 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-900">Sip Station</h2>
          <p className="text-xs text-slate-500">123 Coffee Street, Your City</p>
          <p className="text-xs text-slate-500">+63 912 345 6789</p>
        </header>

        <div className="mb-4 space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Receipt #</span>
            <span className="font-medium">{receipt.receipt_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium">{formatDate(receipt.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier</span>
            <span className="font-medium">{receipt.cashier_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer</span>
            <span className="font-medium">{receipt.customer_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment</span>
            <span className="font-medium uppercase">{receipt.payment_method}</span>
          </div>
        </div>

        <div className="my-4 border-t-2 border-dashed border-slate-300" />

        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.product_id} className="flex justify-between">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="my-4 border-t-2 border-dashed border-slate-300" />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          {!!receipt.tax_enabled && (
            <div className="flex justify-between">
              <span className="text-slate-600">Tax (12%)</span>
              <span>{formatCurrency(receipt.tax)}</span>
            </div>
          )}
          {receipt.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">Discount{receipt.discount_type ? ` - ${receipt.discount_type}` : ''}</span>
              <span>-{formatCurrency(receipt.discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        {receipt.notes && (
          <div className="mt-4 text-xs text-slate-500">
            <span className="font-medium">Notes:</span> {receipt.notes}
          </div>
        )}

        <div className="my-4 border-t-2 border-dashed border-slate-300" />

        <p className="text-center text-xs text-slate-500">Thank you for your visit!</p>

        <div className="no-print mt-6 flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
