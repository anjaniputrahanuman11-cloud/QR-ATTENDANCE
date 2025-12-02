
import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { SaveIcon, CloseIcon, EditIcon } from './Icons';

interface EditModalProps {
    record: AttendanceRecord;
    onSave: (id: number, egg: boolean, banana: boolean) => void;
    onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ record, onSave, onClose }) => {
    const [egg, setEgg] = useState(record.egg);
    const [banana, setBanana] = useState(record.banana);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSave = () => {
        onSave(record.id, egg, banana);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><EditIcon className="w-6 h-6"/>Edit Record</h2>
                <div className="space-y-2 text-gray-600 mb-6">
                    <p><strong>QR ID:</strong> {record.qrId}</p>
                    <p><strong>Date:</strong> {record.date}</p>
                    <p><strong>Time:</strong> {record.time}</p>
                </div>

                <div className="space-y-4 mb-6">
                    <label className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={egg} onChange={(e) => setEgg(e.target.checked)} className="h-6 w-6 text-yellow-500 rounded focus:ring-yellow-400 border-gray-300" />
                        <span className="text-3xl" role="img" aria-label="egg">🥚</span>
                        <span className="font-semibold text-gray-700 text-lg">Egg</span>
                    </label>
                    <label className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={banana} onChange={(e) => setBanana(e.target.checked)} className="h-6 w-6 text-green-500 rounded focus:ring-green-400 border-gray-300" />
                        <span className="text-3xl" role="img" aria-label="banana">🍌</span>
                        <span className="font-semibold text-gray-700 text-lg">Banana</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary"><SaveIcon className="w-5 h-5"/>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;