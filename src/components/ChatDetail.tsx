import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function ChatDetail({
  chat,
  onNavigate
}: {
  chat: any;
  onNavigate: (screen: string) => void;
}) {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat?.id) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Polling for new messages
      return () => clearInterval(interval);
    }
  }, [chat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const data = await api.chat.getMessages(chat.id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;

    try {
      const payload = {
        receiverId: chat.id,
        message: messageText
      };
      await api.chat.sendMessage(payload);
      setMessageText('');
      loadMessages(); // Refresh immediately
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (!chat) return null;

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
                className={`p-3.5 ${msg.sender === 'user'
                    ? 'rounded-2xl rounded-tr-sm'
                    : 'bg-gray-100 rounded-2xl rounded-tl-sm'
                  }`}
                style={{
                  background: msg.sender === 'user' ? '#F1F8F4' : '#F5F5F5',
                  color: msg.sender === 'user' ? '#027A4C' : '#1F2937'
                }}
              >
                <p style={{ fontSize: '14px' }}>{msg.message}</p>
                {msg.attachment && (
                  <div className="mt-2">
                    {msg.attachmentType === 'image' ? (
                      <img src={`http://localhost:5000/${msg.attachment}`} alt="attachment" className="rounded-lg max-w-full h-auto" />
                    ) : (
                      <a href={`http://localhost:5000/${msg.attachment}`} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">View Attachment</a>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
