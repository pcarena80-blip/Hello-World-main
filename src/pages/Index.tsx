import { CRMSidebar } from "@/components/CRMSidebar";
import { TopBar } from "@/components/TopBar";
import { LeadItem } from "@/components/LeadItem";
import { DealItem } from "@/components/DealItem";
import { DealPipeline } from "@/components/DealPipeline";
import { DealForm } from "@/components/DealForm";
import { DealFilters } from "@/components/DealFilters";
import { DealProvider } from "@/contexts/DealContext";
import AIChatDashboard from "@/components/AIChatDashboard";
import { Organization } from "@/components/Organization";
import { AsanaOrganization } from "@/components/AsanaOrganization";
import { AsanaStyleTaskManagement } from "@/components/AsanaStyleTaskManagement";
import SettingsComponent from "@/components/Settings";
import { TeamChat } from "@/components/TeamChat";
import { CustomStatusManager } from "@/components/CustomStatusManager";
import { AdvancedOrganizationDashboard } from "@/components/AdvancedOrganizationDashboard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCRMData } from "@/useCRMData";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

import {
  Rocket,
  CheckCircle,
  DollarSign,
  Loader2,
  MessageSquare,
  Trophy,
  TrendingUp,
  Star,
  Crown,
  Medal,
  Award,
  Home,
  Search,
  Grid3X3,
  BarChart3,
  Settings,
  RefreshCw,
  User,
  MoreHorizontal,
  Send,
  Eye,
  Maximize2,
  MoreVertical,
  Clock,
  Wallet,
  TrendingDown,
  ExternalLink,
  Brain,
  Package,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  Smile,
  Bell,
  Shield,
  Lock,
  Smartphone,
  Key,
  Phone,
  Mic,
  Edit,
  Trash2,
  Forward,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  Bot,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { activityService } from "@/services/activityService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { io, Socket } from "socket.io-client";
import ChatReplySuggestions from "@/components/ChatReplySuggestions";

type ChatMode = "private" | "general" | "group";

type UserT = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
};

type ChatMessage = {
  id: string | number;
  sender: string; // user id or "user1" for self
  content: string;
  timestamp: Date;
};

type AiMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

type UserScore = {
  id: string;
  name: string;
  role: string;
  score: number;
  level: "Master" | "Expert" | "Advanced" | "Intermediate" | string;
  avatar?: string;
  rank: number;
};

interface User {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  lastMessageTime?: number;
  lastMessage?: string;
}

interface Message {
  id: string;
  content: string;
  sender?: string;
  senderId?: string;
  timestamp: Date | string;
  chatId?: string;
  edited?: boolean;
  deleted?: boolean;
  editTimestamp?: Date | string;
  readBy?: string[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'received';
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  message: Message;
}

const Index = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const { currentOrganization } = useOrganization();
  
  // Move ALL hooks to the top, before any conditional returns
  const [currentView, setCurrentView] = useState("overview");
  const [showAdvancedDashboard, setShowAdvancedDashboard] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  // AI Chat state
  const [selectedAI, setSelectedAI] = useState<'gemini' | 'chatgpt' | 'cohere' | 'deepai'>('gemini');
  const [isAIDropdownOpen, setIsAIDropdownOpen] = useState(false);
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Search functionality for Private Chat
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Socket.IO connection for real-time messaging
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);


  // Only call useCRMData when user is authenticated
  const { data: crmData, isLoading, error } = useCRMData();

  // Initialize empty messages for private chats
  const [privateMessages, setPrivateMessages] = useState<Record<string, ChatMessage[]>>({});

  // Chat functionality state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [showReplySuggestions, setShowReplySuggestions] = useState(false);
  const [lastIncomingMessage, setLastIncomingMessage] = useState<{
    id: string;
    content: string;
    senderId: string;
    senderName?: string;
  } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sortedUsers, setSortedUsers] = useState<User[]>([]);
  
  // Message deduplication - track processed message IDs
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);

  // Context menu functions
  const handleMessageRightClick = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const isMessageEditable = (message: Message) => {
    if (!message.timestamp) return false;
    const messageTime = new Date(message.timestamp).getTime();
    const currentTime = Date.now();
    const oneMinute = 60 * 1000; // 60 seconds in milliseconds
    return (currentTime - messageTime) <= oneMinute;
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage({
      id: message.id,
      content: message.content
    });
    closeContextMenu();
  };

  const handleDeleteMessage = async (message: Message) => {
    try {
      // Mark message as deleted locally
      setChatMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, deleted: true, content: 'This message was deleted' } : msg
      ));
      
      // TODO: Send delete request to server
      console.log('🗑️ Message deleted:', message.id);
      
      toast({
        title: "Message Deleted",
        description: "Message has been deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
    closeContextMenu();
  };

  const handleForwardMessage = (message: Message) => {
    // TODO: Implement forward functionality
    console.log('📤 Forwarding message:', message.id);
    toast({
      title: "Forward Message",
      description: "Forward functionality coming soon!",
      variant: "default"
    });
    closeContextMenu();
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editingMessage.content.trim()) return;
    
    try {
      // Update message locally
      setChatMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, content: editingMessage.content.trim(), edited: true } : msg
      ));
      
      // TODO: Send edit request to server
      console.log('✏️ Message edited:', editingMessage.id);
      
      toast({
        title: "Message Edited",
        description: "Message has been updated",
        variant: "default"
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive"
      });
    }
    
    setEditingMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu?.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu?.visible]);

  // Function to sort users by last message time (WhatsApp-style) with rate limiting
  const sortUsersByLastMessage = useCallback(async (usersList?: User[]) => {
    if (!user?.id) {
      console.log('❌ No user ID, skipping sort');
      return;
    }
    
    // Use provided usersList or current users state
    const currentUsers = usersList || users;
    if (!currentUsers || currentUsers.length === 0) {
      console.log('❌ No users to sort');
      return;
    }
    
    try {
      console.log('🔄 Sorting users by last message...');
      console.log('👥 Current users array:', currentUsers.length);
      console.log('👤 Current user ID:', user.id);
      
      // Get all messages
      const response = await fetch('/api/messages.json');
      const allMessages = await response.json();
      console.log('📨 Messages loaded:', allMessages.length);
      
      // Get all users except current user
      const otherUsers = currentUsers.filter((userItem: User) => 
        userItem.id.toString() !== user.id.toString()
      );
      console.log('👥 Other users (excluding current):', otherUsers.length);
      
      // Calculate last message time for each user
      const usersWithLastMessage = otherUsers.map((userItem: User) => {
        const selfId = user.id.toString();
        const peerId = userItem.id.toString();
        const chatId = [selfId, peerId].sort().join('-');
        
        // Find the latest message in this chat
        const chatMessages = allMessages.filter((msg: Message) => msg.chatId === chatId);
        const lastMessage = chatMessages.length > 0 
          ? chatMessages.sort((a: Message, b: Message) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          : null;
        
        return {
          ...userItem,
          lastMessageTime: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0,
          lastMessage: lastMessage ? lastMessage.content : null
        };
      });
      
      // Sort by last message time (most recent first)
      const sorted = usersWithLastMessage.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      console.log('✅ Sorted users:', sorted.length);
      setSortedUsers(sorted);
      console.log('✅ Users sorted successfully');
    } catch (error) {
      console.error('❌ Error sorting users by last message:', error);
      // Fallback to original user list
      const currentUsers = usersList || users;
      const otherUsers = currentUsers.filter((userItem: User) => 
        userItem.id.toString() !== user.id.toString()
      );
      console.log('🔄 Fallback: setting unsorted users:', otherUsers.length);
      setSortedUsers(otherUsers);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chat functions - defined early to avoid initialization errors
  const loadChatMessages = useCallback(async () => {
    if (!selectedChatUser || !currentUser) return;
    
    setIsLoadingMessages(true);
    try {
      const selfId = currentUser.id.toString();
      const peerId = selectedChatUser.id.toString();
      const chatId = [selfId, peerId].sort().join('-');
      
      // Load messages from messages.json
      const response = await fetch('/api/messages.json');
      const allMessages = await response.json();
      
      // Filter messages for this chat
      const chatMessages = allMessages.filter((msg: Message) => msg.chatId === chatId);
      setChatMessages(chatMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChatUser, currentUser]);

  // Add authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting...');
      return;
    }
    console.log('User authenticated:', user);
  }, [isAuthenticated, user]);
  
  // Add error handling for CRM data
  useEffect(() => {
    if (error) {
      console.error('CRM Data Error:', error);
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Initialize messages based on chat mode/user and seed leaderboard
  useEffect(() => {
    if (chatMode === "general") {
      setMessages([]);
    } else if (selectedUser) {
      setMessages(privateMessages[selectedUser] || []);
    } else {
      setMessages([]);
    }
    setUserScores([]);
  }, [chatMode, selectedUser, privateMessages]);

  // Update messages when selectedUser changes
  useEffect(() => {
    if (chatMode === "private" && selectedUser) {
      setMessages(privateMessages[selectedUser] || []);
    }
  }, [selectedUser, chatMode, privateMessages]);

  // Auto scroll for both chats
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isTyping]);

  // Auto scroll for private chat messages - WhatsApp style
  useEffect(() => {
    if (chatMessages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        // Also try to scroll the chat container directly
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }, [chatMessages.length]);

  // Scroll to bottom when chat user changes (opening a new chat)
  useEffect(() => {
    if (selectedChatUser) {
      // Small delay to ensure messages are loaded and DOM is updated
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        // Also try to scroll the chat container directly
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 200);
    }
  }, [selectedChatUser]);

  // Load users for chat
  useEffect(() => {
    const loadUsers = async () => {
      console.log('🔄 Loading users...');
      setIsLoadingUsers(true);
      try {
        const response = await fetch('/api/register.json');
        console.log('📡 Users API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const usersData = await response.json();
        console.log('👥 Users data loaded:', usersData);
        console.log('👥 Number of users:', usersData.length);
        
        setUsers(usersData);
        setCurrentUser(user);
        
        // Initialize sortedUsers with users data immediately
        const otherUsers = usersData.filter((userItem: User) => 
          userItem.id.toString() !== user.id.toString()
        );
        setSortedUsers(otherUsers);
        console.log('👥 Initial sortedUsers set:', otherUsers.length);
        
        // Also set the regular users array as fallback
        setUsers(usersData);
        console.log('👥 Users array set:', usersData.length);
        
        // Sort users by last message time after loading
        setTimeout(() => sortUsersByLastMessage(usersData), 100);
      } catch (error) {
        console.error('❌ Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (user && isAuthenticated) {
      console.log('✅ User authenticated, loading users...');
      console.log('👤 Current user:', user);
      loadUsers();
    } else {
      console.log('❌ No user authenticated, skipping user load');
      console.log('👤 User state:', user);
      console.log('🔐 Is authenticated:', isAuthenticated);
    }
  }, [user, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when user selection changes
  useEffect(() => {
    if (selectedChatUser && currentUser && socket) {
      // Join the private chat room
      const selfId = currentUser.id.toString();
      const peerId = selectedChatUser.id.toString();
      const chatId = [selfId, peerId].sort().join('-');
      
      console.log('🔌 Joining chat room:', chatId);
      socket.emit('joinPrivateChat', chatId);
      
      // Load existing messages
      loadChatMessages();
    }
  }, [selectedChatUser, currentUser, socket, loadChatMessages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (selectedChatUser && currentUser && socket && isConnected) {
      const selfId = currentUser.id.toString();
      const peerId = selectedChatUser.id.toString();
      const chatId = [selfId, peerId].sort().join('-');
      
      // Mark all messages in this chat as read
      const unreadMessages = chatMessages.filter(m => 
        m.chatId === chatId && 
        !m.readBy?.includes(selfId) &&
        m.senderId !== selfId
      );
      
      if (unreadMessages.length > 0) {
        console.log('👁️ Marking messages as read:', unreadMessages.length);
        
        // Update local state to mark messages as read
        setChatMessages(prev => prev.map(msg => 
          msg.chatId === chatId && 
          !msg.readBy?.includes(selfId) &&
          msg.senderId !== selfId
            ? { ...msg, readBy: [...(msg.readBy || []), selfId], status: 'read' }
            : msg
        ));
        
        // Send read status to server via socket
        socket.emit('markRead', {
          chatId,
          messageIds: unreadMessages.map(m => m.id),
          readerId: selfId
        });
      }
    }
  }, [selectedChatUser, currentUser, socket, isConnected, chatMessages]);

  // Chat functions

  const sendChatMessage = async () => {
    if (!selectedChatUser || !currentUser || !chatInput.trim()) return;
    
    console.log('🚀 sendChatMessage called with:', { selectedChatUser, currentUser, chatInput: chatInput.trim() });
    
    const selfId = currentUser.id.toString();
    const peerId = selectedChatUser.id.toString();
    const chatId = [selfId, peerId].sort().join('-');
    
    console.log('🔍 Chat details:', { selfId, peerId, chatId });
    
    const newMessage = {
      // Don't set ID - let backend generate it to prevent duplicates
      chatId,
      senderId: selfId,
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
      status: 'sent' as const,
      readBy: []
    };
    
    console.log('📝 New message object:', newMessage);
    
    // Add temporary message to local state for immediate feedback
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: selfId,
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false,
      status: 'sending' as const, // Mark as sending
      readBy: []
    };
    
    setChatMessages(prev => [...prev, tempMessage]);
    
    // Clear input immediately for better UX and hide reply suggestions
    setChatInput('');
    setShowReplySuggestions(false);
    setLastIncomingMessage(null);
    
    // Send message to server via socket only (backend will save it)
    if (socket) {
      console.log('🔌 Sending message via socket:', { chatId, content: chatInput.trim(), senderId: selfId });
      socket.emit('sendMessage', {
        chatId,
        content: chatInput.trim(),
        senderId: selfId
      });
    } else {
      console.log('❌ Socket not available, cannot send message');
      // Remove temporary message if socket is not available
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast({
        title: "Connection Error",
        description: "Cannot send message. Please refresh the page.",
        variant: "destructive"
      });
    }
  };
  
  // Search users from register.json
  const searchUsers = useCallback(async (query: string) => {
    if (!user?.id) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/register.json');
      const allUsers = await response.json();
      
      // Filter out the current logged-in user
      const otherUsers = allUsers.filter((userItem: User) => 
        userItem.id.toString() !== user.id.toString()
      );
      
      if (!query.trim()) {
        // Show sorted users when no search query (WhatsApp-style)
        setSearchResults(sortedUsers);
      } else {
        // Filter users based on search query (name or email)
        const filteredUsers = otherUsers.filter((userItem: User) => 
          userItem.name.toLowerCase().includes(query.toLowerCase()) ||
          userItem.email.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Search effect with debouncing
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        // Show sorted users when no search query (WhatsApp-style)
        setSearchResults(sortedUsers);
      }
    }, 500); // Increased debounce time to reduce API calls
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isAuthenticated, user, searchUsers]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Load all users on component mount - removed to prevent infinite loop
  // sortUsersByLastMessage is now called only from the loadUsers function
  
  // Socket.IO connection setup
  useEffect(() => {
    if (isAuthenticated && user) {
      // Define a type for Vite's import.meta.env
      interface ImportMeta {
        env: {
          VITE_SERVER_URL?: string;
          [key: string]: string | undefined;
        };
      }
      
      const serverUrl = import.meta.env?.VITE_SERVER_URL || 'http://localhost:3001';
      console.log('🔌 Connecting to Socket.IO server:', serverUrl);
      
      const newSocket = io(serverUrl, { 
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true
      });
      
      // Store socket in state
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server');
        setIsConnected(true);
        
        // Authenticate user with Socket.IO
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
          // Server disconnected us, try to reconnect
          newSocket.connect();
        }
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Reconnected to Socket.IO server after', attemptNumber, 'attempts');
        setIsConnected(true);
        
        // Re-authenticate after reconnection
        newSocket.emit('authenticate', user.id.toString());
        
        // Re-join current chat room if any
        if (selectedChatUser && currentUser) {
          const selfId = currentUser.id.toString();
          const peerId = selectedChatUser.id.toString();
          const chatId = [selfId, peerId].sort().join('-');
          newSocket.emit('joinPrivateChat', chatId);
        }
      });
      
      newSocket.on('reconnect_error', (error) => {
        console.error('🔌 Reconnection error:', error);
        setIsConnected(false);
      });
      
      newSocket.on('reconnect_failed', () => {
        console.error('🔌 Reconnection failed');
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Unable to reconnect to chat server. Please refresh the page.",
          variant: "destructive"
        });
      });
      
      // Listen for incoming messages
      const handleReceiveMessage = (message: Message) => {
        console.log('📨 Received real-time message:', message);
        
        // Skip if this is our own message (we already added it locally)
        if (message.senderId === user.id.toString()) {
          console.log('📨 Skipping own message in real-time handler');
          return;
        }
        
        // Create message object for chatMessages state
        const newMessage = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          timestamp: message.timestamp,
          edited: false,
          deleted: false,
          status: 'received' as const,
          readBy: []
        };
        
        // Update chatMessages state if this is for the currently selected chat
        if (selectedChatUser) {
          const selfId = user.id.toString();
          const peerId = selectedChatUser.id.toString();
          const currentChatId = [selfId, peerId].sort().join('-');
          
          if (message.chatId === currentChatId) {
            console.log('📨 Adding real-time message to current chat');
            setChatMessages(prev => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('📨 Message already exists, skipping duplicate');
                return prev;
              }
              
              // Add new message
              return [...prev, newMessage];
            });
            
            // Show reply suggestions for incoming messages
            const senderName = users.find(u => u.id.toString() === message.senderId)?.name || 'Unknown';
            setLastIncomingMessage({
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              senderName: senderName
            });
            setShowReplySuggestions(true);
            
            // Update sorted users to reflect new message order
            setTimeout(() => sortUsersByLastMessage(), 100);
          }
        }

        // Show toast notification for new messages (only if not in current chat)
        if (selectedChatUser) {
          const selfId = user.id.toString();
          const peerId = selectedChatUser.id.toString();
          const currentChatId = [selfId, peerId].sort().join('-');
          
          if (message.chatId !== currentChatId) {
            const senderName = users.find(u => u.id.toString() === message.senderId)?.name || 'Unknown';
            toast({
              title: "New Message",
              description: `New message from ${senderName}`,
              variant: "default"
            });
          }
        }
      };
      
      newSocket.on('receiveMessage', handleReceiveMessage);

      // Listen for loading existing messages
      const handleLoadMessages = (messages: Message[]) => {
        console.log('📚 Loading existing messages:', messages.length);
        
        if (selectedChatUser) {
          const selfId = user.id.toString();
          const peerId = selectedChatUser.id.toString();
          const chatId = [selfId, peerId].sort().join('-');
          const chatMessages = messages.filter((m: Message) => m.chatId === chatId);
          setChatMessages(chatMessages);
          
          // Update sorted users after loading messages
          setTimeout(() => sortUsersByLastMessage(), 100);
        }
      };

      // Listen for message delivery status
      const handleMessageDelivered = (data: { messageId: string }) => {
        console.log('✅ Message delivered:', data);
        
        // Update message status to delivered
        setChatMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        ));
      };
      
      // Listen for message read status
      const handleMessagesRead = (data: { messageIds: string[] }) => {
        console.log('👁️ Messages read:', data);
        
        // Update message status to read
        setChatMessages(prev => prev.map(msg => 
          data.messageIds.includes(msg.id) ? { ...msg, status: 'read' } : msg
        ));
      };
      
      // Listen for new user registrations
      const handleNewUserRegistered = (newUser: User) => {
        console.log('👤 New user registered via Socket.IO:', newUser);
        
        // Add new user to users array
        setUsers(prev => {
          // Check if user already exists
          const userExists = prev.some(u => u.id.toString() === newUser.id.toString());
          if (userExists) {
            console.log('👤 User already exists, skipping duplicate');
            return prev;
          }
          
          // Add new user
          const updatedUsers = [...prev, newUser];
          console.log('👥 Users updated with new user:', updatedUsers.length);
          return updatedUsers;
        });
        
        // Also update sortedUsers
        setSortedUsers(prev => {
          // Check if user already exists
          const userExists = prev.some(u => u.id.toString() === newUser.id.toString());
          if (userExists) {
            return prev;
          }
          
          // Add new user to sorted list
          const updatedSortedUsers = [...prev, newUser];
          console.log('👥 Sorted users updated with new user:', updatedSortedUsers.length);
          return updatedSortedUsers;
        });
        
        // Show toast notification
        toast({
          title: "New User Joined",
          description: `${newUser.name} has joined the platform!`,
          variant: "default"
        });
      };
      
      newSocket.on('loadMessages', handleLoadMessages);
      newSocket.on('messageDelivered', handleMessageDelivered);
      newSocket.on('messagesRead', handleMessagesRead);
      newSocket.on('newUserRegistered', handleNewUserRegistered);
      
      // Cleanup function
      return () => {
        console.log('🔌 Cleaning up socket connection');
        // Remove event listeners to prevent memory leaks
        newSocket.off('receiveMessage', handleReceiveMessage);
        newSocket.off('loadMessages', handleLoadMessages);
        newSocket.off('messageDelivered', handleMessageDelivered);
        newSocket.off('messagesRead', handleMessagesRead);
        newSocket.off('newUserRegistered', handleNewUserRegistered);
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, selectedChatUser, currentUser, users, sortUsersByLastMessage, toast]);

  // Helper function for level colors
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Master":
        return "bg-yellow-100 text-yellow-800";
      case "Expert":
        return "bg-orange-100 text-orange-800";
      case "Advanced":
        return "bg-blue-100 text-blue-800";
      case "Intermediate":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function for level icons
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Master":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "Expert":
        return <Trophy className="w-4 h-4 text-orange-500" />;
      case "Advanced":
        return <Medal className="w-4 h-4 text-blue-500" />;
      case "Intermediate":
        return <Award className="w-4 h-4 text-green-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="responsive-layout bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication error if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="responsive-layout bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard</p>
          <p className="text-sm text-gray-500 mb-4">Current auth state: {JSON.stringify({ user, isAuthenticated, authLoading })}</p>
          <Button onClick={() => window.location.href = "/login"}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state for CRM data
  if (isLoading) {
    return (
      <div className="responsive-layout bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state for CRM data
  if (error) {
    return (
      <div className="responsive-layout bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkTaskDone = (taskId: number) => {
    toast({
      title: "Task completed!",
      description: "Task has been marked as done.",
    });

    // Remove dummy scoring system
    // updateScores("user1", 50);

    activityService.log({
      type: "project",
      title: "Task completed",
      description: "Marked a task as done",
      priority: "medium",
      status: "completed",
      user: { id: "user1", name: "You", role: "Admin" },
      metadata: { taskId },
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (chatMode === "private" && !selectedUser) return;
    
    // Prevent users from messaging themselves
    if (chatMode === "private" && selectedUser) {
      const actualUserId = selectedUser.replace('user_', '');
      if (actualUserId === user.id.toString()) {
        toast({
          title: "Cannot Send Message",
          description: "You cannot send a message to yourself.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (!socket || !isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to chat server. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    if (chatMode === "private" && selectedUser) {
      const actualUserId = selectedUser.replace('user_', '');
      
      // Join private chat room
      const roomId = [user.id.toString(), actualUserId].sort().join('-');
      socket.emit('joinPrivateChat', {
        userId1: user.id.toString(),
        userId2: actualUserId
      });
      
      // Send message through Socket.IO
      socket.emit('sendMessage', {
        chatId: roomId,
        content: newMessage.trim(),
        senderId: user.id.toString()
      });
      
      console.log(`📨 Sent message to user ${actualUserId} in room ${roomId}`);
    }

    setNewMessage("");
  };

  const renderOverview = () => {
    // Show organization dashboard
    return (
      <AdvancedOrganizationDashboard />
    );
  };

  const renderLeads = () => (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Leads</h1>
        <p className="text-muted-foreground">Manage your lead pipeline</p>
      </div>

      <div className="space-y-4">
        {crmData?.leads.map((lead) => (
          <LeadItem key={lead.id} name={lead.name} email={lead.email} company={lead.company} status={lead.status} value={lead.value} source={lead.source} />
        ))}
      </div>
    </>
  );

  const renderDeals = () => (
    <DealProvider>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Deals</h1>
          <p className="text-muted-foreground">Track your sales opportunities</p>
        </div>
        
        <DealFilters />
        
        <DealPipeline />
        
        <DealForm open={false} onOpenChange={() => {}} />
      </div>
    </DealProvider>
  );










  const renderAiChat = () => {
    return (
      <>
        {/* Full-Screen AI Chat Mode */}
        <div className={`fixed inset-0 bg-background z-50`}>
          {/* Chat Header */}
          <div className={`h-16 bg-background border-b flex items-center justify-between px-6`}>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView("overview")} className={`hover:bg-muted`}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-600" />
                <h1 className={`text-xl font-bold text-foreground`}>AI Chat</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className={`hover:bg-muted`}>
                <Search className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className={`hover:bg-muted`}>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Full Width Chat Layout */}
          <div className="flex h-[calc(100vh-64px)]">
            {/* AI Selection Dropdown */}
            <div className={`w-80 bg-muted/30 border-border border-r flex flex-col`}>
              {/* AI Selection Header */}
              <div className={`p-4 border-b bg-card border-border`}>
                <h3 className="font-semibold text-card-foreground">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Select your preferred AI</p>
              </div>

              {/* AI Selection Dropdown */}
              <div className="p-4">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  {/* Gemini AI - Always Visible */}
                  <div 
                    className={`p-4 border-b border-border cursor-pointer transition-colors ${
                      selectedAI === 'gemini' 
                        ? 'bg-purple-500/10 border-purple-500/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAI('gemini')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">Gemini AI Assistant</h3>
                        <p className="text-sm text-purple-500">Powered by Google Gemini</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'gemini' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ChatGPT - Expandable */}
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedAI === 'chatgpt' 
                        ? 'bg-blue-500/10 border-blue-500/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAI('chatgpt')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">ChatGPT</h3>
                        <p className="text-sm text-blue-500">Powered by OpenAI</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'chatgpt' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cohere AI - Expandable */}
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedAI === 'cohere' 
                        ? 'bg-yellow-500/10 border-yellow-500/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAI('cohere')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">Cohere AI</h3>
                        <p className="text-sm text-yellow-500">Powered by Cohere</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'cohere' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DeepAI - Expandable */}
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedAI === 'deepai' 
                        ? 'bg-indigo-500/10 border-indigo-500/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAI('deepai')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">DeepAI</h3>
                        <p className="text-sm text-indigo-500">Powered by DeepAI</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {selectedAI === 'deepai' ? 'Active' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Chat Window */}
            <div className={`flex-1 bg-card flex flex-col`}>
              {/* Chat Header */}
              <div className={`p-4 border-b bg-card border-border flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`${
                      selectedAI === 'gemini' 
                        ? 'bg-purple-100 text-purple-600' 
                        : selectedAI === 'chatgpt' 
                        ? 'bg-blue-100 text-blue-600'
                        : selectedAI === 'cohere'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-indigo-100 text-indigo-600'
                    } font-semibold`}>
                      {selectedAI === 'gemini' ? 'AI' : selectedAI === 'chatgpt' ? 'GPT' : selectedAI === 'cohere' ? 'Cohere' : 'DeepAI'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className={`font-semibold text-foreground`}>
                      {selectedAI === 'gemini' ? 'Gemini AI Assistant' : selectedAI === 'chatgpt' ? 'ChatGPT Assistant' : selectedAI === 'cohere' ? 'Cohere AI Assistant' : 'DeepAI Assistant'}
                    </h2>
                    <p className={`text-sm text-muted-foreground`}>Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className={`hover:bg-muted`}>
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`hover:bg-muted`}>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Messages Area - Full Width */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30`}>
                <AIChatDashboard />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderActivities = () => (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Activity Scoring & Leaderboard</h1>
        <p className="text-muted-foreground">Track team performance and engagement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Score Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {userScores.find((u) => u.id === "user1")?.score || 0}
            </div>
            <Badge className={`text-sm ${getLevelColor(userScores.find((u) => u.id === "user1")?.level || "Beginner")}`}>
              {getLevelIcon(userScores.find((u) => u.id === "user1")?.level || "Beginner")}
              {userScores.find((u) => u.id === "user1")?.level || "Beginner"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">Rank #{userScores.find((u) => u.id === "user1")?.rank || 0} of {userScores.length}</p>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Messages Sent</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasks Completed</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deals Closed</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Login</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              Team Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userScores.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? "bg-yellow-50 border border-yellow-200"
                      : index === 1
                      ? "bg-muted/50 border border-border"
                      : index === 2
                      ? "bg-orange-50 border border-orange-200"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-muted-foreground text-background"
                          : index === 2
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getLevelColor(user.level)}>
                      {getLevelIcon(user.level)}
                      {user.level}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg">{user.score}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );








  const renderOrganization = () => (
    <Organization />
  );

  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return renderOverview();
      case "organization":
        return renderOrganization();
      case "leads":
        return renderLeads();
      case "deals":
        return renderDeals();
      case "ai-chat":
        return renderAiChat();
      case "team-chat":
        return (
          <div className="h-[calc(100vh-120px)]">
            <TeamChat
              organizationId="all"
              organizationName="All Organizations"
            />
          </div>
        );
      case "activities":
        return renderActivities();
      case "settings":
        return <SettingsComponent />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="responsive-layout bg-background">
      {/* Sidebar - Hidden on mobile, visible on desktop, hidden in organization view */}
      {currentView !== 'organization' && (
        <div className="hidden lg:block">
          <CRMSidebar currentView={currentView} onViewChange={setCurrentView} />
        </div>
      )}
      
      <div className="responsive-main min-w-0 overflow-hidden flex-1">
        {currentView !== 'organization' && (
          <TopBar 
            onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onOrganizationClick={() => setCurrentView('organization')}
          />
        )}
        <main className={`responsive-dashboard-main ${currentView === 'organization' ? 'p-0' : 'p-3 lg:p-6'}`}>{renderContent()}</main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-crm-sidebar border-r border-border">
            <CRMSidebar 
              currentView={currentView} 
              onViewChange={(view) => {
                setCurrentView(view);
                setIsMobileSidebarOpen(false);
              }} 
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;

