import React, { useState, useEffect } from 'react';
import { useSidebarOpen } from '../hooks/useSidebarOpen';
import { getPayroll, savePayroll, calculatePayrollForPeriod, getStaff, getAttendance, deletePayroll, restorePayroll, getDeletedPayroll, onSynced } from '../utils/db';
import Sidebar from './Sidebar';
import Header from './Header';

interface PayrollRecord {
  id: number;
  staff_id: number;
  staff_name: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  total_break_hours: number;
  net_hours: number;
  gross_pay: number;
  deductions: number;
  late_deductions: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  net_pay: number;
  status: string;
  deleted_at: string | null;
  created_at: string;
}

interface Staff {
  id: number;
  name: string;
  position: string;
  hourly_rate: number;
}

interface PayrollProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Payroll: React.FC<PayrollProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [deletedPayroll, setDeletedPayroll] = useState<PayrollRecord[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1-15' | '16-30' | '16-31'>('1-15');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [previewPayroll, setPreviewPayroll] = useState<any>(null);
  const [staffAttendance, setStaffAttendance] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const reload = () => { loadPayroll(); loadDeletedPayroll(); loadStaff(); };
    reload();
    return onSynced(reload);
  }, []);

  const loadPayroll = async () => {
    try {
      const loadedPayroll = await getPayroll();
      setPayroll(loadedPayroll);
    } catch (error) {
      console.error('Error loading payroll:', error);
    }
  };

  const loadDeletedPayroll = async () => {
    try {
      const loadedDeletedPayroll = await getDeletedPayroll();
      setDeletedPayroll(loadedDeletedPayroll);
    } catch (error) {
      console.error('Error loading deleted payroll:', error);
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

  const getPeriodDates = () => {
    const year = selectedYear;
    const month = selectedMonth;
    
    if (selectedPeriod === '1-15') {
      return {
        start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        end: `${year}-${String(month + 1).padStart(2, '0')}-15`
      };
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate();
      return {
        start: `${year}-${String(month + 1).padStart(2, '0')}-16`,
        end: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`
      };
    }
  };

  const handleGeneratePayroll = async () => {
    if (!selectedStaff) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Please select a staff member');
      setModalVisible(true);
      return;
    }

    setGenerating(true);
    try {
      const { start, end } = getPeriodDates();
      const staffMember = staff.find(s => s.id === selectedStaff);
      if (!staffMember) {
        throw new Error('Staff record not found. Please re-select the staff member.');
      }
      // Load this staff member's attendance for the calendar view
      const attendance = await getAttendance();
      setStaffAttendance(attendance.filter((a: any) => a.staff_id === selectedStaff));

      const payrollData = await calculatePayrollForPeriod(selectedStaff, start, end);
      setPreviewPayroll(payrollData);
      setGenerateModalVisible(true);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(error instanceof Error ? error.message : 'Failed to load attendance data');
      setModalVisible(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmPayroll = async () => {
    if (!selectedStaff || generating) return;

    setGenerating(true);
    try {
      const { start, end } = getPeriodDates();
      const payrollData = await calculatePayrollForPeriod(selectedStaff, start, end);
      await savePayroll(payrollData);
      await loadPayroll();
      setGenerateModalVisible(false);
      setPreviewPayroll(null);

      setModalType('success');
      setModalTitle('Success');
      setModalMessage('Payroll generated successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error generating payroll:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(error instanceof Error ? error.message : 'Failed to generate payroll. Please try again.');
      setModalVisible(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (payrollId: number, newStatus: string) => {
    try {
      const payrollRecord = payroll.find(p => p.id === payrollId);
      if (payrollRecord) {
        const updatedRecord = { ...payrollRecord, status: newStatus };
        await savePayroll(updatedRecord);
        await loadPayroll();
        
        setModalType('success');
        setModalTitle('Success');
        setModalMessage(`Payroll marked as ${newStatus}`);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error updating payroll status:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to update payroll status');
      setModalVisible(true);
    }
  };

  const handleDeletePayroll = async (id: number) => {
    try {
      await deletePayroll(id);
      await loadPayroll();
      await loadDeletedPayroll();
      
      setModalType('success');
      setModalTitle('Success');
      setModalMessage('Payroll record deleted successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error deleting payroll:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to delete payroll');
      setModalVisible(true);
    }
  };

  const handleRestorePayroll = async (id: number) => {
    try {
      await restorePayroll(id);
      await loadPayroll();
      await loadDeletedPayroll();
      
      setModalType('success');
      setModalTitle('Success');
      setModalMessage('Payroll record restored successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error restoring payroll:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to restore payroll');
      setModalVisible(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return '₱' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatHours = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // --- Attendance calendar helpers (ported from sipss-native payroll) --------

  // Attendance `date` values are 'YYYY-MM-DD' strings; compare on a consistent
  // UTC key so local timezone offsets can't shift a record onto another day.
  const dateKey = (d: Date) => d.toISOString().split('T')[0];

  const getDaysInPeriod = () => {
    const { start, end } = getPeriodDates();
    const days: Date[] = [];
    const current = new Date(start + 'T00:00:00Z');
    const endDate = new Date(end + 'T00:00:00Z');
    while (current <= endDate) {
      days.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
  };

  const getAttendanceStatus = (day: Date): 'present' | 'absent' | 'late' => {
    const record = staffAttendance.find((a: any) => a.date === dateKey(day));
    if (!record || !record.time_in) return 'absent';
    // Same rule as calculatePayrollForPeriod: time-in after 9:00 AM is late
    const [h, m] = String(record.time_in).split(':').map(Number);
    return h >= 9 && m > 0 ? 'late' : 'present';
  };

  const getAttendanceCount = () => {
    let present = 0, absent = 0, late = 0;
    getDaysInPeriod().forEach(day => {
      const status = getAttendanceStatus(day);
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else absent++;
    });
    return { present, absent, late };
  };

  const displayedPayroll = showDeleted ? deletedPayroll : payroll;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="payroll" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Header title="Payroll" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`px-4 py-2 rounded-lg transition ${showDeleted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-black dark:text-white'}`}
              >
                {showDeleted ? 'Show Active' : 'Show Deleted'}
              </button>
              <button
                onClick={() => { setPreviewPayroll(null); setGenerateModalVisible(true); }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <i className="fas fa-plus mr-2"></i>
                Generate Payroll
              </button>
            </div>
          </div>
        {/* Payroll List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedPayroll.length > 0 ? displayedPayroll.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{record.staff_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                      {formatDate(record.period_start)} - {formatDate(record.period_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                      {formatHours(record.net_hours)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                      {formatCurrency(record.gross_pay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                      {formatCurrency(record.deductions + record.late_deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">
                      {formatCurrency(record.net_pay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.status === 'paid' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800' :
                        record.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {!showDeleted ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(record.id, record.status === 'pending' ? 'paid' : 'pending')}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                              title="Toggle Status"
                            >
                              <i className="fas fa-sync-alt"></i>
                            </button>
                            <button
                              onClick={() => handleDeletePayroll(record.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestorePayroll(record.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                            title="Restore"
                          >
                            <i className="fas fa-undo"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No payroll records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </main>

      {/* Generate Payroll Modal */}
      {generateModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white">Generate Payroll</h3>
              <button
                onClick={() => { setGenerateModalVisible(false); setPreviewPayroll(null); }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {!previewPayroll ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Staff Member</label>
                  <select
                    value={selectedStaff || ''}
                    onChange={(e) => setSelectedStaff(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select staff member</option>
                    {staff.map((staffMember) => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.name} - {staffMember.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {monthNames.map((name, index) => (
                        <option key={index} value={index}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Pay Period</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="1-15"
                        checked={selectedPeriod === '1-15'}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="mr-2"
                      />
                      1st - 15th
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="16-30"
                        checked={selectedPeriod === '16-30'}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="mr-2"
                      />
                      16th - 30th/31st
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePayroll}
                  disabled={generating}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white py-2 rounded-lg transition"
                >
                  {generating ? 'Generating preview...' : 'Preview Payroll'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Attendance Calendar (from sipss-native) */}
                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                  <h4 className="font-semibold text-black dark:text-white mb-1">
                    {staff.find(s => s.id === selectedStaff)?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {monthNames[selectedMonth]} {selectedYear} — {selectedPeriod === '1-15' ? '1st–15th' : '16th–End'}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="flex items-center gap-2 text-black dark:text-white">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                      Present: {getAttendanceCount().present}
                    </span>
                    <span className="flex items-center gap-2 text-black dark:text-white">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                      Absent: {getAttendanceCount().absent}
                    </span>
                    <span className="flex items-center gap-2 text-black dark:text-white">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                      Late: {getAttendanceCount().late}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
                    {getDaysInPeriod().map((day, index) => {
                      const status = getAttendanceStatus(day);
                      const record = staffAttendance.find((a: any) => a.date === dateKey(day));
                      const circleColor =
                        status === 'present' ? 'bg-green-500 text-white' :
                        status === 'late' ? 'bg-yellow-500 text-white' :
                        'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
                      return (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${circleColor}`}>
                            {day.getUTCDate()}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}
                          </span>
                          {record?.time_in && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{record.time_in}</span>
                          )}
                          {status === 'late' && (
                            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Late</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Absence Report */}
                {getAttendanceCount().absent > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">Absence Report</h4>
                    <div className="space-y-1 text-sm">
                      {getDaysInPeriod()
                        .filter(day => getAttendanceStatus(day) === 'absent')
                        .map((day, index) => (
                          <div key={index} className="flex justify-between text-red-600 dark:text-red-400">
                            <span>{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                            <span>Absent</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Late Arrivals Report */}
                {getAttendanceCount().late > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Late Arrivals Report</h4>
                    <div className="space-y-1 text-sm">
                      {getDaysInPeriod()
                        .filter(day => getAttendanceStatus(day) === 'late')
                        .map((day, index) => {
                          const record = staffAttendance.find((a: any) => a.date === dateKey(day));
                          return (
                            <div key={index} className="flex justify-between text-yellow-700 dark:text-yellow-400">
                              <span>{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                              <span>Time in: {record?.time_in}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                  <h4 className="font-semibold text-black dark:text-white mb-4">Payroll Preview</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Staff Name</p>
                      <p className="font-medium text-black dark:text-white">{previewPayroll.staff_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Period</p>
                      <p className="font-medium text-black dark:text-white">{formatDate(previewPayroll.period_start)} - {formatDate(previewPayroll.period_end)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Hours</p>
                      <p className="font-medium text-black dark:text-white">{formatHours(previewPayroll.total_hours)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Break Hours</p>
                      <p className="font-medium text-black dark:text-white">{formatHours(previewPayroll.total_break_hours)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Net Hours</p>
                      <p className="font-medium text-black dark:text-white">{formatHours(previewPayroll.net_hours)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Hourly Rate</p>
                      <p className="font-medium text-black dark:text-white">
                        {formatCurrency(
                          (staff.find(s => s.id === selectedStaff)?.hourly_rate ?? 0) > 0
                            ? staff.find(s => s.id === selectedStaff)!.hourly_rate
                            : 56
                        )}/hr
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Days Present</p>
                      <p className="font-medium text-black dark:text-white">{previewPayroll.days_present}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Days Absent</p>
                      <p className="font-medium text-black dark:text-white">{previewPayroll.days_absent}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Days Late</p>
                      <p className="font-medium text-black dark:text-white">{previewPayroll.days_late}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Gross Pay</p>
                      <p className="font-medium text-black dark:text-white">{formatCurrency(previewPayroll.gross_pay)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Late Deductions</p>
                      <p className="font-medium text-black dark:text-white">{formatCurrency(previewPayroll.late_deductions)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Deductions</p>
                      <p className="font-medium text-black dark:text-white">{formatCurrency(previewPayroll.deductions + previewPayroll.late_deductions)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Net Pay</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(previewPayroll.net_pay)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setPreviewPayroll(null)}
                    className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-black dark:text-white py-2 rounded-lg transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPayroll}
                    disabled={generating}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white py-2 rounded-lg transition"
                  >
                    {generating ? 'Saving...' : 'Confirm & Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalVisible && (
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

export default Payroll;
