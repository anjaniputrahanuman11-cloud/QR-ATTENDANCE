import React from 'react';

interface DatePickerProps {
    value: { from: string | null; to: string | null };
    onChange: (value: { from: string | null; to: string | null }) => void;
    onReset: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onReset }) => {
    const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, from: e.target.value || null });
    };

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, to: e.target.value || null });
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
                 <label htmlFor="fromDate" className="text-sm font-medium text-gray-500">From</label>
                <input
                    id="fromDate"
                    type="date"
                    value={value.from || ''}
                    onChange={handleFromChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    style={{maxWidth: '150px'}}
                />
            </div>
            <div className="flex items-center gap-1">
                <label htmlFor="toDate" className="text-sm font-medium text-gray-500">To</label>
                <input
                    id="toDate"
                    type="date"
                    value={value.to || ''}
                    onChange={handleToChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    style={{maxWidth: '150px'}}
                />
            </div>
            <button 
                onClick={onReset} 
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                title="Reset Dates"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.006h-4.992v4.992h4.992z" />
                </svg>
            </button>
        </div>
    );
};

export default DatePicker;
