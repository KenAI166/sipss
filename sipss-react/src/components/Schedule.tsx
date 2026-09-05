import React, { useState, useEffect } from 'react';
import { getSchedules, saveSchedule, deleteSchedule, getStaff } from '../utils/db';
import Sidebar from './Sidebar';
import Header from './Header';

interface ScheduleItem {
  id: number;
  staff_id: number;
  staff_name: string;
  date: string;
  shift_start: string;
  shift_end: string;
  notes: string;
}

interface Staff {
  id: number;
  name: string;
  age: number;
  position: string;
  contact_number: string;
  qr_code: string;
  hourly_rate: number;
}

interface ScheduleProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const [formData, setFormData] = useState({
    staff_id: '',
    date: selectedDate,
    shift_start: '',
    shift_end: '',
    notes: '',
  });

  useEffect(() => {
    loadSchedules();
    loadStaff();
  }, [selectedDate]);

  const loadSchedules = async () => {
    try {
      const loadedSchedules = await getSchedules();
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadStaff = async () => {
    try {
      const loadedStaff = await getStaff();
      setStaff(loadedStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSchedule = () => {
    setEditMode(false);
    setEditingSchedule(null);
    setFormData({
      staff_id: '',
      date: selectedDate,
      shift_start: '',
      shift_end: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    setEditMode(true);
    setEditingSchedule(schedule);
    setFormData({
      staff_id: schedule.staff_id.toString(),
      date: schedule.date,
      shift_start: schedule.shift_start,
      shift_end: schedule.shift_end,
      notes: schedule.notes || '',
    });
    setModalVisible(true);
  };

  const handleDeleteSchedule = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(id);
        await loadSchedules();
        
        setModalType('success');
        setModalTitle('Success');
        setModalMessage('Schedule deleted successfully');
        setModalVisible(true);
      } catch (error) {
        console.error('Error deleting schedule:', error);
        setModalType('error');
        setModalTitle('Error');
        setModalMessage('Failed to delete schedule');
        setModalVisible(true);
      }
    }
  };

  const handleSaveSchedule = async () => {
    if (!formData.staff_id || !formData.date || !formData.shift_start || !formData.shift_end) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Please fill in all required fields');
      setModalVisible(true);
      return;
    }

    try {
      const staffMember = staff.find(s => s.id === parseInt(formData.staff_id));
      const scheduleData = {
        staff_id: parseInt(formData.staff_id),
        staff_name: staffMember?.name || '',
        date: formData.date,
        shift_start: formData.shift_start,
        shift_end: formData.shift_end,
        notes: formData.notes,
      };

      if (editMode && editingSchedule) {
        await saveSchedule({ ...scheduleData, id: editingSchedule.id });
      } else {
        await saveSchedule(scheduleData);
      }

      await loadSchedules();
      setModalVisible(false);
      
      setModalType('success');
      setModalTitle('Success');
      setModalMessage(editMode ? 'Schedule updated successfully' : 'Schedule added successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving schedule:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to save schedule');
      setModalVisible(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getFilteredSchedules = () => {
    if (selectedDate) {
      return schedules.filter(schedule => schedule.date === selectedDate);
    }
    return schedules;
  };

  const filteredSchedules = getFilteredSchedules();

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="schedule" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Header title="Schedule" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'}`}
              >
                <i className="fas fa-list mr-2"></i>
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition ${viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'}`}
              >
                <i className="fas fa-calendar mr-2"></i>
                Calendar View
              </button>
              <button
                onClick={handleAddSchedule}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Schedule
              </button>
            </div>
          </div>
        {/* Date Selector */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-black dark:text-white">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDate && formatDate(selectedDate)}
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* List View */
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shift Start</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shift End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSchedules.length > 0 ? filteredSchedules.map((schedule) => {
                    const start = new Date(`2000-01-01 ${schedule.shift_start}`);
                    const end = new Date(`2000-01-01 ${schedule.shift_end}`);
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    
                    return (
                      <tr key={schedule.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">{schedule.staff_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{formatDate(schedule.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{formatTime(schedule.shift_start)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{formatTime(schedule.shift_end)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{duration.toFixed(1)}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{schedule.notes || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditSchedule(schedule)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No schedules found for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Weekly Overview</h3>
            <div className="grid grid-cols-7 gap-4">
              {weekDates.map((date) => {
                const daySchedules = schedules.filter(s => s.date === date);
                const dateObj = new Date(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={date}
                    className={`p-3 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'}`}
                  >
                    <div className="text-center mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-black dark:text-white'}`}>
                        {dateObj.getDate()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {daySchedules.slice(0, 3).map((schedule) => (
                        <div
                          key={schedule.id}
                          className="text-xs p-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 rounded truncate"
                          title={`${schedule.staff_name}: ${formatTime(schedule.shift_start)} - ${formatTime(schedule.shift_end)}`}
                        >
                          {schedule.staff_name}
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{daySchedules.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </main>

      {/* Add/Edit Schedule Modal */}
      {modalVisible && !modalTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {editMode ? 'Edit Schedule' : 'Add Schedule'}
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Staff Member *</label>
                <select
                  name="staff_id"
                  value={formData.staff_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select staff member</option>
                  {staff.map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.name} - {staffMember.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Shift Start *</label>
                  <input
                    type="time"
                    name="shift_start"
                    value={formData.shift_start}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Shift End *</label>
                  <input
                    type="time"
                    name="shift_end"
                    value={formData.shift_end}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setModalVisible(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-black dark:text-white py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
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
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              {modalType === 'success' && (
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-blue-500 dark:text-blue-400"></i>
                </div>
              )}
              {modalType === 'error' && (
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500"></i>
                </div>
              )}
              {modalType === 'info' && (
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-info text-blue-500 dark:text-blue-400"></i>
                </div>
              )}
              <h3 className="text-lg font-semibold text-black dark:text-white">{modalTitle}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{modalMessage}</p>
            <button
              onClick={() => setModalVisible(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
