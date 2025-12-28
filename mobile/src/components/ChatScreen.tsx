import { useState } from 'react';
import { ArrowLeft, Send, Paperclip, Smile, User } from 'lucide-react';

const messages = [
  { id: 1, sender: 'admin', name: 'Admin', message: 'Welcome to Green Valley Community Chat!', time: '10:00 AM', avatar: 'A' },
  { id: 2, sender: 'user', name: 'Sarah Ali', message: 'Good morning everyone!', time: '10:15 AM', avatar: 'S' },
  { id: 3, sender: 'user', name: 'Zainab Bibi', message: 'Has anyone seen my car keys? I think I dropped them near the park.', time: '10:20 AM', avatar: 'ZB' },
  { id: 4, sender: 'user', name: 'Fatima Hassan', message: 'No, I haven\'t seen them. Will let you know if I find them.', time: '10:25 AM', avatar: 'F' },
  { id: 5, sender: 'user', name: 'Ali Raza', message: 'The community event was great yesterday! Thanks to everyone who participated.', time: '11:00 AM', avatar: 'AR' },
  { id: 6, sender: 'user', name: 'Sarah Ali', message: 'Yes! Looking forward to the next one.', time: '11:05 AM', avatar: 'S' },
];

export default function ChatScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (messageText.trim()) {
      // Mock send
      setMessageText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 pb-4" style={{
        background: 'linear-gradient(135deg, #00c878 0%, #00e68a 100%)'
      }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-white mb-1">Community Chat</h1>
            <p className="text-white/90">256 members</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'admin' ? 'justify-center' : ''}`}>
            {msg.sender !== 'admin' && (
              <div className="w-10 h-10 rounded-full bg-[#00c878] flex items-center justify-center text-white flex-shrink-0">
                {msg.avatar}
              </div>
            )}
            <div className={`flex-1 ${msg.sender === 'admin' ? 'max-w-xs' : 'max-w-[75%]'}`}>
              {msg.sender !== 'admin' && (
                <p className="text-gray-600 mb-1">{msg.name}</p>
              )}
              <div
                className={`p-4 rounded-3xl ${msg.sender === 'admin'
                    ? 'bg-gray-200 text-gray-700 text-center'
                    : msg.name === 'Zainab Bibi'
                      ? 'bg-[#00c878] text-white rounded-tl-md'
                      : 'bg-white text-gray-900 rounded-tl-md'
                  }`}
              >
                <p>{msg.message}</p>
              </div>
              <p className="text-gray-400 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 p-4 pb-24">
        <div className="flex items-center gap-3">
          <button className="text-gray-400">
            <Paperclip className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00c878]/20"
          />
          <button className="text-gray-400">
            <Smile className="w-6 h-6" />
          </button>
          <button
            onClick={handleSend}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00c878 0%, #00e68a 100%)'
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
