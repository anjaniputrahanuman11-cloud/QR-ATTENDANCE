
import React from 'react';
import { AttendanceRecord } from '../types';
import { EditIcon, DeleteIcon } from './Icons';

interface AttendanceItemProps {
    record: AttendanceRecord;
    onEdit: () => void;
    onDelete: (id: number) => void;
}

const AttendanceItem: React.FC<AttendanceItemProps> = ({ record, onEdit, onDelete }) => {
    const recordDate = new Date(record.timestamp).toLocaleDateString();
    const recordTime = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-indigo-500 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <div className="md:col-span-3 font-semibold text-gray-800 break-all">
                ID: <span className="font-normal text-gray-600">{record.qrId}</span>
            </div>
            <div className="md:col-span-2 text-sm text-gray-500">
                {recordDate}
            </div>
            <div className="md:col-span-2 text-sm text-gray-500">
                {recordTime}
            </div>
            <div className="md:col-span-3 flex items-center gap-2 flex-wrap">
                {record.egg && (
                    <span className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-1 rounded-full">
                        <span className="text-lg" role="img" aria-label="Egg">🥚</span>
                        Egg
                    </span>
                )}
                {record.banana && (
                    <span className="flex items-center gap-1.5 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-1 rounded-full">
                        <span className="text-lg" role="img" aria-label="Banana">🍌</span>
                        Banana
                    </span>
                )}
            </div>
            <div className="md:col-span-2 flex justify-start md:justify-end gap-2">
                <button onClick={onEdit} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Edit">
                    <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(record.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Delete">
                    <DeleteIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default AttendanceItem;