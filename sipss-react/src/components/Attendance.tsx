import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getAttendance, saveAttendance, getStaff, getStaffByQRCode, getStaffById, saveStaff, initDatabase } from '../utils/db';
import Sidebar from './Sidebar';
import Header from './Header';

interface AttendanceRecord {
  id: number;
  staff_id: number;
  staff_name: string;
  date: string;
  time_in: string | null;
  break_start: string | null;
  break_end: string | null;
  time_out: string | null;
  overtime_start: string | null;
  overtime_end: string | null;
  notes: string;
  created_at: string;
}

interface Staff {
  id: number;
  name: string;
  age: number;
  position: string;
  contact_number: string;
  qr_code: string;
  hourly_rate: number;
  created_at: string;
}

interface AttendanceProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const Attendance: React.FC<AttendanceProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const attendanceRef = useRef<AttendanceRecord[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'none' | 'clocked_in' | 'on_break' | 'on_overtime'>('none');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrInput, setQrInput] = useState('');
  const [showStaffName, setShowStaffName] = useState(false);
  const [staffNameDisplay, setStaffNameDisplay] = useState('');
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [qrListModalVisible, setQrListModalVisible] = useState(false);
  const [selectedQRStaff, setSelectedQRStaff] = useState<Staff | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const html5QrCode = useRef<Html5Qrcode | null>(null);
  const readerId = 'qr-reader';
  const [registerFormData, setRegisterFormData] = useState({
    name: '',
    age: '',
    position: '',
    contact_number: '',
    hourly_rate: '',
  });

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      await loadAttendance();
      await loadStaff();
      await loadStaffSession();
    };
    initialize();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      if (html5QrCode.current) {
        html5QrCode.current.stop().catch(() => {}).then(() => {
          html5QrCode.current?.clear();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAttendance = async () => {
    try {
      const loadedAttendance = await getAttendance();
      console.log('loadAttendance loaded:', loadedAttendance);
      setAttendance(loadedAttendance);
      attendanceRef.current = loadedAttendance;
    } catch (error) {
      console.error('Error loading attendance:', error);
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

  const loadStaffSession = async () => {
    try {
      const today = getTodayDateString();
      const attendanceList = await getAttendance();
      const todayRecord = attendanceList.find((a: AttendanceRecord) =>
        a.date === today && a.time_in && !a.time_out
      );

      if (todayRecord) {
        const staffMember = await getStaffById(todayRecord.staff_id);
        if (staffMember) {
          setSelectedStaff(staffMember);
          await checkTodayStatus(staffMember);
        }
      }
    } catch (error) {
      console.error('Error loading staff session:', error);
    }
  };

  const checkTodayStatus = async (staffMember: Staff) => {
    try {
      const attendanceList = await getAttendance();
      const today = getTodayDateString();
      const todayRecord = attendanceList.find((a: AttendanceRecord) =>
        a.staff_id === staffMember.id && a.date === today
      );

      if (!todayRecord) {
        setAttendanceStatus('none');
      } else if (todayRecord.overtime_start && !todayRecord.overtime_end) {
        setAttendanceStatus('on_overtime');
      } else if (todayRecord.break_start && !todayRecord.break_end) {
        setAttendanceStatus('on_break');
      } else if (todayRecord.time_in && !todayRecord.time_out) {
        setAttendanceStatus('clocked_in');
      } else {
        setAttendanceStatus('none');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDuration = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn || !timeOut) return '-';

    const [inHours, inMinutes] = timeIn.split(':').map(Number);
    const [outHours, outMinutes] = timeOut.split(':').map(Number);

    const inDate = new Date();
    inDate.setHours(inHours, inMinutes);

    const outDate = new Date();
    outDate.setHours(outHours, outMinutes);

    const diffMs = outDate.getTime() - inDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0 && diffMinutes === 0) return '0m';
    if (diffHours === 0) return `${diffMinutes}m`;
    if (diffMinutes === 0) return `${diffHours}h`;
    return `${diffHours}h ${diffMinutes}m`;
  };

  const calculateOvertimeDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '-';

    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);

    const startDate = new Date();
    startDate.setHours(startHours, startMinutes);

    const endDate = new Date();
    endDate.setHours(endHours, endMinutes);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0 && diffMinutes === 0) return '0m';
    if (diffHours === 0) return `${diffMinutes}m`;
    if (diffMinutes === 0) return `${diffHours}h`;
    return `${diffHours}h ${diffMinutes}m`;
  };

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleClockIn = async (staffMember: Staff) => {
    try {
      const today = getTodayDateString();
      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      await saveAttendance({
        staff_id: staffMember.id,
        staff_name: staffMember.name,
        date: today,
        time_in: now,
        break_start: null,
        break_end: null,
        time_out: null,
        overtime_start: null,
        overtime_end: null,
        notes: '',
        created_at: new Date().toISOString(),
      });

      await loadAttendance();
      await checkTodayStatus(staffMember);

      showModal('success', 'Time In', `Time in at ${now}`);
    } catch (error) {
      console.error('Error clocking in:', error);
      showModal('error', 'Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleBreakStart = async (record: AttendanceRecord) => {
    try {
      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      console.log('handleBreakStart record:', record, 'break_start:', now);
      const saved = await saveAttendance({
        ...record,
        break_start: now,
      });
      console.log('handleBreakStart saveAttendance result:', saved);

      await loadAttendance();
      if (selectedStaff) {
        await checkTodayStatus(selectedStaff);
      }

      showModal('success', 'Break Start', `Break started at ${now}`);
    } catch (error) {
      console.error('Error starting break:', error);
      showModal('error', 'Error', 'Failed to start break. Please try again.');
    }
  };

  const handleBreakEnd = async (record: AttendanceRecord) => {
    try {
      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      await saveAttendance({
        ...record,
        break_end: now,
      });

      await loadAttendance();
      if (selectedStaff) {
        await checkTodayStatus(selectedStaff);
      }

      showModal('success', 'Break End', `Break ended at ${now}`);
    } catch (error) {
      console.error('Error ending break:', error);
      showModal('error', 'Error', 'Failed to end break. Please try again.');
    }
  };

  const handleClockOut = async (record: AttendanceRecord) => {
    try {
      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      await saveAttendance({
        ...record,
        time_out: now,
      });

      await loadAttendance();
      if (selectedStaff) {
        await checkTodayStatus(selectedStaff);
      }

      showModal('success', 'Time Out', `Clocked out at ${now}`);
    } catch (error) {
      console.error('Error clocking out:', error);
      showModal('error', 'Error', 'Failed to clock out. Please try again.');
    }
  };

  const handleOvertimeStart = async (record: AttendanceRecord) => {
    try {
      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      await saveAttendance({
        ...record,
        overtime_start: now,
      });

      await loadAttendance();
      if (selectedStaff) {
        await checkTodayStatus(selectedStaff);
      }

      showModal('success', 'Overtime Start', `Overtime started at ${now}`);
    } catch (error) {
      console.error('Error starting overtime:', error);
      showModal('error', 'Error', 'Failed to start overtime. Please try again.');
    }
  };

  const handleOvertimeEnd = async (record: AttendanceRecord) => {
    try {
      const now = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      await saveAttendance({
        ...record,
        overtime_end: now,
      });

      await loadAttendance();
      if (selectedStaff) {
        await checkTodayStatus(selectedStaff);
      }

      showModal('success', 'Overtime End', `Overtime ended at ${now}`);
    } catch (error) {
      console.error('Error ending overtime:', error);
      showModal('error', 'Error', 'Failed to end overtime. Please try again.');
    }
  };

  const handleStaffSelect = async (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    await checkTodayStatus(staffMember);
  };

  const getTodayRecord = useCallback((staffId: number) => {
    const today = getTodayDateString();
    return attendanceRef.current.find((a: AttendanceRecord) =>
      a.staff_id === staffId && a.date === today
    );
  }, []);

  const nextActionText = useMemo(() => {
    if (!selectedStaff) return 'Clock In';
    const today = getTodayDateString();
    const todayRecord = attendance.find((a: AttendanceRecord) =>
      a.staff_id === selectedStaff.id && a.date === today
    );

    if (!todayRecord) return 'Clock In';
    if (!todayRecord.break_start) return 'Start Break';
    if (!todayRecord.break_end) return 'End Break';
    if (!todayRecord.time_out) return 'Clock Out';
    if (!todayRecord.overtime_start) return 'Start Overtime';
    if (!todayRecord.overtime_end) return 'End Overtime';
    return 'Completed';
  }, [attendance, selectedStaff]);

  const actionButtonColor = useMemo(() => {
    switch (nextActionText) {
      case 'Clock In':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Start Break':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'End Break':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Clock Out':
        return 'bg-red-500 hover:bg-red-600';
      case 'Start Overtime':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'End Overtime':
        return 'bg-indigo-500 hover:bg-indigo-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }, [nextActionText]);

  const handleAction = async () => {
    if (!selectedStaff) return;

    await loadAttendance();
    const todayRecord = getTodayRecord(selectedStaff.id);
    console.log('handleAction todayRecord:', todayRecord);

    if (!todayRecord) {
      await handleClockIn(selectedStaff);
    } else if (!todayRecord.break_start) {
      await handleBreakStart(todayRecord);
    } else if (!todayRecord.break_end) {
      await handleBreakEnd(todayRecord);
    } else if (!todayRecord.time_out) {
      await handleClockOut(todayRecord);
    } else if (!todayRecord.overtime_start) {
      await handleOvertimeStart(todayRecord);
    } else if (!todayRecord.overtime_end) {
      await handleOvertimeEnd(todayRecord);
    } else {
      showModal('info', 'Already Completed', 'You have already completed all attendance actions for today');
    }
  };

  const handleScanCode = async (code: string) => {
    const trimmedQRCode = code.trim();
    if (!trimmedQRCode) return;

    try {
      const staffMember = await getStaffByQRCode(trimmedQRCode);

      if (!staffMember) {
        showModal('error', 'Error', `Staff not found. Scanned: ${trimmedQRCode}`);
        return;
      }

      console.log('handleScanCode staffMember:', staffMember, 'scanned:', trimmedQRCode);
      setSelectedStaff(staffMember);
      await loadAttendance();
      const todayRecord = getTodayRecord(staffMember.id);
      console.log('handleScanCode todayRecord:', todayRecord);

      if (!todayRecord) {
        await handleClockIn(staffMember);
      } else if (!todayRecord.break_start) {
        await handleBreakStart(todayRecord);
      } else if (!todayRecord.break_end) {
        await handleBreakEnd(todayRecord);
      } else if (!todayRecord.time_out) {
        await handleClockOut(todayRecord);
      } else if (!todayRecord.overtime_start) {
        await handleOvertimeStart(todayRecord);
      } else if (!todayRecord.overtime_end) {
        await handleOvertimeEnd(todayRecord);
      } else {
        showModal('info', 'Already Completed', 'You have already completed all attendance scans for today');
      }

      await checkTodayStatus(staffMember);
      setStaffNameDisplay(staffMember.name);
      setShowStaffName(true);
      setQrInput('');
      setTimeout(() => {
        setShowStaffName(false);
      }, 2000);
    } catch (error) {
      console.error('Error reading QR code:', error);
      showModal('error', 'Error', 'Failed to read QR code. Please try again.');
    }
  };

  const handleScanQR = () => {
    handleScanCode(qrInput);
  };

  const startScanner = async () => {
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        showModal('error', 'Error', 'No camera found on this device.');
        return;
      }

      // Prefer the laptop's built-in webcam. Avoid phone-as-webcam, virtual, and mobile cameras if possible.
      const avoidCameraPattern = /mobile|phone|droidcam|camo|epoccam|ivcam|android|iphone|remote|virtual|windows virtual|wireless/i;
      const preferredCamera =
        cameras.find((c) => /webcam|integrated|built-in|camera/i.test(c.label) && !avoidCameraPattern.test(c.label)) ||
        cameras.find((c) => !avoidCameraPattern.test(c.label)) ||
        cameras[0];

      console.log('Available cameras:', cameras.map((c) => ({ id: c.id, label: c.label })));
      console.log('Selected camera:', preferredCamera);

      html5QrCode.current = new Html5Qrcode(readerId);
      await html5QrCode.current.start(
        preferredCamera.id,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await stopScanner();
          await handleScanCode(decodedText);
        },
        undefined
      );
      setScannerActive(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
      showModal('error', 'Error', 'Could not start camera. Please allow camera access and reload.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCode.current) {
      try {
        await html5QrCode.current.stop();
        await html5QrCode.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      } finally {
        html5QrCode.current = null;
      }
    }
    setScannerActive(false);
  };

  const handleRegisterStaff = async () => {
    if (!registerFormData.name || !registerFormData.position) {
      showModal('error', 'Error', 'Name and position are required');
      return;
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const nameHash = registerFormData.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const qrCode = `STAFF-${timestamp}-${randomString}-${nameHash}`;

      const newStaff = {
        name: registerFormData.name,
        age: parseInt(registerFormData.age) || 0,
        position: registerFormData.position,
        contact_number: registerFormData.contact_number,
        qr_code: qrCode,
        hourly_rate: parseFloat(registerFormData.hourly_rate) || 56.25,
        created_at: new Date().toISOString(),
      };

      const savedStaff = await saveStaff(newStaff);

      setRegisterFormData({
        name: '',
        age: '',
        position: '',
        contact_number: '',
        hourly_rate: '',
      });
      setRegisterModalVisible(false);
      await loadStaff();
      setSelectedQRStaff(savedStaff);
      setQrListModalVisible(true);
      showModal('success', 'Success', 'Staff registered successfully');
    } catch (error) {
      console.error('Error registering staff:', error);
      showModal('error', 'Error', 'Failed to register staff. Please try again.');
    }
  };

  const handlePrintQRCode = (staffMember: Staff) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code for ${staffMember.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .qr-container {
                border: 2px solid #333;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                background: white;
              }
              .staff-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
              .staff-position { font-size: 16px; color: #666; margin-bottom: 20px; }
              .qr-code { margin: 20px 0; }
              .instructions { font-size: 12px; color: #999; margin-top: 20px; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="staff-name">${staffMember.name}</div>
              <div class="staff-position">${staffMember.position}</div>
              <div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(staffMember.qr_code)}" alt="QR Code" />
              </div>
              <div class="instructions">Scan this QR code to mark attendance</div>
            </div>
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const todayAttendance = attendance.filter((a: AttendanceRecord) =>
    a.date === getTodayDateString()
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentView="attendance"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Header title="Attendance" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setQrListModalVisible(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <i className="fas fa-qrcode"></i>
                <span>View QR Codes</span>
              </button>
              <button
                onClick={() => setRegisterModalVisible(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <i className="fas fa-user-plus"></i>
                <span>Register Staff</span>
              </button>
              <div className="text-right ml-auto">
                <div className="text-2xl font-bold text-black dark:text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Staff Name Display */}
          {showStaffName && (
            <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clock text-3xl text-white"></i>
              </div>
              <p className="text-2xl font-bold">{staffNameDisplay}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* QR Scanner */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black dark:text-white mb-4">QR Scanner</h2>
                <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4" style={{ minHeight: '250px' }}>
                  <div id={readerId} className="absolute inset-0"></div>
                  {!scannerActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none">
                      <i className="fas fa-camera text-4xl mb-2"></i>
                      <p className="text-sm">Camera preview will appear here</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {!scannerActive ? (
                    <button
                      onClick={startScanner}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-2"
                    >
                      <i className="fas fa-camera"></i>
                      <span>Scan QR Code</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScanner}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-2"
                    >
                      <i className="fas fa-stop"></i>
                      <span>Stop Camera</span>
                    </button>
                  )}
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">or</div>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Enter or paste QR code data"
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleScanQR}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-2"
                  >
                    <i className="fas fa-keyboard"></i>
                    <span>Submit Code</span>
                  </button>
                </div>
              </div>

              {/* Staff Selection */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Select Staff</h2>
                <div className="space-y-2">
                  {staff.length > 0 ? staff.map((staffMember) => (
                    <button
                      key={staffMember.id}
                      onClick={() => handleStaffSelect(staffMember)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        selectedStaff?.id === staffMember.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-blue-500 dark:text-blue-400"></i>
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">{staffMember.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{staffMember.position}</p>
                        </div>
                      </div>
                    </button>
                  )) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No staff members available</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {selectedStaff && (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Quick Actions</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                      <div>
                        <p className="font-medium text-black dark:text-white">{selectedStaff.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Status: {attendanceStatus.replace('_', ' ').toUpperCase()}</p>
                      </div>
                      <button
                        onClick={handleAction}
                        className={`px-6 py-2 text-white rounded-lg transition ${actionButtonColor}`}
                      >
                        {nextActionText}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Attendance */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Today's Attendance</h2>
                {todayAttendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time In</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Break</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Out</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">OT Start</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">OT End</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {todayAttendance.map((record) => {
                          const status = !record.time_in
                            ? 'not_clocked_in'
                            : record.overtime_end
                            ? 'completed'
                            : record.overtime_start
                            ? 'on_overtime'
                            : record.break_start && !record.break_end
                            ? 'on_break'
                            : record.time_out
                            ? 'completed'
                            : 'clocked_in';
                          return (
                            <tr key={record.id}>
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-black dark:text-white">{record.staff_name}</td>
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">{record.time_in || '-'}</td>
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                                {record.break_start && record.break_end
                                  ? `${record.break_start}-${record.break_end}`
                                  : record.break_start
                                  ? 'On break'
                                  : '-'}
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{record.time_out || '-'}</td>
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-purple-600">{record.overtime_start || '-'}</td>
                              <td className="px-2 py-4 whitespace-nowrap text-sm text-indigo-600">{record.overtime_end || '-'}</td>
                              <td className="px-2 py-4 whitespace-nowrap text-sm">
                                {status === 'completed' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 rounded-full">Completed</span>
                                ) : status === 'on_overtime' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">On Overtime</span>
                                ) : status === 'on_break' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full">On Break</span>
                                ) : status === 'clocked_in' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 rounded-full">Clocked In</span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full">Not Clocked In</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-clock text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500 dark:text-gray-400">No attendance records for today</p>
                  </div>
                )}
              </div>

              {/* Recent Attendance History */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Recent History</h2>
                <div className="space-y-3">
                  {attendance.slice(-10).reverse().map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                      <div>
                        <p className="font-medium text-black dark:text-white">{record.staff_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(record.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-black dark:text-white">{record.time_in || '--:--'} - {record.time_out || '--:--'}</p>
                        {record.overtime_start && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            OT: {record.overtime_start} - {record.overtime_end || '--:--'}
                            {record.overtime_end && (
                              <span className="text-purple-600 ml-1">({calculateOvertimeDuration(record.overtime_start, record.overtime_end)})</span>
                            )}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {record.time_out ? (
                            <span className="text-blue-600 dark:text-blue-400">Completed ({calculateDuration(record.time_in, record.time_out)})</span>
                          ) : (
                            <span className="text-yellow-600 dark:text-yellow-400">In Progress</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Register Staff Modal */}
      {registerModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-plus text-blue-500 dark:text-blue-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white">Register New Staff</h3>
              </div>
              <button
                onClick={() => setRegisterModalVisible(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={registerFormData.name}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={registerFormData.age}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, age: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <input
                  type="text"
                  value={registerFormData.position}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, position: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter position (e.g., Barista, Cashier)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={registerFormData.contact_number}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, contact_number: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₱)</label>
                <input
                  type="number"
                  value={registerFormData.hourly_rate}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, hourly_rate: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hourly rate (default: 56.25)"
                />
              </div>
              <button
                onClick={handleRegisterStaff}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
              >
                Register Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Codes Modal */}
      {qrListModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white">Staff QR Codes</h3>
              <button
                onClick={() => { setQrListModalVisible(false); setSelectedQRStaff(null); }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {!selectedQRStaff ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.length > 0 ? staff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    onClick={() => setSelectedQRStaff(staffMember)}
                    className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{staffMember.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-black dark:text-white">{staffMember.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{staffMember.position}</p>
                      </div>
                    </div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(staffMember.qr_code)}`}
                      alt={`QR code for ${staffMember.name}`}
                      className="mx-auto"
                    />
                  </div>
                )) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center col-span-2">No staff members found</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedQRStaff.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-black dark:text-white text-lg">{selectedQRStaff.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{selectedQRStaff.position}</p>
                  </div>
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedQRStaff.qr_code)}`}
                  alt={`QR code for ${selectedQRStaff.name}`}
                  className="mx-auto mb-4"
                />
                <p className="text-gray-500 dark:text-gray-400 mb-6">Scan this QR code to mark attendance</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handlePrintQRCode(selectedQRStaff)}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center space-x-2"
                  >
                    <i className="fas fa-print"></i>
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedQRStaff(null)}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                  >
                    Back
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

export default Attendance;
