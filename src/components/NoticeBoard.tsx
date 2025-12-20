import { ArrowLeft } from 'lucide-react';

const notices = [
  {
    id: 1,
    priority: 'high',
    title: 'Urgent: Water Supply Maintenance',
    description: 'Water supply will be temporarily suspended tomorrow from 9 AM to 2 PM for essential pipeline maintenance.',
    date: '2 hours ago'
  },
  {
    id: 2,
    priority: 'medium',
    title: 'Community Meeting This Friday',
    description: 'All residents are invited to attend the monthly community meeting at the clubhouse.',
    date: '1 day ago'
  },
  {
    id: 3,
    priority: 'low',
    title: 'Monthly Maintenance Fee Update',
    description: 'Please note the updated maintenance fee structure effective from next month.',
    date: '3 days ago'
  },
  {
    id: 4,
    priority: 'high',
    title: 'Security Alert: Gate Timings',
    description: 'Main gate timings have been updated. New closing time is 11 PM for security purposes.',
    date: '5 days ago'
  },
  {
    id: 5,
    priority: 'medium',
    title: 'Parking Policy Reminder',
    description: 'Residents are reminded to park only in designated areas to avoid inconvenience.',
    date: '1 week ago'
  },
];

export default function NoticeBoard({ onNavigate }: { onNavigate: (screen: string, data?: any) => void }) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#F44336', label: 'High Priority' };
      case 'medium':
        return { bg: '#FF9800', label: 'Medium' };
      default:
        return { bg: '#9E9E9E', label: 'Low' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => onNavigate('home')}>
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
          </button>
          <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
            Notice Board
          </h1>
        </div>
        <p className="text-white/80 ml-10" style={{ fontSize: '14px' }}>
          Stay updated with society announcements
        </p>
      </div>

      {/* Notices List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
        {notices.map((notice) => {
          const config = getPriorityConfig(notice.priority);

          return (
            <div
              key={notice.id}
              onClick={() => onNavigate('notice-details', { notice })}
              className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className="px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: config.bg, fontSize: '11px', fontWeight: 500 }}
                >
                  {config.label}
                </span>
                <span className="text-gray-400" style={{ fontSize: '12px' }}>
                  {notice.date}
                </span>
              </div>

              <h3 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                {notice.title}
              </h3>
              <p className="text-gray-600 line-clamp-2" style={{ fontSize: '14px' }}>
                {notice.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
