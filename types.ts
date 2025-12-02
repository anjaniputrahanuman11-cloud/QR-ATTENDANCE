
export interface AttendanceRecord {
  id: number;
  qrId: string;
  timestamp: string;
  egg: boolean;
  banana: boolean;
  date: string;
  time: string;
}

export interface CameraDevice {
    id: string;
    label: string;
}

// For CDN libraries
declare global {
    const Html5Qrcode: any;
    const XLSX: any;
    const jspdf: any;
    interface Window {
        jspdf: any;
    }
}
