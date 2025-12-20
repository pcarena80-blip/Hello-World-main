import { useState } from 'react';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';

export default function ChatDetail({ 
  chat, 
  onNavigate 
}: { 
  chat: any;
  onNavigate: (screen: string) => void;
}) {
  const [messageText, setMessageText] = useState('');

  if (!chat) return null;

  const messages = [
    { id: 1, sender: 'other', message: 'Hello! How can I assist you today?', time: '10:00 AM' },
    { id: 2, sender: 'user', message: 'I need help with my maintenance bill.', time: '10:05 AM' },
    { id: 3, sender: 'other', message: 'Of course! I can help you with that. What seems to be the issue?', time: '10:06 AM' },
    { id: 4, sender: 'user', message: 'I want to know the breakdown of charges.', time: '10:08 AM' },
    { id: 5, sender: 'other', message: 'Sure! I\'ll send you the detailed breakdown right away.', time: '10:10 AM' },
  ];

  const handleSend = () => {
    if (messageText.trim()) {
      setMessageText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100" style={{
        background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)'
      }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('private-chat')}>
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
          </button>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              {chat.avatar}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
              {chat.name}
            </h2>
            <p className="text-white/80" style={{ fontSize: '12px' }}>
              {chat.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${msg.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
              <div
                className={`p-3.5 ${
                  msg.sender === 'user'
                    ? 'rounded-2xl rounded-tr-sm'
                    : 'bg-gray-100 rounded-2xl rounded-tl-sm'
                }`}
                style={{
                  background: msg.sender === 'user' ? '#F1F8F4' : '#F5F5F5',
                  color: msg.sender === 'user' ? '#027A4C' : '#1F2937'
                }}
              >
                <p style={{ fontSize: '14px' }}>{msg.message}</p>
              </div>
              <p className="text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-100 p-4 pb-24">
        <div className="flex items-center gap-3">
          <button className="text-gray-400">
            <Paperclip className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20"
            style={{ fontSize: '14px' }}
          />
          <button
            onClick={handleSend}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)' }}
          >
            <Send className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
