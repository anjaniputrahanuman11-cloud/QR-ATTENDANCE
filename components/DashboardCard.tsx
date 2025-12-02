import React from 'react';

interface DashboardCardProps {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    subLabel?: React.ReactNode;
    color: 'yellow' | 'green' | 'blue' | 'purple';
}

const colorClasses = {
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    green: { bg: 'bg-green-100', text: 'text-green-800' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, value, label, subLabel, color }) => {
    const classes = colorClasses[color];

    return (
        <div className={`p-6 rounded-2xl shadow-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${classes.bg}`}>
            <div className="text-5xl mb-4 flex items-center justify-center h-16">
                {icon}
            </div>
            <div>
                <div className={`text-4xl font-bold ${classes.text}`}>{value}</div>
                <div className="text-sm text-gray-600 font-semibold tracking-wide">{label}</div>
                {subLabel && <div className="mt-1">{subLabel}</div>}
            </div>
        </div>
    );
};

export default DashboardCard;