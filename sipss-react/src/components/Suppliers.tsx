import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getSuppliers, saveSupplier, deleteSupplier } from '../utils/db';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_terms: string;
  notes: string;
}

interface SuppliersProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: '',
    notes: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        await loadSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supplier = {
        id: editingSupplier?.id || 0,
        name: formData.name,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        payment_terms: formData.payment_terms,
        notes: formData.notes,
      };

      await saveSupplier(supplier);
      await loadSuppliers();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="suppliers" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <Header title="Suppliers" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition">
                <i className="fas fa-plus mr-2"></i>Add Supplier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
                No suppliers found. Click "Add Supplier" to create one.
              </div>
            ) : (
              suppliers.map(supplier => (
                <div key={supplier.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <i className="fas fa-truck text-blue-500 dark:text-blue-400 text-xl"></i>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(supplier)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-700">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-white mb-2">{supplier.name}</h3>
                  <div className="space-y-2 text-sm">
                    {supplier.contact_person && (
                      <p className="text-gray-600 dark:text-gray-400"><i className="fas fa-user mr-2 w-4"></i>{supplier.contact_person}</p>
                    )}
                    {supplier.phone && (
                      <p className="text-gray-600 dark:text-gray-400"><i className="fas fa-phone mr-2 w-4"></i>{supplier.phone}</p>
                    )}
                    {supplier.email && (
                      <p className="text-gray-600 dark:text-gray-400"><i className="fas fa-envelope mr-2 w-4"></i>{supplier.email}</p>
                    )}
                    {supplier.address && (
                      <p className="text-gray-600 dark:text-gray-400"><i className="fas fa-map-marker-alt mr-2 w-4"></i>{supplier.address}</p>
                    )}
                    {supplier.payment_terms && (
                      <p className="text-gray-600 dark:text-gray-400"><i className="fas fa-credit-card mr-2 w-4"></i>{supplier.payment_terms}</p>
                    )}
                    {supplier.notes && (
                      <p className="text-gray-500 dark:text-gray-400 mt-3 text-xs">{supplier.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="e.g. Net 30, COD"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  {editingSupplier ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;