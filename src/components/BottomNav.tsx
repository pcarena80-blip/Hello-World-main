import { Home, FileText, ClipboardList, MessageSquare, User } from 'lucide-react';

export default function BottomNav({ 
  currentScreen, 
  onNavigate 
}: { 
  currentScreen: string;
  onNavigate: (screen: string) => void;
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'complaints', label: 'Complaints', icon: ClipboardList },
    { id: 'notices', label: 'Notices', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isActive = (tabId: string) => {
    if (currentScreen === tabId) return true;
    if (tabId === 'notices' && currentScreen === 'notice-details') return true;
    if (tabId === 'complaints' && (currentScreen === 'new-complaint' || currentScreen === 'complaint-details')) return true;
    if (tabId === 'chat' && (currentScreen === 'community-chat' || currentScreen === 'private-chat' || currentScreen === 'chat-detail')) return true;
    if (tabId === 'profile' && currentScreen === 'edit-profile') return true;
    return false;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around shadow-lg" style={{
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.id);

        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[60px]"
            style={{
              backgroundColor: active ? '#F1F8F4' : 'transparent'
            }}
          >
            <Icon
              className="w-6 h-6"
              style={{ 
                color: active ? '#027A4C' : '#9CA3AF',
                strokeWidth: active ? 2 : 1.5
              }}
            />
            <span
              style={{ 
                color: active ? '#027A4C' : '#9CA3AF',
                fontSize: '11px',
                fontWeight: active ? 500 : 400
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
