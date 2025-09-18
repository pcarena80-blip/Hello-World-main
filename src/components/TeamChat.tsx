import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  RefreshCw, 
  Loader2,
  User,
  MoreHorizontal,
  X
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import ChatReplySuggestions from './ChatReplySuggestions';
import UnifiedAIChat from './UnifiedAIChat';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isOnline?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  chatId: string;
  readBy?: string[];
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  edited?: boolean;
  deleted?: boolean;
}

interface TeamChatProps {
  organizationId: string;
  organizationName: string;
  userRole: string;
}

export const TeamChat: React.FC<TeamChatProps> = ({ organizationId, organizationName, userRole }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [sortedUsers, setSortedUsers] = useState<User[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showReplySuggestions, setShowReplySuggestions] = useState(false);
  const [lastIncomingMessage, setLastIncomingMessage] = useState<Message | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isGeneratingAIResponse, setIsGeneratingAIResponse] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentUser = user;

  // Socket.IO connection setup
  useEffect(() => {
    if (user) {
      const serverUrl = import.meta.env?.VITE_SERVER_URL || 'http://localhost:3001';
      console.log('🔌 Connecting to Socket.IO server:', serverUrl);
      
      const newSocket = io(serverUrl, { 
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server');
        setIsConnected(true);
        newSocket.emit('authenticate', user.id.toString());
        console.log('🔐 Authenticating user:', user.id);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server. Trying to reconnect...",
          variant: "destructive"
        });
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from Socket.IO server:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Reconnected to Socket.IO server after', attemptNumber, 'attempts');
        setIsConnected(true);
        newSocket.emit('authenticate', user.id.toString());
        
        if (selectedChatUser && currentUser) {
          const selfId = currentUser.id.toString();
          const peerId = selectedChatUser.id.toString();
          const chatId = [selfId, peerId].sort().join('-');
          newSocket.emit('joinPrivateChat', chatId);
        }
      });
      
      // Listen for incoming messages
      const handleReceiveMessage = (message: Message) => {
        console.log('📨 Received real-time message:', message);
        console.log('📨 Current user ID:', user.id.toString());
        console.log('📨 Message sender ID:', message.senderId);
        console.log('📨 Selected chat user:', selectedChatUser?.id.toString());
        
        // Check if this message is for the current chat
        const currentChatId = selectedChatUser ? 
          [user.id.toString(), selectedChatUser.id.toString()].sort().join('-') : null;
        
        console.log('📨 Current chat ID:', currentChatId);
        console.log('📨 Message chat ID:', message.chatId);
        
        // Only add message if it's for the current chat
        if (currentChatId && message.chatId === currentChatId) {
          const newMessage = {
            ...message,
            timestamp: new Date(message.timestamp).toISOString()
          };
          
          setChatMessages(prev => {
            // Check if this is a real message replacing a temp message
            const tempMessageIndex = prev.findIndex(m => 
              m.id && m.id.startsWith('temp-') && 
              m.content === message.content && 
              m.senderId === message.senderId
            );
            
            if (tempMessageIndex !== -1) {
              // Replace temp message with real message
              console.log('📨 Replacing temp message with real message:', newMessage);
              const updatedMessages = [...prev];
              updatedMessages[tempMessageIndex] = newMessage;
              return updatedMessages;
            }
            
            // Check if message already exists
            const exists = prev.some(m => m.id === message.id);
            if (exists) {
              console.log('📨 Message already exists, skipping');
              return prev;
            }
            
            console.log('📨 Adding new message to chat:', newMessage);
            return [...prev, newMessage];
          });
          
          // Show reply suggestions for incoming messages
          if (selectedChatUser && message.senderId === selectedChatUser.id.toString()) {
            setLastIncomingMessage(newMessage);
            setShowReplySuggestions(true);
          }
        }
        
        // Show toast for any new message (not just current chat)
        if (message.senderId !== user.id.toString()) {
          // Update user list order - move sender to top
          updateUserListOrder(message.senderId, message.content);
          
          toast({
            title: "New Message",
            description: `Message from ${users.find(u => u.id.toString() === message.senderId)?.name || 'Unknown'}`,
          });
        }
      };
      
      newSocket.on('receiveMessage', handleReceiveMessage);
      
      newSocket.on('userOnline', (userId: string) => {
        console.log('👤 User came online:', userId);
        setUsers(prev => prev.map(u => 
          u.id.toString() === userId ? { ...u, isOnline: true } : u
        ));
      });
      
      newSocket.on('userOffline', (userId: string) => {
        console.log('👤 User went offline:', userId);
        setUsers(prev => prev.map(u => 
          u.id.toString() === userId ? { ...u, isOnline: false } : u
        ));
      });
      
      newSocket.on('newUser', (newUser: User) => {
        console.log('👤 New user registered via Socket.IO:', newUser);
        setUsers(prev => {
          const exists = prev.some(u => u.id === newUser.id);
          if (exists) return prev;
          return [...prev, newUser];
        });
      });
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, selectedChatUser, currentUser, users, toast]);

  // Load users and their last messages
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        console.log('🔄 TeamChat: Loading users from /api/users...');
        console.log('🔄 TeamChat: Organization ID:', organizationId);
        
        let response;
        if (organizationId === 'all') {
          // Load all users for Dashboard
          response = await fetch(`/api/users?t=${Date.now()}`);
        } else {
          // Load organization-specific users
          response = await fetch(`/api/organizations/${organizationId}/users`);
        }
        
        console.log('📡 TeamChat: Users API response status:', response.status);
        
        if (response.ok) {
          const usersData = await response.json();
          console.log('👥 TeamChat: Users data loaded:', usersData);
          console.log('👥 TeamChat: Number of users:', usersData.length);
          setUsers(usersData);
          
          // Load last messages for each user
          const usersWithLastMessages = await loadLastMessagesForUsers(usersData);
          
          // Include current user in the team members list
          const allUsers = usersWithLastMessages.filter((userItem: User) => 
            userItem.id.toString() !== user?.id?.toString()
          );
          console.log('👥 TeamChat: Filtered users (excluding current):', allUsers);
          
          // Add current user to the list
          if (user) {
            allUsers.unshift({
              id: parseInt(user.id),
              name: user.name,
              email: user.email,
              role: user.role,
              isOnline: true, // Current user is always online
              lastMessage: undefined,
              lastMessageTime: undefined
            });
          }
          
          // Sort users by last message time (most recent first)
          const sortedUsers = allUsers.sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
          });
          
          console.log('👥 TeamChat: Final sorted users:', sortedUsers);
          setSortedUsers(sortedUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    if (user) {
      loadUsers();
    }
  }, [user, organizationId]);

  // Function to load last messages for all users
  const loadLastMessagesForUsers = async (usersData: User[]) => {
    try {
      const messagesResponse = await fetch('/api/messages.json');
      if (!messagesResponse.ok) return usersData;
      
      const allMessages = await messagesResponse.json();
      const currentUserId = user?.id?.toString();
      
      return usersData.map(userItem => {
        // Find the last message between current user and this user
        const chatId = [currentUserId, userItem.id.toString()].sort().join('-');
        const userMessages = allMessages.filter((msg: Message) => msg.chatId === chatId);
        
        if (userMessages.length > 0) {
          // Sort by timestamp and get the most recent message
          const lastMessage = userMessages.sort((a: Message, b: Message) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          return {
            ...userItem,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.timestamp
          };
        }
        
        return userItem;
      });
    } catch (error) {
      console.error('Error loading last messages:', error);
      return usersData;
    }
  };

  // Load chat messages
  const loadChatMessages = async () => {
    if (!selectedChatUser || !currentUser) return;
    
    try {
      setIsLoadingMessages(true);
      const response = await fetch('/api/messages.json');
      if (response.ok) {
        const allMessages = await response.json();
        const chatId = [currentUser.id.toString(), selectedChatUser.id.toString()].sort().join('-');
        console.log('🔍 Loading messages for chatId:', chatId);
        console.log('📨 Total messages:', allMessages.length);
        const filteredMessages = allMessages.filter((msg: Message) => 
          msg.chatId === chatId && 
          msg.id && 
          msg.content && 
          typeof msg.id === 'string'
        );
        console.log('📨 Filtered messages for this chat:', filteredMessages.length);
        console.log('📨 Messages:', filteredMessages);
        setChatMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages when user is selected
  useEffect(() => {
    if (selectedChatUser) {
      loadChatMessages();
    }
  }, [selectedChatUser, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Function to update user list when message is sent/received
  const updateUserListOrder = (userId: string, messageContent: string) => {
    setSortedUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id.toString() === userId);
      if (userIndex === -1) return prevUsers;
      
      // Create updated user with last message info
      const updatedUser = {
        ...prevUsers[userIndex],
        lastMessage: messageContent,
        lastMessageTime: new Date().toISOString()
      };
      
      // Remove user from current position and add to top
      const newUsers = [...prevUsers];
      newUsers.splice(userIndex, 1);
      newUsers.unshift(updatedUser);
      
      console.log('🔄 Updated user list order - moved user to top:', updatedUser.name);
      return newUsers;
    });
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatUser || !socket || !currentUser) return;

    const actualUserId = selectedChatUser.id.toString();
    const roomId = [currentUser.id.toString(), actualUserId].sort().join('-');
    
    console.log('📤 Sending message:', {
      content: newMessage.trim(),
      to: actualUserId,
      roomId: roomId,
      from: currentUser.id.toString()
    });
    
    // Create message object for immediate display
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chatId: roomId,
      content: newMessage.trim(),
      senderId: currentUser.id.toString(),
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
      status: 'sent'
    };
    
    // Add message to chat immediately (optimistic update)
    setChatMessages(prev => [...prev, tempMessage]);
    
    // Update user list order - move recipient to top
    updateUserListOrder(actualUserId, newMessage.trim());
    
    // Join private chat room
    socket.emit('joinPrivateChat', {
      userId1: currentUser.id.toString(),
      userId2: actualUserId
    });
    
    // Send message through Socket.IO
    socket.emit('sendMessage', {
      chatId: roomId,
      content: newMessage.trim(),
      senderId: currentUser.id.toString()
    });
    
    console.log(`📨 Sent message to user ${actualUserId} in room ${roomId}`);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // AI Response Generation Function
  const generateAIResponse = async () => {
    if (!selectedChatUser || !currentUser || chatMessages.length === 0) {
      toast({
        title: "No Messages",
        description: "Please send some messages first to generate an AI response",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingAIResponse(true);
      
      // Get the last few messages for context
      const recentMessages = chatMessages.slice(-5).map(msg => ({
        role: msg.senderId === currentUser.id.toString() ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on this conversation with ${selectedChatUser.name}, generate a helpful response:`,
          messages: recentMessages,
          model: 'gemini'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.response || data.message || "I'm here to help!";
        
        // Auto-send the AI generated response
        setNewMessage(aiResponse);
        handleSendMessage();
        
        toast({
          title: "AI Response Generated",
          description: "AI response has been generated and sent",
        });
      } else {
        throw new Error('Failed to generate AI response');
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "AI Error",
        description: "Failed to generate AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAIResponse(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Pane - Users List with Independent Scrolling */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Users Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-green-600" />
              Team Chat
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">Communicate with your team members</p>
        </div>

        {/* Users List - Independent Scroll Container */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingUsers ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : sortedUsers.length > 0 ? (
            <div className="space-y-1 p-2">
              {sortedUsers.map((user) => {
                const isCurrentUser = user.id.toString() === currentUser?.id?.toString();
                const unreadCount = chatMessages.filter(m => 
                  m.chatId === [currentUser?.id, user.id].sort().join('-') && 
                  !m.readBy?.includes(currentUser?.id?.toString()) &&
                  m.senderId !== currentUser?.id?.toString()
                ).length;
                
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      if (!isCurrentUser) {
                        setSelectedChatUser(user);
                        setShowReplySuggestions(false);
                        setLastIncomingMessage(null);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isCurrentUser 
                        ? 'bg-blue-50 border border-blue-200 cursor-default' 
                        : selectedChatUser?.id === user.id 
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
                          : 'hover:bg-gray-50'
                    }`}
                    disabled={isCurrentUser}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}>
                        <span className={`text-sm font-medium ${
                          isCurrentUser ? 'text-white' : 'text-gray-600'
                        }`}>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className={`font-medium truncate ${
                            isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {user.name} {isCurrentUser && '(You)'}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isCurrentUser 
                                ? 'bg-blue-500' 
                                : user.isOnline 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-400'
                            }`} />
                            {unreadCount > 0 && !isCurrentUser && (
                              <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm truncate ${
                          isCurrentUser ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {user.lastMessage ? (
                            <div className="flex items-center justify-between">
                              <span className="truncate">{user.lastMessage}</span>
                              {user.lastMessageTime && (
                                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                  {new Date(user.lastMessageTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                          ) : (
                            user.email
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No team members available</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Chat Area with Independent Scrolling */}
      <div className="flex-1 flex flex-col">
        {selectedChatUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {selectedChatUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedChatUser.name}</h3>
                    <p className="text-sm text-gray-500">{selectedChatUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowAIChat(!showAIChat)}
                    className={`text-gray-400 hover:text-gray-600 ${showAIChat ? 'bg-blue-50 text-blue-600' : ''}`}
                    title="AI Assistant"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={loadChatMessages}
                    disabled={isLoadingMessages}
                    className="text-gray-400 hover:text-gray-600"
                    title="Refresh Messages"
                  >
                    {isLoadingMessages ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Content - Independent Scroll Container */}
            <div className="flex-1 flex flex-col bg-white min-h-0">
              {/* AI Chat Interface */}
              {showAIChat && (
                <div className="border-b bg-blue-50/50 flex-shrink-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        AI Assistant
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAIChat(false)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="h-64">
                      <UnifiedAIChat
                        chatContext={{
                          currentChat: {
                            user: selectedChatUser,
                            messages: chatMessages,
                            organizationId: organizationId,
                            organizationName: organizationName
                          }
                        }}
                        userId={currentUser?.id.toString()}
                        enableJobDetection={true}
                        defaultModel="gemini"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area - Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {isLoadingMessages ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading messages...</div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No messages yet. Start the conversation!</div>
                    <div className="text-xs text-gray-400 mt-2">
                      Debug: Total messages loaded: {chatMessages.length}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.filter(message => message && message.id && message.content && typeof message.id === 'string').map((message) => {
                      const isOwnMessage = currentUser?.id.toString() === message.senderId;
                      const messageTime = new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            } ${message.deleted ? 'opacity-60' : ''}`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {message.deleted ? (
                                <span className="italic text-gray-500">This message was deleted</span>
                              ) : (
                                message.content
                              )}
                            </div>
                            <div className={`flex items-center justify-between mt-2 text-xs ${
                              isOwnMessage ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              <span>{messageTime}</span>
                              {isOwnMessage && !message.deleted && (
                                <span className="ml-2">
                                  {message.edited && '✏️ '}
                                  {message.status === 'sending' && '⏳'}
                                  {message.status === 'sent' && '✓'}
                                  {message.status === 'delivered' && '✓✓'}
                                  {message.status === 'read' && '✓✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} className="h-1" />
                  </div>
                )}
              </div>

              {/* Reply Suggestions */}
              {showReplySuggestions && lastIncomingMessage && (
                <div className="border-t bg-muted/50 p-4 flex-shrink-0">
                  <ChatReplySuggestions
                    incomingMessage={lastIncomingMessage}
                    onSelectSuggestion={(suggestion) => {
                      setNewMessage(suggestion);
                      setShowReplySuggestions(false);
                      setLastIncomingMessage(null);
                    }}
                    onClose={() => {
                      setShowReplySuggestions(false);
                      setLastIncomingMessage(null);
                    }}
                    isVisible={showReplySuggestions}
                    userId={currentUser?.id?.toString()}
                  />
                </div>
              )}

              {/* Input Area - Fixed at bottom */}
              <div className="border-t p-4 flex-shrink-0 bg-white">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={!isConnected}
                  />
                  <Button 
                    onClick={generateAIResponse}
                    disabled={!isConnected || isGeneratingAIResponse || chatMessages.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 mr-2"
                    title="Generate AI Response"
                  >
                    {isGeneratingAIResponse ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">Select a team member</h3>
              <p className="text-muted-foreground">Choose someone from the list to start chatting</p>
              <p className="text-sm text-muted-foreground mt-2">
                You can see yourself in the team list, but you can't chat with yourself
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
