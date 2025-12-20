import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Send, Paperclip, Download, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { io } from 'socket.io-client';

export default function CommunityChat({ onNavigate }: { onNavigate: (screen: string, data?: any) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const messagesRecievedRef = useRef<boolean>(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      api.auth.getProfile().then(data => {
        if (data.lastCommunityRead) {
          setLastReadTime(new Date(data.lastCommunityRead).getTime());
        }
      }).catch(err => console.error("Failed to sync read status", err));

      // Fetch total registered users count
      fetch('http://localhost:5000/api/auth/users/count', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setUserCount(data.count || 0))
        .catch(err => console.error('Failed to fetch user count', err));
    }

    loadMessages();

    // Socket.io Connection
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_community');

    socketRef.current.on('new_message', (msg: any) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      messagesRecievedRef.current = true;
    });

    return () => {
      socketRef.current?.disconnect();
      if (messagesRecievedRef.current) {
        api.auth.updateCommunityRead().catch(console.error);
      }
    };
  }, []);

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const lowerQuery = searchQuery.toLowerCase();
    return messages.filter(msg =>
      (msg.message && msg.message.toLowerCase().includes(lowerQuery)) ||
      (msg.name && msg.name.toLowerCase().includes(lowerQuery)) ||
      (msg.attachment && msg.attachment.toLowerCase().includes(lowerQuery))
    );
  }, [messages, searchQuery]);

  // Scroll Logic (WhatsApp-style)
  useEffect(() => {
    if (searchQuery) return; // Don't auto-scroll while searching

    if (messages.length > 0 && !initialScrollDone && lastReadTime > 0) {
      const hasUnread = messages.some(m => new Date(m.timestamp).getTime() > lastReadTime);
      if (hasUnread) {
        // Scroll to first unread message
        setTimeout(() => {
          unreadDividerRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
        }, 100);
      } else {
        // All read, scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
      }
      setInitialScrollDone(true);
    } else if (messages.length > 0 && !initialScrollDone && lastReadTime === 0) {
      // No read tracking, just scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
      setInitialScrollDone(true);
    } else if (initialScrollDone && messagesRecievedRef.current) {
      // New message received - only auto-scroll if user is near bottom
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom

        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        // If user scrolled up, don't auto-scroll
      }
    }
  }, [messages, initialScrollDone, lastReadTime, searchQuery]);


  const loadMessages = async () => {
    try {
      console.log('Loading messages...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      const data = await api.chat.getMessages('community');
      console.log('Messages loaded:', data.length);
      console.log('Sample message data:', data[0]);
      data.forEach((msg, idx) => {
        if (msg.attachment) {
          console.log(`Message ${idx}: attachment=${msg.attachment}, type=${msg.attachmentType}`);
        }
      });
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      alert('Failed to load messages. Please check if you are logged in.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    console.log('handleSend called, message:', newMessage, 'file:', selectedFile);

    if (!newMessage.trim() && !selectedFile) {
      console.log('Send blocked: empty message and no file');
      return;
    }

    try {
      console.log('Sending message...');
      const formData = new FormData();
      formData.append('receiverId', 'community');

      if (newMessage.trim()) {
        formData.append('message', newMessage);
      }

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const result = await api.chat.sendMessage(formData);
      console.log('Message sent successfully:', result);

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Immediately reload messages to show the new one
      console.log('Reloading messages after send...');
      await loadMessages();
      messagesRecievedRef.current = true;
      api.auth.updateCommunityRead();

    } catch (error: any) {
      console.error('Failed to send message', error);
      alert(error.message || 'Failed to send message');
    }
  };

  const startPrivateChat = () => {
    if (selectedUser) {
      onNavigate('chat-detail', {
        chat: {
          id: selectedUser.id,
          name: selectedUser.name,
          avatar: selectedUser.avatar,
          online: false
        }
      });
      setSelectedUser(null);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    // Normalize path: replace backslashes, strip 'uploads/' prefix if present
    const cleanPath = path.replace(/\\/g, '/').replace(/^uploads\//, '');
    return `http://localhost:5000/uploads/${cleanPath}`;
  };

  const handleImageLoad = (imageUrl: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
  };

  const handleImageError = (imageUrl: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    setFailedImages(prev => new Set(prev).add(imageUrl));
  };

  const isMessageGrouped = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return false;
    // Group if same sender and within 2 minutes
    const timeDiff = new Date(currentMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime();
    return currentMsg.senderId === prevMsg.senderId && timeDiff < 120000; // 2 minutes
  };

  const firstUnreadIndex = messages.findIndex(m => new Date(m.timestamp).getTime() > lastReadTime);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Premium Green Header */}
      <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, #027A4C 0%, #ffffff 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('chat')}>
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2} />
          </button>

          <div className="flex-1 min-w-0">
            {!isSearchOpen ? (
              <div>
                <h2 className="text-white font-medium" style={{ fontSize: '19px' }}>UrbanEase Community</h2>
              </div>
            ) : (
              <div className="flex items-center bg-white/20 rounded-lg px-3">
                <Search className="w-4 h-4 text-white" />
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none text-white placeholder-white/70 text-sm px-2 py-2 w-full"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>

          {!isSearchOpen && (
            <button onClick={() => setIsSearchOpen(true)}>
              <Search className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* White Chat Background */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24" style={{ background: '#ffffff' }}>
        {filteredMessages.map((msg, index) => {
          const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
          const isGrouped = isMessageGrouped(msg, prevMsg);
          // Recalculate unread index relative to full list, but display divider correctly?
          // Divider should logically appear in the sorted list.
          // But if we filter, the divider might look out of place if the unread message is hidden.
          // For now, only show divider if NOT searching.
          const originalIndex = messages.findIndex(m => m.id === msg.id);
          const isFirstUnread = originalIndex === firstUnreadIndex && lastReadTime > 0 && !searchQuery;

          return (
            <div key={msg.id}>
              {isFirstUnread && (
                <div ref={unreadDividerRef} className="flex items-center my-6 justify-center">
                  <div className="bg-[#E8F8F3] text-[#027A4C] text-xs font-bold px-4 py-1.5 rounded-full border border-[#027A4C]/20 shadow-sm">
                    Unread Messages
                  </div>
                </div>
              )}

              <div className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : ''} ${isGrouped ? 'mt-2' : 'mt-6'}`}>
                {msg.sender !== 'admin' && msg.sender !== 'user' && !isGrouped && (
                  <button
                    onClick={() => setSelectedUser({ id: msg.senderId, name: msg.name, avatar: msg.avatar })}
                    className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity self-end mb-1"
                  >
                    <span className="text-gray-600" style={{ fontSize: '12px', fontWeight: 500 }}>{msg.avatar}</span>
                  </button>
                )}
                {msg.sender !== 'admin' && msg.sender !== 'user' && isGrouped && (
                  <div className="w-9" />
                )}

                <div className={`flex-1 ${msg.sender === 'admin' ? 'max-w-xs mx-auto' : 'max-w-[75%]'} ${msg.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                  {msg.sender !== 'admin' && msg.sender !== 'user' && !isGrouped && (
                    <span className="text-[10px] ml-1 mb-1 font-medium" style={{ color: 'rgb(0, 0, 0)' }}>
                      {msg.name}
                    </span>
                  )}
                  <div
                    className="relative flex flex-col rounded-lg shadow-sm"
                    style={{
                      minWidth: '100px',
                      maxWidth: '75%',
                      padding: msg.attachment && msg.attachmentType === 'image' ? '4px' : '8px 10px',
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #027A4C 0%, #005c4b 100%)',
                      borderRadius: '7.5px'
                    }}
                  >
                    {msg.attachment && (
                      <div className={`${msg.message ? "mb-1" : ""}`}>
                        {msg.attachmentType === 'image' ? (
                          <div className="rounded-lg overflow-hidden relative bg-gray-100">
                            {loadingImages.has(getImageUrl(msg.attachment)) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="w-8 h-8 border-3 border-gray-300 border-t-[#027A4C] rounded-full animate-spin" />
                              </div>
                            )}
                            {failedImages.has(getImageUrl(msg.attachment)) ? (
                              <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                <div className="text-3xl mb-2">🖼️</div>
                                <p className="text-xs">Image failed to load</p>
                              </div>
                            ) : (
                              <img
                                src={getImageUrl(msg.attachment)}
                                alt="attachment"
                                className="w-full h-auto object-cover block cursor-pointer hover:opacity-95 transition-opacity"
                                style={{ maxHeight: '300px', display: loadingImages.has(getImageUrl(msg.attachment)) ? 'none' : 'block' }}
                                onClick={() => window.open(getImageUrl(msg.attachment), '_blank')}
                                onLoad={() => handleImageLoad(getImageUrl(msg.attachment))}
                                onError={() => handleImageError(getImageUrl(msg.attachment))}
                              />
                            )}
                            {!msg.message && (
                              <>
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                                <p className="absolute bottom-1.5 right-2 text-[11px] text-white/90 font-medium z-10">{msg.time}</p>
                              </>
                            )}
                          </div>
                        ) : (
                          <a
                            href={getImageUrl(msg.attachment)}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-lg ${msg.sender === 'user' ? 'bg-black/10 text-white' : 'bg-gray-100'}`}
                          >
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500 shrink-0">
                              <Paperclip className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate opacity-90">{msg.attachment.split('/').pop()}</p>
                              <p className="text-[10px] opacity-70 uppercase mt-0.5">{msg.attachment.split('.').pop()} File</p>
                            </div>
                            <Download className="w-4 h-4 opacity-70" />
                          </a>
                        )}
                      </div>
                    )}

                    {msg.message && (
                      <div className={msg.attachment && msg.attachmentType === 'image' ? "px-1 pb-1 pt-1" : ""}>
                        <p style={{
                          fontSize: '14.2px',
                          lineHeight: '19px',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          color: 'rgb(255, 255, 255)'
                        }}>{msg.message}</p>
                      </div>
                    )}

                    {(!msg.attachment || msg.attachmentType !== 'image' || msg.message) && (
                      <p className="text-[11px] mt-1 flex justify-end" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {msg.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Input Bar */}
      <div className="bg-white p-2 border-t border-gray-200 mt-auto" style={{ marginBottom: '72px' }}>
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-2">
          <button
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />

          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center overflow-hidden border border-gray-300">
            {selectedFile && (
              <div className="mr-2 flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 max-w-[150px]">
                <span className="text-xs text-gray-700 truncate">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0">✕</button>
              </div>
            )}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-[15px]"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
          </div>

          <button
            onClick={handleSend}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-90 active:scale-95 text-white"
            style={{ background: '#25D366' }}
          >
            <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="h-24 bg-[#027A4C] relative">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                ✕
              </button>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-full bg-white p-1">
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                    {selectedUser.avatar}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-12 pb-6 px-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedUser.name}</h3>
              <p className="text-sm text-gray-500 mb-6">Community Member</p>

              <button
                onClick={startPrivateChat}
                className="w-full py-3 bg-[#027A4C] text-white rounded-xl font-medium hover:bg-[#003E2F] transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
