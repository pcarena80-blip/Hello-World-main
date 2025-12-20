import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function ChatCenter({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community');

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
            Chat Center
          </h1>
        </div>
        <p className="text-white/80 ml-10" style={{ fontSize: '14px' }}>
          Connect with your community
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 pt-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-3 rounded-t-2xl transition-all ${activeTab === 'community'
              ? 'text-white'
              : 'bg-gray-100 text-gray-600'
              }`}
            style={{
              background: activeTab === 'community' ? 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)' : undefined,
              fontSize: '15px',
              fontWeight: 500
            }}
          >
            Community Chat
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`flex-1 py-3 rounded-t-2xl transition-all ${activeTab === 'private'
              ? 'text-white'
              : 'bg-gray-100 text-gray-600'
              }`}
            style={{
              background: activeTab === 'private' ? 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)' : undefined,
              fontSize: '15px',
              fontWeight: 500
            }}
          >
            Private Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white overflow-hidden pb-20">
        {activeTab === 'community' ? (
          <div className="h-full px-6 py-6">
            <button
              onClick={() => onNavigate('community-chat')}
              className="w-full bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)' }}>
                  <span style={{ fontSize: '20px', fontWeight: 600 }}>GV</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                    UrbanEase Community
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tap to open chat
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="h-full">
            <button
              onClick={() => onNavigate('private-chat')}
              className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-[#027A4C] flex items-center justify-center text-white">
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>PM</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-gray-900 mb-1" style={{ fontSize: '15px', fontWeight: 500 }}>
                    Private Messages
                  </h4>
                  <p className="text-gray-500" style={{ fontSize: '13px' }}>
                    View your conversations
                  </p>
                </div>

              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
