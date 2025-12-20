import { ArrowLeft, Bell, Receipt, MessageSquare, ClipboardList, Info } from 'lucide-react';

export default function NotificationsScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
    const notifications = [
        {
            id: 1,
            type: 'bill',
            title: 'New Bill Generated',
            description: 'Your electricity bill for December 2024 is now available.',
            time: '2 hours ago',
            read: false,
            icon: Receipt,
            color: '#FF9800',
            bg: '#FFF4E6'
        },
        {
            id: 2,
            type: 'complaint',
            title: 'Complaint Resolved',
            description: 'Your complaint #CMP-2024-001 regarding water leakage has been resolved.',
            time: '1 day ago',
            read: true,
            icon: ClipboardList,
            color: '#4CAF50',
            bg: '#E8F5E9'
        },
        {
            id: 3,
            type: 'notice',
            title: 'Community Meeting',
            description: 'Reminder: Annual general meeting is scheduled for this Friday at 5 PM.',
            time: '2 days ago',
            read: true,
            icon: Info,
            color: '#2196F3',
            bg: '#E3F2FD'
        },
        {
            id: 4,
            type: 'chat',
            title: 'New Message',
            description: 'You have a new message from the Building Admin.',
            time: '3 days ago',
            read: true,
            icon: MessageSquare,
            color: '#027A4C',
            bg: '#F1F8F4'
        }
    ];

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="px-6 pt-12 pb-6" style={{
                background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
                borderBottomLeftRadius: '32px',
                borderBottomRightRadius: '32px'
            }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('home')}>
                        <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </button>
                    <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
                        Notifications
                    </h1>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`bg-white rounded-2xl p-4 shadow-sm ${!notification.read ? 'ring-1 ring-[#027A4C] ring-opacity-20' : ''}`}
                    >
                        <div className="flex gap-4">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: notification.bg }}
                            >
                                <notification.icon className="w-6 h-6" style={{ color: notification.color }} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`text-gray-900 ${!notification.read ? 'font-semibold' : 'font-medium'}`} style={{ fontSize: '15px' }}>
                                        {notification.title}
                                    </h3>
                                    <span className="text-gray-400" style={{ fontSize: '11px' }}>
                                        {notification.time}
                                    </span>
                                </div>
                                <p className="text-gray-600 leading-snug" style={{ fontSize: '13px' }}>
                                    {notification.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
