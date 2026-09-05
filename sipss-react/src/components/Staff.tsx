import React, { useState, useEffect } from 'react';
import { getStaff, saveStaff, deleteStaff } from '../utils/db';
import Sidebar from './Sidebar';

interface StaffMember {
  id: number;
  name: string;
  age: number;
  position: string;
  contact_number: string;
  qr_code: string;
  hourly_rate: number;
  created_at: string;
}

interface StaffProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Staff: React.FC<StaffProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    position: '',
    contact_number: '',
    hourly_rate: '',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const loadedStaff = await getStaff();
      setStaff(loadedStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddStaff = () => {
    setEditMode(false);
    setEditingStaff(null);
    setFormData({
      name: '',
      age: '',
      position: '',
      contact_number: '',
      hourly_rate: '',
    });
    setModalVisible(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditMode(true);
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      age: staffMember.age.toString(),
      position: staffMember.position,
      contact_number: staffMember.contact_number,
      hourly_rate: staffMember.hourly_rate.toString(),
    });
    setModalVisible(true);
  };

  const handleDeleteStaff = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id);
        await loadStaff();
        
        setModalType('success');
        setModalTitle('Success');
        setModalMessage('Staff member deleted successfully');
        setModalVisible(true);
      } catch (error) {
        console.error('Error deleting staff:', error);
        setModalType('error');
        setModalTitle('Error');
        setModalMessage('Failed to delete staff member');
        setModalVisible(true);
      }
    }
  };

  const handleSaveStaff = async () => {
    if (!formData.name || !formData.position || !formData.hourly_rate) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Please fill in all required fields');
      setModalVisible(true);
      return;
    }

    try {
      const qrCode = `STAFF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const staffData = {
        name: formData.name,
        age: parseInt(formData.age) || 0,
        position: formData.position,
        contact_number: formData.contact_number,
        qr_code: editMode && editingStaff ? editingStaff.qr_code : qrCode,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
      };

      if (editMode && editingStaff) {
        await saveStaff({ ...staffData, id: editingStaff.id });
      } else {
        await saveStaff(staffData);
      }

      await loadStaff();
      setModalVisible(false);
      
      setModalType('success');
      setModalTitle('Success');
      setModalMessage(editMode ? 'Staff member updated successfully' : 'Staff member added successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving staff:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to save staff member');
      setModalVisible(true);
    }
  };

  const formatCurrency = (value: number) => {
    return '₱' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="staff" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <i className="fas fa-bars text-gray-700 text-xl"></i>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black">Staff Management</h1>
                <p className="text-gray-600 text-sm">Manage employees</p>
              </div>
            </div>
            <button
              onClick={handleAddStaff}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Staff
            </button>
          </div>
        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.length > 0 ? staff.map((staffMember) => (
            <div key={staffMember.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-green-500 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">{staffMember.name}</h3>
                    <p className="text-sm text-gray-500">{staffMember.position}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditStaff(staffMember)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staffMember.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Age:</span>
                  <span className="text-black">{staffMember.age || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact:</span>
                  <span className="text-black">{staffMember.contact_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hourly Rate:</span>
                  <span className="text-black font-medium">{formatCurrency(staffMember.hourly_rate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">QR Code:</span>
                  <span className="text-black font-mono text-xs">{staffMember.qr_code}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-12">
              <i className="fas fa-users text-gray-300 text-4xl mb-4"></i>
              <p className="text-gray-500">No staff members yet</p>
              <button
                onClick={handleAddStaff}
                className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                Add First Staff Member
              </button>
            </div>
          )}
        </div>
      </div>
      </main>

      {/* Add/Edit Staff Modal */}
      {modalVisible && !modalTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">
                {editMode ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Position *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter position"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Contact Number</label>
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Hourly Rate *</label>
                <input
                  type="number"
                  name="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter hourly rate"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setModalVisible(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaff}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                >
                  {editMode ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalVisible && modalTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              {modalType === 'success' && (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-500"></i>
                </div>
              )}
              {modalType === 'error' && (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500"></i>
                </div>
              )}
              {modalType === 'info' && (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-info text-blue-500"></i>
                </div>
              )}
              <h3 className="text-lg font-semibold text-black">{modalTitle}</h3>
            </div>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <button
              onClick={() => setModalVisible(false)}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
