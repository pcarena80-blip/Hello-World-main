import { ArrowLeft, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function PrivateChat({ onNavigate }: { onNavigate: (screen: string, data?: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadInbox = async () => {
    try {
      const data = await api.chat.getInbox();
      setContacts(data);
    } catch (error) {
      console.error(error);
      // toast.error('Failed to load chats'); // fail silently or show error
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100" style={{
        background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)'
      }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('chat')}>
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h2 className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
              Private Messages
            </h2>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex justify-center p-6 text-sm text-gray-500">Loading chats...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            {searchQuery ? `No contacts found matching "${searchQuery}"` : "No conversations yet."}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onNavigate('chat-detail', { chat: contact })}
              className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#027A4C' }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                      {contact.avatar}
                    </span>
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4CAF50] rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 mb-1" style={{ fontSize: '15px', fontWeight: 500 }}>
                    {contact.name}
                  </h4>
                  <p className="text-gray-500 truncate" style={{ fontSize: '13px' }}>
                    {contact.lastMessage}
                  </p>
                </div>
                <span className="text-gray-400" style={{ fontSize: '11px' }}>
                  {contact.time}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
