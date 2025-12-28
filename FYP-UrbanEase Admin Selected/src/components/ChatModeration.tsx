import { useState, useEffect } from 'react';
import { Filter, Trash2, Ban, Flag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  user: string;
  message: string;
  time: string;
  flagged: boolean;
  senderId?: string;
}

export function ChatModeration() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/chat/community');
      // Map backend response to component format
      const formattedMessages = response.data.map((msg: any) => ({
        id: msg.id,
        user: msg.name || 'Unknown User',
        message: msg.message || (msg.attachment ? 'Attachment' : ''),
        time: msg.time,
        flagged: false, // Backend doesn't support flagging yet
        senderId: msg.senderId
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== id));
      await api.delete(`/chat/${id}`);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      // Revert on error
      fetchMessages();
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    if (filter === 'flagged') return msg.flagged;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Chat Moderation</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Monitor and moderate community chat messages</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
                  ? 'bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white'
                  : theme === 'dark'
                    ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'flagged'
                  ? 'bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white'
                  : theme === 'dark'
                    ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Flagged Messages
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            No messages found.
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-5 shadow-sm border ${msg.flagged
                  ? theme === 'dark'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-red-50/30 border-red-200'
                  : theme === 'dark'
                    ? 'bg-[#1F1F1F] border-[#333333]'
                    : 'bg-white border-gray-100'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white flex-shrink-0">
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{msg.user}</p>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{msg.time}</span>
                      {msg.flagged && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-600'
                          }`}>
                          <Flag className="w-3 h-3" />
                          Flagged
                        </span>
                      )}
                    </div>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{msg.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'
                      }`}
                    title="Delete Message"
                  >
                    <Trash2 className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70 group-hover:text-red-400' : 'text-gray-600 group-hover:text-red-600'}`} />
                  </button>
                  {/* Block User functionality not yet implemented in API */}
                  <button
                    className={`p-2 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-orange-500/20' : 'hover:bg-orange-50'
                      }`}
                    title="Block User"
                  >
                    <Ban className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70 group-hover:text-orange-400' : 'text-gray-600 group-hover:text-orange-600'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}