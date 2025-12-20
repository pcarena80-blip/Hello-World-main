import React from 'react';
import { Bell, Receipt, MessageSquare, ClipboardList, FileText, User, ArrowRight } from 'lucide-react';

export default function HomeScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const quickActions = [
    { icon: Receipt, label: 'Bills', screen: 'bills', bg: '#FFF4E6', color: '#FF9800' },
    { icon: ClipboardList, label: 'Complaints', screen: 'complaints', bg: '#FFEBEE', color: '#F44336' },
    { icon: FileText, label: 'Notices', screen: 'notices', bg: '#F1F8F4', color: '#027A4C' },
    { icon: MessageSquare, label: 'Chat', screen: 'chat', bg: '#E3F2FD', color: '#2196F3' },
    { icon: User, label: 'Profile', screen: 'profile', bg: '#F3E5F5', color: '#9C27B0' },
  ];

  const activeNotices = [
    { id: 1, title: 'Water Supply Maintenance - Block A', date: '2 hours ago' },
    { id: 2, title: 'Community Meeting This Friday', date: '1 day ago' },
  ];

  const [userName, setUserName] = React.useState('User');

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'User');
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Deep Green Gradient Header with Curved Bottom */}
      <div className="relative pb-20" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-white/80 mb-2" style={{ fontSize: '14px' }}>
                Welcome Home,
              </p>
              <h2 className="text-white mb-1" style={{ fontSize: '24px', fontWeight: 600 }}>
                {userName}!
              </h2>
              <p className="text-white/70" style={{ fontSize: '13px' }}>
                Check out today's updates
              </p>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-white" strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F44336] rounded-full text-white flex items-center justify-center" style={{ fontSize: '10px', fontWeight: 600 }}>3</span>
            </button>
          </div>

          {/* Notice Board Preview Card */}
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F1F8F4' }}>
                  <FileText className="w-5 h-5 text-[#027A4C]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-gray-900" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Notice Board
                  </h3>
                  <p className="text-gray-500" style={{ fontSize: '12px' }}>
                    Latest updates
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-white" style={{ background: '#027A4C', fontSize: '12px', fontWeight: 500 }}>
                2 Active
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {activeNotices.map((notice) => (
                <div key={notice.id} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-900 mb-1" style={{ fontSize: '13px', fontWeight: 500 }}>
                    {notice.title}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '11px' }}>
                    {notice.date}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('notices')}
              className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-[#027A4C]"
              style={{ background: '#F1F8F4', fontSize: '14px', fontWeight: 500 }}
            >
              View All Notices
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-12 pb-24">
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-gray-900 mb-4" style={{ fontSize: '17px', fontWeight: 600 }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onNavigate(action.screen)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: action.bg }}
                >
                  <action.icon className="w-6 h-6" style={{ color: action.color }} strokeWidth={1.5} />
                </div>
                <span className="text-gray-700 text-center" style={{ fontSize: '12px', fontWeight: 500 }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
