import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AttendanceRecord, CameraDevice } from './types';
import { QrCodeIcon, CameraIcon, StopIcon, UploadIcon, ExcelIcon, PdfIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, SearchIcon } from './components/Icons';
import DashboardCard from './components/DashboardCard';
import AttendanceItem from './components/AttendanceItem';
import EditModal from './components/EditModal';
import ConfirmModal from './components/ConfirmModal';
import DatePicker from './components/DatePicker';

// Audio context for the beep sound - create it once.
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playSuccessSound = () => {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Start with a low volume

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.15);
};


const App: React.FC = () => {
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [currentQRData, setCurrentQRData] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [showSelection, setShowSelection] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
    const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);


    const html5QrCodeRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect for initializing data from localStorage on mount
    useEffect(() => {
        try {
            const storedValue = localStorage.getItem('attendanceData');
            if (storedValue) {
                setAttendanceData(JSON.parse(storedValue));
            }
        } catch (error) {
            console.error('Error reading from localStorage:', error);
        }
    }, []);

    // Effect to synchronize state with localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    }, [attendanceData]);

    // Effect for initializing cameras
    useEffect(() => {
        Html5Qrcode.getCameras()
            .then((devices: CameraDevice[]) => {
                if (devices && devices.length) {
                    setCameras(devices);
                    const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
                    setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
                }
            })
            .catch((err: any) => {
                console.error("Error getting cameras", err);
                showMessage('Could not access cameras. Please grant permission.', 'error');
            });
    }, []);
    
    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => {
            setMessage(null);
        }, 5000);
    };

    const stopScan = useCallback(() => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop()
                .then(() => setIsScanning(false))
                .catch((err: any) => console.error("Failed to stop scanning.", err));
        }
    }, []);

    const onScanSuccess = useCallback((decodedText: string) => {
        playSuccessSound();
        stopScan();
        setCurrentQRData(decodedText);
        
        const today = new Date().toDateString();
        const alreadyMarked = attendanceData.some(
            record => record.qrId === decodedText && new Date(record.timestamp).toDateString() === today
        );

        if (alreadyMarked) {
            showMessage('Attendance already marked for today!', 'error');
            setShowSelection(false);
        } else {
            showMessage(`QR Scanned: ${decodedText}. Please select an item.`, 'success');
            setShowSelection(true);
        }
    }, [attendanceData, stopScan]);

    const startWebcamScan = useCallback(() => {
        if (!selectedCameraId) {
            return showMessage('Please select a camera.', 'error');
        }
        stopScan();
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCodeRef.current.start(selectedCameraId, config, onScanSuccess, (errorMessage: string) => {})
            .then(() => setIsScanning(true))
            .catch((err: any) => {
                console.error(err);
                showMessage('Failed to start scanner. Check camera permissions.', 'error');
            });
    }, [selectedCameraId, stopScan, onScanSuccess]);

    const handleFileScan = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        stopScan();
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode('qr-reader');
        }
        html5QrCodeRef.current.scanFile(file, true)
            .then(onScanSuccess)
            .catch(() => showMessage('No QR code found in the image.', 'error'));
        if(fileInputRef.current) fileInputRef.current.value = "";
    }, [onScanSuccess, stopScan]);

    const handleSaveAttendance = (egg: boolean, banana: boolean) => {
        if (!currentQRData) return;

        const newRecord: AttendanceRecord = {
            id: Date.now(),
            qrId: currentQRData,
            timestamp: new Date().toISOString(),
            egg,
            banana,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
        };
        
        setAttendanceData(prevData => [...prevData, newRecord]);
        
        showMessage('Attendance saved successfully!', 'success');
        
        setTimeout(() => {
            setShowSelection(false);
            setCurrentQRData(null);
        }, 2000);
    };
    
    const requestDeleteRecord = (id: number) => {
        const record = attendanceData.find(r => r.id === id);
        if (record) {
            setRecordToDelete(record);
        }
    };
    
    const handleSaveEdit = (id: number, egg: boolean, banana: boolean) => {
        setAttendanceData(prevData => 
            prevData.map(record =>
                record.id === id ? { ...record, egg, banana } : record
            )
        );
        setEditingRecord(null);
        showMessage('Record updated successfully!', 'success');
    };
    
    const requestClearAllData = () => {
        setIsClearConfirmVisible(true);
    };

    const dashboardStats = useMemo(() => {
        const today = new Date().toDateString();
        return {
            totalEggs: attendanceData.filter(r => r.egg).length,
            totalBananas: attendanceData.filter(r => r.banana).length,
            totalAttendance: attendanceData.length,
            todayAttendance: attendanceData.filter(r => new Date(r.timestamp).toDateString() === today).length,
        };
    }, [attendanceData]);

    const downloadExcel = useCallback(() => {
        if (attendanceData.length === 0) return showMessage('No data to export.', 'error');
        const wsData = [
            ['ID', 'QR Code', 'Date', 'Time', 'Egg', 'Banana'],
            ...attendanceData.map(r => [r.id, r.qrId, r.date, r.time, r.egg ? 'Yes' : 'No', r.banana ? 'Yes' : 'No'])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    }, [attendanceData]);

    const downloadPDF = useCallback(() => {
        if (attendanceData.length === 0) return showMessage('No data to export.', 'error');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('QR Attendance Report', 105, 20, { align: 'center' });
        doc.autoTable({
            head: [['QR ID', 'Date', 'Time', 'Egg', 'Banana']],
            body: attendanceData.map(r => [r.qrId, r.date, r.time, r.egg ? '🥚' : '', r.banana ? '🍌' : '']),
            startY: 30,
        });
        doc.save(`Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }, [attendanceData]);

    const filteredAndSortedData = useMemo(() => {
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) toDate.setHours(23, 59, 59, 999);

        const filtered = attendanceData.filter(record => {
            const recordDate = new Date(record.timestamp);
            
            const matchesSearch = record.qrId.toLowerCase().includes(searchQuery.toLowerCase());
            const isAfterFrom = fromDate ? recordDate >= fromDate : true;
            const isBeforeTo = toDate ? recordDate <= toDate : true;

            return matchesSearch && isAfterFrom && isBeforeTo;
        });

        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [attendanceData, searchQuery, dateRange]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-2 sm:p-4 md:p-8 font-sans">
            <main className="max-w-7xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 text-transparent bg-clip-text flex items-center justify-center gap-4">
                        <QrCodeIcon className="w-10 h-10" />
                        QR Attendance System
                    </h1>
                    <p className="text-gray-500 mt-2">with Egg & Banana Tracking</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <section className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-indigo-800 mb-4 flex items-center gap-2"><CameraIcon className="w-7 h-7" />Scan QR Code</h2>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <select 
                                id="cameraSelect"
                                value={selectedCameraId}
                                onChange={(e) => setSelectedCameraId(e.target.value)}
                                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isScanning}
                            >
                                {cameras.length > 0 ? cameras.map(cam => (
                                    <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.substring(0,6)}`}</option>
                                )) : <option>No cameras found</option>}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {!isScanning ? (
                                <button onClick={startWebcamScan} className="flex-1 btn-primary"><CameraIcon className="w-5 h-5"/>Start Scan</button>
                            ) : (
                                <button onClick={stopScan} className="flex-1 btn-danger"><StopIcon className="w-5 h-5"/>Stop Scan</button>
                            )}
                            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileScan} />
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 btn-secondary"><UploadIcon className="w-5 h-5"/>Upload Image</button>
                        </div>
                        <div id="qr-reader" className="mt-4 rounded-lg overflow-hidden w-full max-w-sm mx-auto aspect-square bg-gray-200"></div>
                    </section>
                    
                    <div className="flex flex-col gap-8">
                        {message && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message.type === 'success' ? <CheckCircleIcon className="w-6 h-6 flex-shrink-0" /> : <ExclamationCircleIcon className="w-6 h-6 flex-shrink-0" />}
                                <span>{message.text}</span>
                            </div>
                        )}
                        {showSelection && <SelectionComponent onSave={handleSaveAttendance} />}
                    </div>
                </div>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Dashboard</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DashboardCard icon="🥚" value={dashboardStats.totalEggs} label="Total Eggs" color="yellow" />
                        <DashboardCard icon="🍌" value={dashboardStats.totalBananas} label="Total Bananas" color="green" />
                        <DashboardCard icon="👥" value={dashboardStats.totalAttendance} label="Total Attendance" color="blue" />
                        <DashboardCard 
                            icon="🗓️" 
                            value={dashboardStats.todayAttendance} 
                            label="Today's Attendance"
                            subLabel={
                                <span className="block text-xl font-bold mt-1 text-purple-700">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                            }
                            color="purple" 
                        />
                    </div>
                </section>

                <section>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                         <h2 className="text-2xl font-bold text-gray-700 whitespace-nowrap">Attendance Records</h2>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                            <div className="relative w-full sm:flex-grow">
                                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by QR ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <DatePicker
                                value={dateRange}
                                onChange={setDateRange}
                                onReset={() => setDateRange({ from: null, to: null })}
                            />
                            <div className="flex flex-wrap gap-2 justify-start">
                                <button onClick={downloadExcel} className="btn-secondary text-sm"><ExcelIcon className="w-5 h-5" />Excel</button>
                                <button onClick={downloadPDF} className="btn-secondary text-sm"><PdfIcon className="w-5 h-5" />PDF</button>
                                <button onClick={requestClearAllData} className="btn-danger text-sm"><TrashIcon className="w-5 h-5" />Clear All</button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto shadow-inner">
                        {attendanceData.length > 0 ? (
                            filteredAndSortedData.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredAndSortedData.map(record => (
                                        <AttendanceItem 
                                            key={record.id} 
                                            record={record} 
                                            onEdit={() => setEditingRecord(record)} 
                                            onDelete={requestDeleteRecord} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No records match your filters.</p>
                            )
                        ) : (
                            <p className="text-center text-gray-500 py-8">No attendance records yet.</p>
                        )}
                    </div>
                </section>
            </main>
            {editingRecord && (
                <EditModal 
                    record={editingRecord}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingRecord(null)}
                />
            )}
            {isClearConfirmVisible && (
                <ConfirmModal
                    isOpen={isClearConfirmVisible}
                    onClose={() => setIsClearConfirmVisible(false)}
                    onConfirm={() => {
                        setAttendanceData([]);
                        showMessage('All data has been cleared.', 'success');
                        setIsClearConfirmVisible(false);
                    }}
                    title="Confirm Clear All Data"
                >
                    Are you sure you want to permanently delete all attendance records? This action cannot be undone.
                </ConfirmModal>
            )}
             {recordToDelete && (
                <ConfirmModal
                    isOpen={!!recordToDelete}
                    onClose={() => setRecordToDelete(null)}
                    onConfirm={() => {
                        setAttendanceData(prevData => prevData.filter(record => record.id !== recordToDelete.id));
                        showMessage('Record deleted.', 'success');
                        setRecordToDelete(null);
                    }}
                    title="Confirm Deletion"
                >
                    <>Are you sure you want to delete the record for QR ID: <strong className="font-bold text-gray-800">{recordToDelete.qrId}</strong> on {recordToDelete.date}? This action cannot be undone.</>
                </ConfirmModal>
            )}
        </div>
    );
};

const SelectionComponent: React.FC<{onSave: (egg: boolean, banana: boolean) => void}> = ({ onSave }) => {
    return (
        <section className="bg-gradient-to-br from-yellow-100 to-orange-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-orange-800 mb-2">Choose One Item</h3>
            <p className="text-orange-700 mb-4 text-sm">Attendance will save automatically upon selection.</p>
            <div className="space-y-4">
                <button
                    onClick={() => onSave(true, false)}
                    className="w-full text-left flex items-center gap-4 bg-white p-4 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                    <span className="text-4xl" role="img" aria-label="egg">🥚</span>
                    <span className="font-semibold text-gray-700 text-lg">Egg</span>
                </button>
                <button
                    onClick={() => onSave(false, true)}
                    className="w-full text-left flex items-center gap-4 bg-white p-4 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <span className="text-4xl" role="img" aria-label="banana">🍌</span>
                    <span className="font-semibold text-gray-700 text-lg">Banana</span>
                </button>
            </div>
        </section>
    );
};

const style = document.createElement('style');
style.textContent = `
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; background-image: linear-gradient(to right, #4f46e5, #7c3aed); color: white; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s ease-in-out; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 7px 10px rgba(0, 0, 0, 0.1); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; background-color: #e5e7eb; color: #374151; font-weight: 600; border: 1px solid #d1d5db; cursor: pointer; transition: all 0.2s ease-in-out; }
    .btn-secondary:hover { background-color: #d1d5db; }
    .btn-danger { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; background-color: #ef4444; color: white; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s ease-in-out; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .btn-danger:hover { background-color: #dc2626; transform: translateY(-2px); box-shadow: 0 7px 10px rgba(0, 0, 0, 0.1); }
`;
document.head.appendChild(style);


export default App;
