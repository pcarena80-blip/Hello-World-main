import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { AIJobManager, AIJobRequest, AIJobResponse } from "./src/services/aiJobManager.ts";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins for mobile access
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  allowEIO3: true // Allow Engine.IO v3 clients (for better mobile compatibility)
});

const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Initialize Google Generative AI client only if API key is available
let gemini: GoogleGenerativeAI | null = null;
if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

// Debug: Log all environment variables
console.log("🔍 Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("SERVER_PORT:", process.env.SERVER_PORT);
console.log("GOOGLE_GENERATIVE_AI_API_KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "SET" : "NOT SET");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "SET" : "NOT SET");

// Task Management System - In-memory user storage (separate from chat users)
const taskUsers: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
  avatar?: string;
}> = [];

// Alias for organization management
const users = taskUsers;

// Organization Management System
const organizations: Array<{
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  members: Array<{
    userId: string;
    role: 'super_admin' | 'admin' | 'manager' | 'member' | 'viewer';
    joinedAt: string;
    status: 'active' | 'inactive';
    updatedAt?: string;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    invitedBy: string;
    invitedAt: string;
    status: 'pending' | 'accepted' | 'declined';
    acceptedAt?: string;
    declinedAt?: string;
  }>;
  memberCount: number;
  settings: {
    allowGuestAccess: boolean;
    requireEmailVerification: boolean;
    defaultRole: string;
    maxMembers: number;
    features: {
      projects: boolean;
      tasks: boolean;
      chat: boolean;
      reports: boolean;
      integrations: boolean;
    };
  };
}> = [];

// Load existing organizations from organizations.json
const loadOrganizations = () => {
  try {
    const orgPath = path.join(process.cwd(), 'data/organizations.json');
    if (fs.existsSync(orgPath)) {
      const orgData = fs.readFileSync(orgPath, 'utf8');
      const loadedOrgs = JSON.parse(orgData);
      organizations.length = 0;
      organizations.push(...loadedOrgs);
      console.log(`✅ Loaded ${loadedOrgs.length} organizations from organizations.json`);
    } else {
      organizations.length = 0;
      console.log('✅ Starting with empty organization system - no organizations.json found');
    }
  } catch (error) {
    console.error('❌ Error loading organizations:', error);
    organizations.length = 0;
  }
};


// Load existing users from register.json and set up roles
const loadTaskUsers = () => {
  try {
    const registerPath = path.join(process.cwd(), 'public/api/register.json');
    console.log('📍 Loading users from:', registerPath);
    
    // Clear existing taskUsers to reload fresh
    taskUsers.length = 0;
    
    const registerData = fs.readFileSync(registerPath, 'utf8');
    const existingUsers = JSON.parse(registerData);
    
    console.log('📋 Found', existingUsers.length, 'users in register.json');
    
    existingUsers.forEach((user: any) => {
      const role = user.email === 'suham@gmail.com' ? 'admin' : 'user';
      
      const taskUser = {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        role: role as 'admin' | 'user',
        createdAt: user.createdAt || new Date().toISOString()
      };
      
      taskUsers.push(taskUser);
      console.log(`   ✓ Loaded user: ${user.name} (${user.email}) as ${role}`);
    });
    
    console.log(`✅ Successfully loaded ${taskUsers.length} users for task management:`);
    console.log(`   - Admin: ${taskUsers.filter(u => u.role === 'admin').length}`);
    console.log(`   - Users: ${taskUsers.filter(u => u.role === 'user').length}`);
    
  } catch (error) {
    console.error('❌ Error loading register.json:', error);
    console.log('⚠️ Starting with empty task users');
  }
};

// Load data on server start
console.log('🚀 Starting server and loading data...');
console.log('Current taskUsers before loading:', taskUsers.length);
console.log('Current organizations before loading:', organizations.length);
loadOrganizations();
loadTaskUsers();
console.log('Current taskUsers after loading:', taskUsers.length);
console.log('Current organizations after loading:', organizations.length);

// Also call it after a short delay to ensure it runs
setTimeout(() => {
  console.log('🔄 Double-checking user loading...');
  console.log('Current taskUsers before reload:', taskUsers.length);
  loadTaskUsers();
  console.log('Current taskUsers after reload:', taskUsers.length);
}, 1000);

// Middleware - Enhanced CORS for mobile access
app.use(cors({
  origin: true, // Allow all origins for mobile access
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'user-id'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Health check endpoint for mobile connectivity testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'running',
    cors: 'enabled',
    mobile: 'supported'
  });
});

// Authentication endpoints
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  console.log('Current task users in database:', taskUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
  
  const user = taskUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Find user's organization
    let organizationId = null;
    try {
      const organizations = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'organizations.json'), 'utf8'));
      const userOrg = organizations.find((org: any) => 
        org.members && org.members.some((member: any) => member.userId === user.id)
      );
      if (userOrg) {
        organizationId = userOrg.id;
      }
    } catch (error) {
      console.log('Could not load organizations:', error);
    }
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    const userWithOrg = { ...userWithoutPassword, organizationId };
    console.log('User found, returning:', userWithOrg);
    res.json({
      success: true,
      user: userWithOrg
    });
  } else {
    console.log('No user found with provided credentials');
    res.status(401).json({
      success: false,
      error: "Invalid email or password"
    });
  }
});

app.get('/api/users', (req, res) => {
  // Return task users without passwords (for task management system)
  const usersWithoutPasswords = taskUsers.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

// Get organization-specific users
app.get('/api/organizations/:orgId/users', (req, res) => {
  try {
    const { orgId } = req.params;
    
    // Load organizations
    const organizationsPath = path.join(process.cwd(), 'data', 'organizations.json');
    let organizations: any[] = [];
    try {
      organizations = JSON.parse(fs.readFileSync(organizationsPath, 'utf8'));
    } catch (error) {
      return res.status(404).json({ error: 'Organizations not found' });
    }
    
    // Find the organization
    const organization = organizations.find(org => org.id === orgId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Get member user IDs
    const memberUserIds = organization.members?.map(member => member.userId) || [];
    
    // Filter users to only include organization members
    const orgUsers = taskUsers
      .filter(user => memberUserIds.includes(user.id.toString()))
      .map(({ password, ...user }) => user);
    
    res.json(orgUsers);
  } catch (error) {
    console.error('Failed to load organization users:', error);
    res.status(500).json({ error: 'Failed to load organization users' });
  }
});

// Test endpoint to check organization filtering
app.get('/api/test-inbox', (req, res) => {
  try {
    const { organizationId } = req.query;
    const inboxPath = path.join(process.cwd(), 'data', 'inbox-messages.json');
    let inboxMessages: any[] = [];
    
    if (fs.existsSync(inboxPath)) {
      inboxMessages = JSON.parse(fs.readFileSync(inboxPath, 'utf8'));
    }
    
    console.log('🧪 TEST: All messages:', inboxMessages.map(m => ({ id: m.id, title: m.title, orgId: m.metadata?.organizationId })));
    console.log('🧪 TEST: Filtering for org ID:', organizationId);
    
    const filtered = inboxMessages.filter(message => message.metadata?.organizationId === organizationId);
    console.log('🧪 TEST: Filtered messages:', filtered.map(m => ({ id: m.id, title: m.title, orgId: m.metadata?.organizationId })));
    
    res.json({ 
      organizationId, 
      totalMessages: inboxMessages.length, 
      filteredMessages: filtered.length,
      allMessages: inboxMessages.map(m => ({ id: m.id, title: m.title, orgId: m.metadata?.organizationId })),
      filtered: filtered.map(m => ({ id: m.id, title: m.title, orgId: m.metadata?.organizationId }))
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Simple inbox endpoint - loads from JSON file and filters by organization
app.get('/api/inbox', (req, res) => {
  try {
    const { organizationId } = req.query;
    const inboxPath = path.join(process.cwd(), 'data', 'inbox-messages.json');
    let inboxMessages: any[] = [];
    
    if (fs.existsSync(inboxPath)) {
      inboxMessages = JSON.parse(fs.readFileSync(inboxPath, 'utf8'));
    }
    
    // Filter by organization ID if provided
    if (organizationId) {
      console.log('🔍 Server: Filtering inbox messages for organization ID:', organizationId);
      console.log('🔍 Server: Total messages before filtering:', inboxMessages.length);
      console.log('🔍 Server: All messages before filtering:', inboxMessages.map(m => ({ id: m.id, title: m.title, orgId: m.metadata?.organizationId })));
      
      inboxMessages = inboxMessages.filter(message => {
        const messageOrgId = message.metadata?.organizationId;
        const matches = messageOrgId === organizationId;
        console.log('🔍 Server: Message org ID:', messageOrgId, 'Target org ID:', organizationId, 'Matches?', matches);
        return matches;
      });
      
      console.log('🔍 Server: Messages after filtering:', inboxMessages.length);
      console.log('🔍 Server: Filtered messages:', inboxMessages.map(m => ({ id: m.id, title: m.title, orgId: m.metadata?.organizationId })));
    } else {
      console.log('🔍 Server: No organization ID provided, returning all messages');
    }
    
    console.log('📬 GET /api/inbox - Organization ID:', organizationId, 'Returning', inboxMessages.length, 'inbox messages');
    res.json(inboxMessages);
  } catch (error) {
    console.error('Failed to load inbox messages:', error);
    res.status(500).json({ error: 'Failed to load inbox messages' });
  }
});

// Helper function to add message to inbox
function addToInbox(message: any) {
  try {
    const inboxPath = path.join(process.cwd(), 'data', 'inbox-messages.json');
    let inboxMessages: any[] = [];
    
    if (fs.existsSync(inboxPath)) {
      inboxMessages = JSON.parse(fs.readFileSync(inboxPath, 'utf8'));
    }
    
    // Add new message to the beginning
    inboxMessages.unshift(message);
    
    // Keep only last 50 messages to prevent file from growing too large
    if (inboxMessages.length > 50) {
      inboxMessages = inboxMessages.slice(0, 50);
    }
    
    fs.writeFileSync(inboxPath, JSON.stringify(inboxMessages, null, 2));
    console.log('📬 Added message to inbox:', message.title);
  } catch (error) {
    console.error('Failed to add message to inbox:', error);
  }
}

app.get('/api/user', (req, res) => {
  const { email } = req.query;
  const user = taskUsers.find(u => u.email === email);
  
  if (user) {
    // Find user's organization
    let organizationId = null;
    try {
      const organizations = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'organizations.json'), 'utf8'));
      const userOrg = organizations.find((org: any) => 
        org.members && org.members.some((member: any) => member.userId === user.id)
      );
      if (userOrg) {
        organizationId = userOrg.id;
      }
    } catch (error) {
      console.log('Could not load organizations:', error);
    }
    
    const { password: _, ...userWithoutPassword } = user;
    const userWithOrg = { ...userWithoutPassword, organizationId };
    res.json(userWithOrg);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/logout', (req, res) => {
  // In a real app, you would invalidate the session/token here
  res.json({ success: true, message: 'Logged out successfully' });
});

// DEBUG: Endpoint to check current task users (remove in production)
app.get('/api/debug/users', (req, res) => {
  res.json({
    count: taskUsers.length,
    users: taskUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }))
  });
});

// DEBUG: Endpoint to clear task users array (remove in production)
app.post('/api/debug/clear-users', (req, res) => {
  const oldCount = taskUsers.length;
  taskUsers.length = 0; // Clear the array
  res.json({ 
    message: `Cleared ${oldCount} task users from memory`,
    remaining: taskUsers.length
  });
});

// DEBUG: Endpoint to reload users from register.json (remove in production)
app.post('/api/debug/reload-users', (req, res) => {
  console.log('🔄 Manual reload requested...');
  loadTaskUsers();
  res.json({ 
    success: true, 
    message: 'Users reloaded from register.json',
    count: taskUsers.length,
    users: taskUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
  });
});

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  console.log('Registration attempt:', { name, email, role });
  
  // Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      error: "All fields are required"
    });
  }
  
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: "Invalid role specified"
    });
  }
  
  // Check if user already exists
  const existingUser = taskUsers.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: "User with this email already exists"
    });
  }
  
  // For new registrations, enforce role rules
  if (role === 'admin' && email !== 'suham@gmail.com') {
    return res.status(403).json({
      success: false,
      error: "Only suham@gmail.com can be assigned admin role"
    });
  }
  
  // Create new user
  const newUser = {
    id: (Math.max(...taskUsers.map(u => parseInt(u.id)), 0) + 1).toString(),
    name,
    email,
    password, // In production, hash this password
    role: role as 'admin' | 'user',
    createdAt: new Date().toISOString()
  };
  
  taskUsers.push(newUser);
  
  // Also save to register.json to keep both systems in sync
  try {
    const registerPath = path.join(process.cwd(), 'public/api/register.json');
    const existingRegisterData = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
    existingRegisterData.push({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role === 'admin' ? 'Admin' : 'User'
    });
    fs.writeFileSync(registerPath, JSON.stringify(existingRegisterData, null, 2));
  } catch (error) {
    console.log('Could not update register.json:', error);
  }
  
  console.log('User registered successfully:', { id: newUser.id, name, email, role });
  console.log('Total task users now:', taskUsers.length);
  
  res.status(201).json({
    success: true,
    message: "Account created successfully"
  });
});

// Serve static files from "public"
app.use(express.static("public"));

// Serve static files from "dist" (for SSG)
app.use(express.static("dist"));

// In-memory storage for development (in production, use a proper database)
interface ParsedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface LoginUser {
  id: string;
  name: string;
  email: string;
  loginTime: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CustomStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatRoom {
  id: string;
  type: "private" | "group";
  name?: string;
  participants: string[];
  createdBy: string;
  createdAt: Date;
  lastMessageAt: Date;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  edited: boolean;
  deleted: boolean;
  originalContent?: string;
  editTimestamp?: Date;
  status?: 'sent' | 'delivered' | 'read';
  readBy?: string[];
}

interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: Date;
}

// Interfaces for parsed JSON data
interface ParsedMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  edited: boolean;
  deleted: boolean;
  originalContent?: string;
  editTimestamp?: string;
  status?: 'sent' | 'delivered' | 'read';
  readBy?: string[];
  lastSeen?: string;
}

interface ParsedChatRoom {
  id: string;
  type: "private" | "group";
  name?: string;
  participants: string[];
  createdBy: string;
  createdAt: string;
  lastMessageAt: string;
}

interface ParsedGroup {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: string;
}

// In-memory data storage for chat system (renamed to avoid conflict)
let chatUsers: User[] = [];
let chatRooms: ChatRoom[] = [];
let messages: Message[] = [];
let groups: Group[] = [];
const onlineUsers = new Map<string, string>(); // userId -> socketId

// Load existing data from files
const loadData = () => {
  try {
    // Load users
    const usersData = fs.readFileSync(path.join(process.cwd(), 'public/api/register.json'), 'utf8');
    const parsedUsers = JSON.parse(usersData);
    chatUsers = parsedUsers.map((user: ParsedUser) => ({
      ...user,
      id: user.id.toString(),
      isOnline: false,
      lastSeen: new Date()
    }));

    // Load existing messages
    try {
      const messagesData = fs.readFileSync(path.join(process.cwd(), 'public/api/messages.json'), 'utf8');
      const parsedMessages = JSON.parse(messagesData) as ParsedMessage[];
      messages = parsedMessages.map((msg: ParsedMessage) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        editTimestamp: msg.editTimestamp ? new Date(msg.editTimestamp) : undefined,
        lastSeen: msg.lastSeen ? new Date(msg.lastSeen) : undefined
      }));
      console.log(`📚 Loaded ${messages.length} existing messages`);
    } catch (error) {
      console.log('No existing messages found, starting with empty messages array');
      messages = [];
    }

    // Load existing chat rooms
    try {
      const chatRoomsData = fs.readFileSync(path.join(process.cwd(), 'public/api/chat-rooms.json'), 'utf8');
      const parsedChatRooms = JSON.parse(chatRoomsData) as ParsedChatRoom[];
      chatRooms = parsedChatRooms.map((room: ParsedChatRoom) => ({
        ...room,
        createdAt: new Date(room.createdAt),
        lastMessageAt: new Date(room.lastMessageAt)
      }));
      console.log(`🔒 Loaded ${chatRooms.length} existing chat rooms`);
    } catch (error) {
      console.log('No existing chat rooms found, will create default ones');
      chatRooms = [];
    }

    // Load existing groups
    try {
      const groupsData = fs.readFileSync(path.join(process.cwd(), 'public/api/groups.json'), 'utf8');
      const parsedGroups = JSON.parse(groupsData) as ParsedGroup[];
      groups = parsedGroups.map((group: ParsedGroup) => ({
        ...group,
        createdAt: new Date(group.createdAt)
      }));
      console.log(`👥 Loaded ${groups.length} existing groups`);
    } catch (error) {
      console.log('No existing groups found, will create default ones');
      groups = [];
    }

    // Create default groups if none exist
    if (groups.length === 0) {
      groups = [
        {
          id: uuidv4(),
          name: "General",
          description: "General team discussions",
                  members: chatUsers.map(u => u.id),
        admins: chatUsers.filter(u => u.role === "Admin" || u.id === chatUsers[0]?.id).map(u => u.id),
        createdBy: chatUsers[0]?.id || "",
          createdAt: new Date()
        }
      ];
    }

    // Create chat rooms for groups if none exist
    if (chatRooms.length === 0) {
      groups.forEach(group => {
        chatRooms.push({
          id: group.id,
          type: "group",
          name: group.name,
          participants: group.members,
          createdBy: group.createdBy,
          createdAt: group.createdAt,
          lastMessageAt: new Date()
        });
      });
    }

    console.log(`✅ Loaded ${chatUsers.length} chat users, ${groups.length} groups, ${chatRooms.length} chat rooms`);
  } catch (error) {
    console.error('Error loading data:', error);
    // Initialize with default data if files don't exist
    chatUsers = [];
    groups = [];
    chatRooms = [];
    messages = [];
  }
};

// Save data to files
const saveData = () => {
  try {
    const usersToSave = chatUsers.map(u => ({
      id: parseInt(u.id),
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role || "User"
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/register.json'), JSON.stringify(usersToSave, null, 2));
    
    // Save messages
    const messagesToSave = messages.map(m => ({
      ...m,
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString(),
      editTimestamp: m.editTimestamp ? (typeof m.editTimestamp === 'string' ? m.editTimestamp : m.editTimestamp.toISOString()) : undefined
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/messages.json'), JSON.stringify(messagesToSave, null, 2));
    
    // Save chat rooms
    const chatRoomsToSave = chatRooms.map(room => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
      lastMessageAt: room.lastMessageAt.toISOString()
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/chat-rooms.json'), JSON.stringify(chatRoomsToSave, null, 2));
    
    // Save groups
    const groupsToSave = groups.map(group => ({
      ...group,
      createdAt: group.createdAt.toISOString()
    }));
    fs.writeFileSync(path.join(process.cwd(), 'public/api/groups.json'), JSON.stringify(groupsToSave, null, 2));
    
    console.log(`💾 Saved ${chatUsers.length} users, ${messages.length} messages, ${chatRooms.length} chat rooms, and ${groups.length} groups`);
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Initialize data
loadData();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // User authentication
  socket.on('authenticate', (userId: string) => {
    const user = chatUsers.find(u => u.id === userId);
    if (user) {
      onlineUsers.set(userId, socket.id);
      user.isOnline = true;
      user.lastSeen = new Date();
      
      // Join user to their groups
      groups.forEach(group => {
        if (group.members.includes(userId)) {
          socket.join(group.id);
        }
      });

      // Join user to organization rooms
      organizations.forEach(org => {
        socket.join(`org-${org.id}`);
      });

      // Notify others that user is online
      socket.broadcast.emit('userStatusChange', {
        userId,
        isOnline: true,
        lastSeen: user.lastSeen
      });

      console.log(`✅ User ${user.name} authenticated and online`);
    }
  });

  // Organization-specific real-time updates
  socket.on('joinOrganization', (organizationId: string) => {
    socket.join(`org-${organizationId}`);
    console.log(`🏢 User joined organization: ${organizationId}`);
  });

  socket.on('leaveOrganization', (organizationId: string) => {
    socket.leave(`org-${organizationId}`);
    console.log(`🏢 User left organization: ${organizationId}`);
  });

  // Real-time project updates
  socket.on('projectUpdate', (data: { organizationId: string, project: any, action: string }) => {
    const { organizationId, project, action } = data;
    io.to(`org-${organizationId}`).emit('projectUpdated', { project, action });
    console.log(`📊 Project ${action}: ${project.name} in org ${organizationId}`);
  });

  // Real-time task updates
  socket.on('taskUpdate', (data: { organizationId: string, task: any, action: string }) => {
    const { organizationId, task, action } = data;
    io.to(`org-${organizationId}`).emit('taskUpdated', { task, action });
    console.log(`✅ Task ${action}: ${task.title} in org ${organizationId}`);
  });

  // Real-time goal updates
  socket.on('goalUpdate', (data: { organizationId: string, goal: any, action: string }) => {
    const { organizationId, goal, action } = data;
    io.to(`org-${organizationId}`).emit('goalUpdated', { goal, action });
    console.log(`🎯 Goal ${action}: ${goal.title} in org ${organizationId}`);
  });

  // Real-time portfolio updates
  socket.on('portfolioUpdate', (data: { organizationId: string, portfolio: any, action: string }) => {
    const { organizationId, portfolio, action } = data;
    io.to(`org-${organizationId}`).emit('portfolioUpdated', { portfolio, action });
    console.log(`📁 Portfolio ${action}: ${portfolio.name} in org ${organizationId}`);
  });

  // Real-time notification updates
  socket.on('notificationUpdate', (data: { organizationId: string, notification: any, action: string }) => {
    const { organizationId, notification, action } = data;
    io.to(`org-${organizationId}`).emit('notificationUpdated', { notification, action });
    console.log(`🔔 Notification ${action} in org ${organizationId}`);
  });

  // Real-time activity updates
  socket.on('activityUpdate', (data: { organizationId: string, activity: any }) => {
    const { organizationId, activity } = data;
    io.to(`org-${organizationId}`).emit('activityAdded', activity);
    console.log(`📈 Activity added in org ${organizationId}: ${activity.title}`);
  });

  // Join private chat room
  socket.on('joinPrivateChat', (data: string | {userId1: string, userId2: string}) => {
    console.log(`🔒 User joining private chat:`, data);
    
    // Handle both string chatId and object format
    let chatId: string;
    if (typeof data === 'string') {
      chatId = data;
    } else {
      // Create chatId from userId1 and userId2
      chatId = [data.userId1, data.userId2].sort().join('-');
    }
    
    // Create private chat room if it doesn't exist
    if (!chatRooms.find(r => r.id === chatId && r.type === "private")) {
      const userIds = chatId.split('-');
      if (userIds.length === 2) {
        const newRoom: ChatRoom = {
          id: chatId,
          type: "private",
          participants: userIds,
          createdBy: userIds[0],
          createdAt: new Date(),
          lastMessageAt: new Date()
        };
        chatRooms.push(newRoom);
        console.log(`🔒 Created new private chat room: ${chatId}`);
      }
    }

    socket.join(chatId);
    console.log(`🔒 User joined private chat: ${chatId}`);
    
    // Send existing messages for this chat
    const existingMessages = messages.filter(m => m.chatId === chatId);
    console.log(`🔍 Found ${existingMessages.length} existing messages for room ${chatId}:`, existingMessages.map(m => ({ id: m.id, content: m.content.substring(0, 30), senderId: m.senderId })));
    if (existingMessages.length > 0) {
      socket.emit('loadMessages', existingMessages);
      console.log(`📚 Sent ${existingMessages.length} existing messages for room ${chatId}`);
    } else {
      console.log(`📭 No existing messages found for room ${chatId}`);
    }
    
    // Debug: Check room status after join
    const room = io.sockets.adapter.rooms.get(chatId);
    if (room) {
      console.log(`🔒 Room ${chatId} now has ${room.size} users:`, Array.from(room));
    }
  });

  // Send message
  socket.on('sendMessage', (data: { chatId: string, content: string, senderId: string }) => {
    const { chatId, content, senderId } = data;
    
    const message: Message = {
      id: uuidv4(),
      chatId,
      senderId,
      content,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      status: 'sent',
      readBy: [],
    };

    messages.push(message);

    // Ensure chat room exists and update last message time
    let chatRoom = chatRooms.find(r => r.id === chatId);
    if (!chatRoom) {
      const maybeIds = chatId.split('-');
      if (maybeIds.length === 2) {
        chatRoom = {
          id: chatId,
          type: "private",
          participants: [maybeIds[0], maybeIds[1]],
          createdBy: senderId,
          createdAt: new Date(),
          lastMessageAt: new Date()
        };
        chatRooms.push(chatRoom);
      }
    } else {
      chatRoom.lastMessageAt = new Date();
    }

    // Debug: Check who's in the room
    const room = io.sockets.adapter.rooms.get(chatId);
    if (room && room.size > 1) {
      console.log(`📨 Room ${chatId} has ${room.size} users:`, Array.from(room));
      
      // Broadcast message to all users in the chat room
      io.to(chatId).emit('receiveMessage', message);
      
      // Send delivery confirmation to sender
      socket.emit('messageDelivered', { messageId: message.id, status: 'delivered' });
      
      // If recipient is online, mark as delivered
      const recipientSocketId = Array.from(room).find(socketId => socketId !== socket.id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('messageDelivered', { messageId: message.id, status: 'delivered' });
      }
    } else {
      console.log(`📨 Room ${chatId} is empty or has only sender, using direct delivery`);
      // Direct delivery to recipient(s) since room broadcast might not work
      const ids = chatId.split('-');
      const recipients = ids.filter(id => id !== senderId);
      
      // Send message to sender first
      socket.emit('receiveMessage', message);
      socket.emit('messageDelivered', { messageId: message.id, status: 'delivered' });
      
      // Send to recipients
      recipients.forEach(recipientId => {
        const sockId = onlineUsers.get(recipientId);
        if (sockId) {
          io.to(sockId).emit('receiveMessage', message);
          io.to(sockId).emit('messageDelivered', { messageId: message.id, status: 'delivered' });
        }
      });
    }

    console.log(`📨 Message sent in chat ${chatId}: ${content.substring(0, 50)}...`);
    console.log(`📨 Message ID: ${message.id}`);
    console.log(`📨 Sender: ${senderId}`);
    console.log(`📨 Recipients: ${chatId.split('-').filter(id => id !== senderId).join(', ')}`);
    
    // Save messages to file after sending
    saveData();
  });

  // Mark message(s) as read
  socket.on('markRead', (data: { chatId: string, messageIds?: string[], readerId: string }) => {
    const { chatId, messageIds, readerId } = data;
    const targetMessages = messages.filter(m => m.chatId === chatId && (!messageIds || messageIds.includes(m.id)));
    const updated: Message[] = [];
    targetMessages.forEach(m => {
      if (m.senderId !== readerId) {
        if (!m.readBy) m.readBy = [];
        if (!m.readBy.includes(readerId)) {
          m.readBy.push(readerId);
        }
        // If all other participants have read, mark as read
        const room = chatRooms.find(r => r.id === chatId);
        if (room) {
          const others = room.participants.filter(p => p !== m.senderId);
          const allRead = others.every(p => m.readBy?.includes(p));
          if (allRead) {
            m.status = 'read';
          }
        }
        updated.push(m);
      }
    });
    if (updated.length > 0) {
      io.to(chatId).emit('messagesRead', { chatId, messageIds: updated.map(u => u.id), readerId });
      
      // Save messages to file after marking as read
      saveData();
    }
  });

  // Edit message
  socket.on('editMessage', (data: { messageId: string, newContent: string, senderId: string }) => {
    const { messageId, newContent, senderId } = data;
    const message = messages.find(m => m.id === messageId);
    
    if (message && message.senderId === senderId) {
      const timeDiff = Date.now() - message.timestamp.getTime();
      const oneMinute = 60 * 1000; // 1 minute in milliseconds
      
      if (timeDiff <= oneMinute) {
        message.originalContent = message.content;
        message.content = newContent;
        message.edited = true;
        message.editTimestamp = new Date();
        
        // Broadcast edited message
        io.to(message.chatId).emit('messageEdited', message);
        console.log(`✏️ Message edited: ${messageId}`);
        
        // Save messages to file after editing
        saveData();
      } else {
        socket.emit('editError', { message: 'Message can only be edited within 1 minute' });
      }
    }
  });

  // Delete message
  socket.on('deleteMessage', (data: { messageId: string, senderId: string }) => {
    const { messageId, senderId } = data;
    const message = messages.find(m => m.id === messageId);
    
    if (message && message.senderId === senderId) {
      message.deleted = true;
      message.content = "This message was deleted";
      
      // Broadcast deleted message
      io.to(message.chatId).emit('messageDeleted', message);
      console.log(`🗑️ Message deleted: ${messageId}`);
      
      // Save messages to file after deleting
      saveData();
    }
  });

  // Create group
  socket.on('createGroup', (data: { name: string, description: string, members: string[], createdBy: string }) => {
    const { name, description, members, createdBy } = data;
    
    const group: Group = {
      id: uuidv4(),
      name,
      description,
      members: [...members, createdBy],
      admins: [createdBy],
      createdBy,
      createdAt: new Date()
    };

    groups.push(group);

    // Create chat room for group
    const chatRoom: ChatRoom = {
      id: group.id,
      type: "group",
      name: group.name,
      participants: group.members,
      createdBy,
      createdAt: new Date(),
      lastMessageAt: new Date()
    };

    chatRooms.push(chatRoom);

    // Add all members to the socket room
    group.members.forEach(memberId => {
      const memberSocketId = onlineUsers.get(memberId);
      if (memberSocketId) {
        io.sockets.sockets.get(memberSocketId)?.join(group.id);
      }
    });

    // Broadcast new group to all members
    io.to(group.id).emit('groupCreated', group);
    console.log(`👥 Group created: ${name}`);
    
    // Save data after creating group
    saveData();
  });

  // Join group
  socket.on('joinGroup', (data: { groupId: string, userId: string }) => {
    const { groupId, userId } = data;
    const group = groups.find(g => g.id === groupId);
    
    if (group && !group.members.includes(userId)) {
      group.members.push(userId);
      socket.join(groupId);
      
      // Broadcast user joined
      io.to(groupId).emit('userJoinedGroup', { groupId, userId });
      console.log(`👤 User ${userId} joined group ${group.name}`);
      
      // Save data after user joins group
      saveData();
    }
  });

  // Leave group
  socket.on('leaveGroup', (data: { groupId: string, userId: string }) => {
    const { groupId, userId } = data;
    const group = groups.find(g => g.id === groupId);
    
    if (group && group.members.includes(userId)) {
      group.members = group.members.filter(id => id !== userId);
      group.admins = group.admins.filter(id => id !== userId);
      socket.leave(groupId);
      
      // Broadcast user left
      io.to(groupId).emit('userLeftGroup', { groupId, userId });
      console.log(`👤 User ${userId} left group ${group.name}`);
      
      // Save data after user leaves group
      saveData();
    }
  });

  // Typing indicator
  socket.on('typing', (data: { chatId: string, userId: string, isTyping: boolean }) => {
    socket.to(data.chatId).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    // Find and update user status
    for (const [userId, socketId] of Array.from(onlineUsers.entries())) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        const user = chatUsers.find(u => u.id === userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          
          // Notify others that user is offline
          socket.broadcast.emit('userStatusChange', {
            userId,
            isOnline: false,
            lastSeen: user.lastSeen
          });
        }
        break;
      }
    }
  });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let response;
    
    if (model === 'gemini') {
      // Mock Gemini AI response (for testing without API key)
      if (!gemini) {
        console.log('🤖 Using mock AI response (no API key configured)');
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        
        // Generate contextual responses based on message content
        if (lastMessage.includes('hello') || lastMessage.includes('hi')) {
          response = "Hello! I'm your AI assistant. How can I help you today?";
        } else if (lastMessage.includes('help')) {
          response = "I'm here to help! I can assist with tasks, answer questions, and provide information. What would you like to know?";
        } else if (lastMessage.includes('task') || lastMessage.includes('project')) {
          response = "I can help you manage tasks and projects. Would you like me to create a task, update a project status, or help with project planning?";
        } else if (lastMessage.includes('thank')) {
          response = "You're welcome! I'm always here to help. Is there anything else you'd like assistance with?";
        } else if (lastMessage.includes('how are you')) {
          response = "I'm doing great! I'm an AI assistant designed to help you with various tasks. How can I assist you today?";
        } else if (lastMessage.includes('what can you do')) {
          response = "I can help you with:\n• Task and project management\n• Answering questions\n• Providing information\n• Chat and conversation\n• Problem solving\n\nWhat would you like help with?";
        } else {
          response = `I understand you said: "${messages[messages.length - 1].content}". That's interesting! Could you tell me more about what you'd like help with?`;
        }
        
        console.log('✅ Mock AI response generated successfully');
      } else {
        try {
          const geminiModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          // For now, just use the last message to test
          const lastMessage = messages[messages.length - 1].content;
          
          const result = await geminiModel.generateContent(lastMessage);
          response = result.response.text();
          
          console.log('✅ Gemini AI response generated successfully');
        } catch (geminiError) {
          console.error('❌ Gemini AI error:', geminiError);
          return res.status(500).json({ 
            error: 'Gemini AI error', 
            details: geminiError.message 
          });
        }
      }
      
    } else if (model === 'openai') {
      // Mock OpenAI response (for testing without API key)
      if (!openai) {
        console.log('🤖 Using mock OpenAI response (no API key configured)');
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        
        if (lastMessage.includes('hello') || lastMessage.includes('hi')) {
          response = "Hello! I'm ChatGPT, your AI assistant. How can I help you today?";
        } else if (lastMessage.includes('help')) {
          response = "I'm here to help! I can assist with various tasks, answer questions, and provide detailed information. What would you like to know?";
        } else {
          response = `I understand you said: "${messages[messages.length - 1].content}". I'm ChatGPT and I'm here to help! What can I assist you with?`;
        }
        
        console.log('✅ Mock OpenAI response generated successfully');
      } else {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        response = completion.choices[0]?.message?.content || 'No response generated';
      }
      
    } else if (model === 'cohere') {
      // Mock Cohere AI response (for testing without API key)
      const cohereApiKey = process.env.COHERE_API_KEY;
      if (!cohereApiKey) {
        console.log('🤖 Using mock Cohere AI response (no API key configured)');
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        
        if (lastMessage.includes('hello') || lastMessage.includes('hi')) {
          response = "Hello! I'm Cohere AI, your intelligent assistant. How can I help you today?";
        } else if (lastMessage.includes('help')) {
          response = "I'm here to help! I can assist with various tasks, answer questions, and provide intelligent responses. What would you like to know?";
        } else {
          response = `I understand you said: "${messages[messages.length - 1].content}". I'm Cohere AI and I'm here to help! What can I assist you with?`;
        }
        
        console.log('✅ Mock Cohere AI response generated successfully');
      } else {
      
      const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messages[messages.length - 1].content,
          model: 'command',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      
      if (!cohereResponse.ok) {
        throw new Error(`Cohere API responded with status: ${cohereResponse.status}`);
      }
      
      const cohereData = await cohereResponse.json();
      response = cohereData.text || 'No response generated from Cohere';
      }
      
    } else if (model === 'deepai') {
      // Mock DeepAI response (for testing without API key)
      const deepaiApiKey = process.env.DEEPAI_API_KEY;
      if (!deepaiApiKey) {
        console.log('🤖 Using mock DeepAI response (no API key configured)');
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        
        if (lastMessage.includes('hello') || lastMessage.includes('hi')) {
          response = "Hello! I'm DeepAI, your advanced AI assistant. How can I help you today?";
        } else if (lastMessage.includes('help')) {
          response = "I'm here to help! I can assist with various tasks, answer questions, and provide advanced AI responses. What would you like to know?";
        } else {
          response = `I understand you said: "${messages[messages.length - 1].content}". I'm DeepAI and I'm here to help! What can I assist you with?`;
        }
        
        console.log('✅ Mock DeepAI response generated successfully');
      } else {
      
      const deepaiResponse = await fetch('https://api.deepai.org/api/text-generator', {
        method: 'POST',
        headers: {
          'api-key': deepaiApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messages[messages.length - 1].content,
          model: 'text-generator',
        }),
      });
      
      if (!deepaiResponse.ok) {
        throw new Error(`DeepAI API responded with status: ${deepaiResponse.status}`);
      }
      
      const deepaiData = await deepaiResponse.json();
      response = deepaiData.output || 'No response generated from DeepAI';
      }
      
    } else {
      return res.status(400).json({ error: 'Unsupported model' });
    }

    res.json({ response });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// Fallback task generation when AI services are not available
function generateFallbackTask(query: string, context: any): string {
  const isRandomTask = query.toLowerCase().includes('random');
  const currentDate = context?.currentDate || new Date().toISOString().split('T')[0];
  
  // Sample task templates for random generation
  const taskTemplates = [
    {
      title: "Review and update project documentation",
      description: "Go through all project documentation and ensure it's up to date with the latest changes. Update any outdated information and add missing details.",
      priority: "Medium",
      status: "upcoming",
      estimatedHours: 4,
      tags: ["documentation", "review", "maintenance"]
    },
    {
      title: "Conduct team performance review",
      description: "Schedule and conduct quarterly performance reviews with team members. Prepare feedback and development plans for each team member.",
      priority: "High",
      status: "upcoming", 
      estimatedHours: 6,
      tags: ["hr", "performance", "review"]
    },
    {
      title: "Optimize database queries",
      description: "Analyze slow database queries and optimize them for better performance. Update indexes and query structures as needed.",
      priority: "Medium",
      status: "upcoming",
      estimatedHours: 8,
      tags: ["database", "optimization", "performance"]
    },
    {
      title: "Create marketing campaign for Q1",
      description: "Develop a comprehensive marketing campaign for Q1 including content strategy, social media plan, and advertising budget.",
      priority: "High",
      status: "upcoming",
      estimatedHours: 12,
      tags: ["marketing", "campaign", "strategy"]
    },
    {
      title: "Implement user feedback improvements",
      description: "Review recent user feedback and implement the most requested improvements to enhance user experience.",
      priority: "Medium",
      status: "upcoming",
      estimatedHours: 6,
      tags: ["feedback", "improvements", "ux"]
    }
  ];

  let task;
  
  if (isRandomTask) {
    // Pick a random template
    task = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
  } else {
    // Try to extract information from the query
    const queryLower = query.toLowerCase();
    
    // Determine priority
    let priority = "Medium";
    if (queryLower.includes('urgent') || queryLower.includes('high priority') || queryLower.includes('asap')) {
      priority = "High";
    } else if (queryLower.includes('low priority') || queryLower.includes('when possible')) {
      priority = "Low";
    }
    
    // Determine status
    let status = "upcoming";
    if (queryLower.includes('start') || queryLower.includes('begin')) {
      status = "in-progress";
    }
    
    // Extract title (first sentence or use query)
    let title = query.split('.')[0].trim();
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }
    
    // Create description
    let description = query;
    if (query.length < 50) {
      description = `Complete the following task: ${query}. Ensure all requirements are met and quality standards are maintained.`;
    }
    
    task = {
      title,
      description,
      priority,
      status,
      estimatedHours: Math.max(2, Math.min(8, Math.ceil(query.length / 20))),
      tags: extractTags(query)
    };
  }
  
  // Add assigned user if available
  if (context?.availableUsers && context.availableUsers.length > 0) {
    const randomUser = context.availableUsers[Math.floor(Math.random() * context.availableUsers.length)];
    task.assignedTo = randomUser.name;
  } else {
    task.assignedTo = "unassigned";
  }
  
  // Add dates
  const startDate = new Date(currentDate);
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + Math.max(1, Math.ceil(task.estimatedHours / 4))); // Due in 1-2 days based on estimated hours
  
  task.startDate = startDate.toISOString().split('T')[0];
  task.dueDate = dueDate.toISOString().split('T')[0];
  
  console.log('🤖 Generated fallback task:', task);
  return JSON.stringify(task);
}

function extractTags(query: string): string[] {
  const tags: string[] = [];
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('review') || queryLower.includes('check')) tags.push('review');
  if (queryLower.includes('update') || queryLower.includes('modify')) tags.push('update');
  if (queryLower.includes('create') || queryLower.includes('make')) tags.push('creation');
  if (queryLower.includes('fix') || queryLower.includes('bug')) tags.push('bugfix');
  if (queryLower.includes('test') || queryLower.includes('testing')) tags.push('testing');
  if (queryLower.includes('document') || queryLower.includes('doc')) tags.push('documentation');
  if (queryLower.includes('meeting') || queryLower.includes('call')) tags.push('meeting');
  if (queryLower.includes('email') || queryLower.includes('message')) tags.push('communication');
  
  return tags.length > 0 ? tags : ['general'];
}

// Task Management endpoints
app.get('/api/tasks', (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    
    // Load from global tasks.json file only
    const globalTasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    let allTasks: any[] = [];
    
    if (fs.existsSync(globalTasksPath)) {
      const globalTasks = JSON.parse(fs.readFileSync(globalTasksPath, 'utf8'));
      // Filter tasks by organizationId if provided
      if (organizationId) {
        allTasks = globalTasks.filter((task: any) => task.organizationId === organizationId);
      } else {
        allTasks = globalTasks;
      }
    }
    
    res.json(allTasks);
  } catch (error) {
    console.error('❌ Failed to load tasks:', error);
    res.json([]);
  }
});

// Get projects for a specific organization
app.get('/api/organizations/:orgId/projects', (req, res) => {
  try {
    const { orgId } = req.params;
    const projectsDir = path.join(process.cwd(), 'data', 'organizations', orgId, 'projects');
    
    if (!fs.existsSync(projectsDir)) {
      return res.json([]);
    }
    
    const projectFiles = fs.readdirSync(projectsDir).filter(file => file.endsWith('.json'));
    const projects = projectFiles.map(file => {
      const filePath = path.join(projectsDir, file);
      const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return projectData;
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// Enhanced project-task API endpoints

app.get('/api/milestones', (req, res) => {
  try {
    const projectId = req.query.projectId as string;
    let milestones = [];
    
    if (fs.existsSync(path.join(process.cwd(), 'data', 'milestones.json'))) {
      milestones = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'milestones.json'), 'utf8'));
    }
    
    if (projectId) {
      milestones = milestones.filter((m: any) => m.projectId === projectId);
    }
    
    res.json(milestones);
  } catch (error) {
    console.error('Error reading milestones:', error);
    res.status(500).json({ error: 'Failed to read milestones' });
  }
});

app.post('/api/milestones', (req, res) => {
  try {
    // Return success since we deleted milestones.json
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  try {
    // Return empty array since we deleted notifications.json
    res.json([]);
  } catch (error) {
    console.error('Error reading notifications:', error);
    res.status(500).json({ error: 'Failed to read notifications' });
  }
});

app.post('/api/notifications', (req, res) => {
  try {
    // Return success since we deleted notifications.json
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.patch('/api/notifications/:id/read', (req, res) => {
  try {
    // Return success since we deleted notifications.json
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.patch('/api/notifications/mark-all-read', (req, res) => {
  try {
    // Return success since we deleted notifications.json
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

app.delete('/api/notifications/:id', (req, res) => {
  try {
    // Return success since we deleted notifications.json
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Notification preferences
app.get('/api/notification-preferences', (req, res) => {
  try {
    // Return default preferences since we deleted notification-preferences.json
    res.json({
      inApp: true,
      email: true,
      push: false,
      taskAssigned: true,
      taskDueSoon: true,
      projectChanged: true,
      dependencyUnblocked: true,
      milestoneReached: true,
      projectCompleted: true
    });
  } catch (error) {
    console.error('Error reading notification preferences:', error);
    res.status(500).json({ error: 'Failed to read notification preferences' });
  }
});

app.put('/api/notification-preferences', (req, res) => {
  try {
    // Return success since we deleted notification-preferences.json
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Check for due soon notifications
app.get('/api/notifications/check-due-soon', (req, res) => {
  try {
    // Return empty array since we deleted tasks.json
    res.json([]);
  } catch (error) {
    console.error('Error checking due soon notifications:', error);
    res.status(500).json({ error: 'Failed to check due soon notifications' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    // Validate required fields
    if (!req.body.projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!req.body.organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Load project from organization-specific project file
    const projectFilePath = path.join(process.cwd(), 'data', 'organizations', req.body.organizationId, 'projects', `${req.body.projectId}.json`);
    if (!fs.existsSync(projectFilePath)) {
      return res.status(400).json({ error: 'Project not found' });
    }

    const project = JSON.parse(fs.readFileSync(projectFilePath, 'utf8'));

    // Check no-self assignment rule based on user role
    const organizations = readOrganizations();
    const organization = organizations.find(org => org.id === req.body.organizationId);
    
    if (organization && req.body.assignedTo && req.body.assignedTo.id) {
      // Find user's role in the organization
      const member = organization.members?.find(m => m.userId === req.body.createdBy);
      const userRole = member?.role || (organization.createdBy === req.body.createdBy ? 'super_admin' : null);
      
      // Check if user has a role that cannot assign tasks to themselves
      const rolesWithNoSelfAssignment = ['super_admin', 'admin', 'manager'];
      if (userRole && rolesWithNoSelfAssignment.includes(userRole)) {
        if (req.body.assignedTo.id === req.body.createdBy.toString()) {
          const roleNames = {
            'super_admin': 'Super Admin',
            'admin': 'Admin', 
            'manager': 'Manager'
          };
          return res.status(400).json({ 
            error: `${roleNames[userRole]}s cannot assign tasks to themselves in this organization. Please assign tasks to other team members.`
          });
        }
      }
    }

    // Validate task dates against project boundaries
    if (req.body.dueDate) {
      const taskDueDate = new Date(req.body.dueDate);
      const projectDueDate = new Date(project.deadline);
      
      if (taskDueDate > projectDueDate) {
        return res.status(400).json({ 
          error: `Task due date cannot exceed project due date (${projectDueDate.toLocaleDateString()})`,
          suggestedDate: projectDueDate.toISOString().split('T')[0]
        });
      }
    }

    if (req.body.startDate && project.startDate) {
      const taskStartDate = new Date(req.body.startDate);
      const projectStartDate = new Date(project.startDate);
      
      if (taskStartDate < projectStartDate) {
        return res.status(400).json({ 
          error: `Task start date cannot be before project start date (${projectStartDate.toLocaleDateString()})`,
          suggestedDate: projectStartDate.toISOString().split('T')[0]
        });
      }
    }

    const newTask = {
      id: `task${Date.now()}`,
      taskName: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo === 'unassigned' ? 'Unassigned' : (req.body.assignedTo?.name || 'Unassigned'),
      deadline: req.body.dueDate,
      startDate: req.body.startDate,
      status: req.body.status?.name || 'Pending',
      priority: req.body.priority?.name || 'Medium',
      estimatedHours: req.body.estimatedHours || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add task to project's tasks array
    project.tasks = project.tasks || [];
    project.tasks.push(newTask);
    project.updatedAt = new Date().toISOString();

    // Save updated project file
    fs.writeFileSync(projectFilePath, JSON.stringify(project, null, 2));
    
    // Also save to global tasks.json for consistency
    const globalTasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    let globalTasks: any[] = [];
    
    try {
      if (fs.existsSync(globalTasksPath)) {
        globalTasks = JSON.parse(fs.readFileSync(globalTasksPath, 'utf8'));
      }
    } catch (error) {
      console.log('Could not load global tasks.json:', error);
    }
    
    // Add task to global tasks array
    const globalTask = {
      ...newTask,
      projectId: req.body.projectId,
      projectName: project.projectName,
      organizationId: req.body.organizationId
    };
    globalTasks.push(globalTask);
    
    // Save global tasks
    fs.writeFileSync(globalTasksPath, JSON.stringify(globalTasks, null, 2));
    
    // Create activity/inbox message for task creation
    const activity = {
      id: `activity_${Date.now()}`,
      type: 'project',
      title: `New Task Created: ${newTask.taskName}`,
      description: `Task "${newTask.taskName}" has been created in project "${project.projectName}"${newTask.description ? ` - ${newTask.description}` : ''}`,
      timestamp: new Date().toISOString(),
      priority: 'medium',
      status: 'completed',
      user: {
        id: req.body.createdBy || 'system',
        name: req.body.createdBy || 'System',
        role: 'admin'
      },
      metadata: {
        taskId: newTask.id,
        projectId: req.body.projectId,
        organizationId: req.body.organizationId,
        action: 'created'
      },
      isRead: false
    };
    
    // Save activity to organization-specific activities file
    const activitiesDir = path.join(process.cwd(), 'data', 'organizations', req.body.organizationId);
    if (!fs.existsSync(activitiesDir)) {
      fs.mkdirSync(activitiesDir, { recursive: true });
    }
    
    const activitiesPath = path.join(activitiesDir, 'activities.json');
    let activities: any[] = [];
    try {
      if (fs.existsSync(activitiesPath)) {
        activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading activities file:', error);
    }
    
    activities.unshift(activity);
    fs.writeFileSync(activitiesPath, JSON.stringify(activities, null, 2));
    
    res.status(201).json(globalTask);
  } catch (error) {
    console.error('❌ Failed to create task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    let tasks: Task[] = [];
    
    try {
      tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    } catch (error) {
      return res.status(404).json({ error: 'Tasks file not found' });
    }
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const oldStatus = tasks[taskIndex].status;
    const newStatus = updates.status;
    
    // Add completedAt timestamp when task moves to Completed status
    if (newStatus === 'Completed' && oldStatus !== 'Completed' && !tasks[taskIndex].completedAt) {
      updates.completedAt = new Date().toISOString();
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Emit real-time update for analytics velocity chart
    if ((tasks[taskIndex] as any).organizationId) {
      io.to((tasks[taskIndex] as any).organizationId).emit('analytics:velocity:updated', { 
        orgId: (tasks[taskIndex] as any).organizationId,
        projectId: (tasks[taskIndex] as any).projectId 
      });
    }
    
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    res.json(tasks[taskIndex]);
  } catch (error) {
    console.error('❌ Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    
    const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    let tasks: Task[] = [];
    
    try {
      if (fs.existsSync(tasksPath)) {
        tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      }
    } catch (error) {
      return res.status(404).json({ error: 'Tasks file not found' });
    }
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    
    // Also remove from organization-specific project file if it exists
    if ((deletedTask as any).projectId) {
      // Find the organization for this project
      const projectsDir = path.join(process.cwd(), 'data', 'organizations');
      if (fs.existsSync(projectsDir)) {
        const orgDirs = fs.readdirSync(projectsDir);
        for (const orgDir of orgDirs) {
          const projectFilePath = path.join(projectsDir, orgDir, 'projects', `${(deletedTask as any).projectId}.json`);
          if (fs.existsSync(projectFilePath)) {
            const project = JSON.parse(fs.readFileSync(projectFilePath, 'utf8'));
            if (project.tasks) {
              project.tasks = project.tasks.filter((task: any) => task.id !== taskId);
              project.updatedAt = new Date().toISOString();
              fs.writeFileSync(projectFilePath, JSON.stringify(project, null, 2));
            }
            break;
          }
        }
      }
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Organization Management API Endpoints
app.get('/api/organizations', (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    // Filter organizations based on user access
    const accessibleOrganizations = organizations.filter(org => {
      // User is the owner
      if (org.createdBy === userId) {
        return true;
      }
      
      // Check if user has access through invitation system
      const access = organizationAccess.find(
        a => a.organizationId === org.id && a.userId === userId && a.status === 'active'
      );
      
      if (access) {
        return true;
      }
      
      // Check if user has access through old members system (for backward compatibility)
      const memberAccess = org.members?.find(
        m => m.userId === userId && m.status === 'active'
      );
      
      return !!memberAccess;
    });

    console.log('📋 GET /api/organizations - User:', userId, 'has access to', accessibleOrganizations.length, 'out of', organizations.length, 'organizations');
    res.json(accessibleOrganizations);
  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

app.post('/api/organizations', (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    
    if (!name || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Organization name and creator ID are required"
      });
    }
    
    // Check if organization name already exists
    const existingOrg = organizations.find(org => org.name.toLowerCase() === name.toLowerCase());
    if (existingOrg) {
      return res.status(409).json({
        success: false,
        error: "Organization with this name already exists"
      });
    }
    
    const newOrg = {
      id: Date.now().toString(),
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      members: [
        {
          userId: createdBy,
          role: 'super_admin' as const, // Creator becomes Super Admin
          joinedAt: new Date().toISOString(),
          status: 'active' as const
        }
      ],
      invitations: [],
      memberCount: 1,
      settings: {
        allowGuestAccess: false,
        requireEmailVerification: true,
        defaultRole: 'member',
        maxMembers: 100,
        features: {
          projects: true,
          tasks: true,
          chat: true,
          reports: true,
          integrations: true
        }
      }
    };
    
    organizations.push(newOrg);
    
    // Add creator to organization access
    organizationAccess.push({
      organizationId: newOrg.id,
      userId: createdBy,
      role: 'super_admin',
      status: 'active',
      joinedAt: new Date().toISOString(),
      invitedBy: createdBy
    });
    
    // Create organization-specific directory structure
    const orgDir = path.join(process.cwd(), 'data', 'organizations', newOrg.id);
    const projectsDir = path.join(orgDir, 'projects');
    const activitiesPath = path.join(orgDir, 'activities.json');
    
    try {
      // Create organization directory
      if (!fs.existsSync(orgDir)) {
        fs.mkdirSync(orgDir, { recursive: true });
      }
      
      // Create projects subdirectory
      if (!fs.existsSync(projectsDir)) {
        fs.mkdirSync(projectsDir, { recursive: true });
      }
      
      // Create empty activities file
      fs.writeFileSync(activitiesPath, JSON.stringify([], null, 2));
      
      console.log('✅ Organization directory structure created:', orgDir);
    } catch (error) {
      console.log('Could not create organization directory structure:', error);
    }
    
    // Save to organizations.json
    try {
      const orgPath = path.join(process.cwd(), 'data/organizations.json');
      fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));
      console.log('✅ Organizations saved to organizations.json');
    } catch (error) {
      console.log('Could not save organizations.json:', error);
    }
    
    console.log('✅ Organization created:', newOrg.name, 'by user', createdBy);
    res.status(201).json({
      success: true,
      organization: newOrg
    });
  } catch (error) {
    console.error('❌ Error creating organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create organization'
    });
  }
});

app.get('/api/organizations/:id', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const organization = organizations.find(org => org.id === id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      organization
    });
  } catch (error) {
    console.error('❌ Error fetching organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization'
    });
  }
});

app.put('/api/organizations/:id', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, settings } = req.body;
    
    const orgIndex = organizations.findIndex(org => org.id === id);
    if (orgIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    // Update organization
    if (name) organizations[orgIndex].name = name;
    if (description !== undefined) organizations[orgIndex].description = description;
    if (settings) organizations[orgIndex].settings = { ...organizations[orgIndex].settings, ...settings };
    
    // Save to organizations.json
    try {
      const orgPath = path.join(process.cwd(), 'data/organizations.json');
      fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));
      console.log('✅ Organizations updated in organizations.json');
    } catch (error) {
      console.log('Could not save organizations.json:', error);
    }
    
    res.json({
      success: true,
      organization: organizations[orgIndex]
    });
  } catch (error) {
    console.error('❌ Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization'
    });
  }
});

app.delete('/api/organizations/:id', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const orgIndex = organizations.findIndex(org => org.id === id);
    
    if (orgIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const deletedOrg = organizations.splice(orgIndex, 1)[0];
    
    // Save to organizations.json
    try {
      const orgPath = path.join(process.cwd(), 'data/organizations.json');
      fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));
      console.log('✅ Organizations updated in organizations.json');
    } catch (error) {
      console.log('Could not save organizations.json:', error);
    }
    
    console.log('✅ Organization deleted:', deletedOrg.name);
    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete organization'
    });
  }
});

// Organization Member Management endpoints

// Organization Dashboard/Home endpoints
app.get('/api/organizations/:id/stats', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    console.log(`📊 Stats request for organization ID: ${id}`);
    console.log(`📊 Available organizations:`, organizations.map(org => ({ id: org.id, name: org.name })));
    
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      console.log(`❌ Organization with ID ${id} not found`);
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    console.log(`✅ Found organization: ${org.name} (${org.id})`);
    
    // Calculate real stats from organization data
    const projectsDir = path.join(process.cwd(), 'data', 'organizations', id, 'projects');
    const globalTasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    
    let totalProjects = 0;
    let activeProjects = 0;
    let completedProjects = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    
    // Count projects
    if (fs.existsSync(projectsDir)) {
      const projectFiles = fs.readdirSync(projectsDir).filter(file => file.endsWith('.json'));
      totalProjects = projectFiles.length;
      
      // Count active and completed projects
      projectFiles.forEach(file => {
        const filePath = path.join(projectsDir, file);
        const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (projectData.status === 'active' || projectData.status === 'in-progress') {
          activeProjects++;
        } else if (projectData.status === 'completed' || projectData.status === 'done') {
          completedProjects++;
        }
      });
    }
    
    // Count tasks
    if (fs.existsSync(globalTasksPath)) {
      const globalTasks = JSON.parse(fs.readFileSync(globalTasksPath, 'utf8'));
      const orgTasks = globalTasks.filter((task: any) => task.organizationId === id);
      totalTasks = orgTasks.length;
      
      // Count completed and overdue tasks
      const now = new Date();
      orgTasks.forEach((task: any) => {
        if (task.status === 'completed' || task.status === 'done') {
          completedTasks++;
        }
        if (task.deadline && new Date(task.deadline) < now && task.status !== 'completed' && task.status !== 'done') {
          overdueTasks++;
        }
      });
    }
    
    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      teamMembers: org.memberCount,
      productivityScore: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      averageTaskCompletionTime: 0, // Would need more complex calculation
      projectSuccessRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching organization stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/organizations/:id/activities', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Load activities from organization-specific activities file
    const activitiesPath = path.join(process.cwd(), 'data', 'organizations', id, 'activities.json');
    let activities: any[] = [];
    
    if (fs.existsSync(activitiesPath)) {
      try {
        activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
      } catch (error) {
        console.error('Error reading activities file:', error);
        activities = [];
      }
    }
    
    res.json(activities);
  } catch (error) {
    console.error('❌ Error fetching organization activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Organization Inbox endpoints
app.get('/api/organizations/:id/inbox', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Load activities from organization-specific activities file
    const activitiesPath = path.join(process.cwd(), 'data', 'organizations', id, 'activities.json');
    let activities: any[] = [];
    
    try {
      if (fs.existsSync(activitiesPath)) {
        activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading activities file:', error);
    }
    
    res.json(activities);
  } catch (error) {
    console.error('❌ Error fetching organization inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox messages' });
  }
});

// Organization Inbox Message Actions
app.patch('/api/organizations/:id/inbox/:messageId', (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { action } = req.body;
    
    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Mock message action handling - in real app, update message in database
    console.log(`📧 Message action: ${action} for message ${messageId} in org ${id}`);
    
    // For now, just return success
    res.json({ 
      success: true, 
      message: `Message ${action} successfully`,
      messageId,
      action 
    });
  } catch (error) {
    console.error('❌ Error updating inbox message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Organization Insights endpoints


// Organization Goals endpoints
app.get('/api/organizations/:id/goals', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Mock goals - in real app, fetch from goals table
    const goals = [
      {
        id: '1',
        title: 'Increase Customer Satisfaction',
        description: 'Improve overall customer satisfaction scores across all touchpoints',
        category: 'company',
        priority: 'high',
        status: 'active',
        progress: 75,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        owner: { id: '1', name: 'Project Owner', role: 'Owner' },
        keyResults: [
          {
            id: '1',
            title: 'Achieve 90% customer satisfaction score',
            description: 'Based on quarterly surveys',
            target: 90,
            current: 78,
            unit: '%',
            status: 'on_track',
            dueDate: '2024-12-31',
            owner: { id: '2', name: 'Manager', role: 'Manager' },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        ],
        tags: ['customer', 'satisfaction', 'support'],
        isStarred: true,
        isArchived: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
    
    res.json(goals);
  } catch (error) {
    console.error('❌ Error fetching organization goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Organization Portfolios endpoints
app.get('/api/organizations/:id/portfolios', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Mock portfolios - in real app, fetch from portfolios table
    const portfolios = [
      {
        id: '1',
        name: 'Q1 Strategic Initiatives',
        description: 'High-priority strategic projects for Q1 2024',
        type: 'strategic',
        status: 'active',
        visibility: 'private',
        projects: [],
        owner: { id: '1', name: 'Project Owner', role: 'Owner' },
        stakeholders: [],
        tags: ['strategic', 'q1', 'priority'],
        isStarred: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
    
    res.json(portfolios);
  } catch (error) {
    console.error('❌ Error fetching organization portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// Comprehensive Organization CRUD endpoints
app.get('/api/organizations/:id/projects', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { limit = 10, sort = 'createdAt:desc' } = req.query;
    
    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Load projects from organization-specific directory
    const projectsDir = path.join(process.cwd(), 'data', 'organizations', id, 'projects');
    let allProjects: any[] = [];
    
    if (fs.existsSync(projectsDir)) {
      const projectFiles = fs.readdirSync(projectsDir).filter(file => file.endsWith('.json'));
      
      const orgProjects = projectFiles.map(file => {
        const filePath = path.join(projectsDir, file);
        const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return projectData;
      });
      
      allProjects = orgProjects;
    }
    
    // Apply sorting
    let sortedProjects = [...allProjects];
    if (sort && typeof sort === 'string') {
      const [field, direction] = sort.split(':');
      sortedProjects.sort((a, b) => {
        const aVal = a[field as keyof typeof a];
        const bVal = b[field as keyof typeof b];
        if (direction === 'desc') {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
      });
    }
    
    // Apply limit
    const limitedProjects = sortedProjects.slice(0, Number(limit));
    
    res.json(limitedProjects);
  } catch (error) {
    console.error('❌ Error fetching organization projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/organizations/:id/projects', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const newProject = {
      ...req.body,
      id: Date.now().toString(),
      organizationId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In real app, save to database
    res.status(201).json(newProject);
  } catch (error) {
    console.error('❌ Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/organizations/:id/projects/:projectId', (req, res) => {
  try {
    const { id, projectId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const updatedProject = {
      ...req.body,
      id: projectId,
      organizationId: id,
      updatedAt: new Date().toISOString()
    };
    
    // In real app, update in database
    res.json(updatedProject);
  } catch (error) {
    console.error('❌ Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/organizations/:id/projects/:projectId', (req, res) => {
  try {
    const { id, projectId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // In real app, delete from database
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Organization Tasks endpoints
app.get('/api/organizations/:id/tasks', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { limit = 10, status, sort = 'dueDate:asc' } = req.query;
    
    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Load tasks from global tasks.json filtered by organizationId
    const globalTasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    let allTasks: any[] = [];
    
    if (fs.existsSync(globalTasksPath)) {
      const globalTasks = JSON.parse(fs.readFileSync(globalTasksPath, 'utf8'));
      // Filter tasks by organizationId
      allTasks = globalTasks.filter((task: any) => task.organizationId === id);
    }
    
    // Filter by status if provided
    let filteredTasks = allTasks;
    if (status) {
      filteredTasks = allTasks.filter(task => task.status === status);
    }
    
    // Apply sorting
    let sortedTasks = [...filteredTasks];
    if (sort && typeof sort === 'string') {
      const [field, direction] = (sort as string).split(':');
      sortedTasks.sort((a, b) => {
        const aVal = a[field as keyof typeof a];
        const bVal = b[field as keyof typeof b];
        if (direction === 'desc') {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
      });
    }
    
    // Apply limit
    const limitedTasks = sortedTasks.slice(0, Number(limit));
    
    res.json(limitedTasks);
  } catch (error) {
    console.error('❌ Error fetching organization tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/organizations/:id/tasks', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const newTask = {
      ...req.body,
      id: Date.now().toString(),
      organizationId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/organizations/:id/tasks/:taskId', (req, res) => {
  try {
    const { id, taskId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const updatedTask = {
      ...req.body,
      id: taskId,
      organizationId: id,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedTask);
  } catch (error) {
    console.error('❌ Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/organizations/:id/tasks/:taskId', (req, res) => {
  try {
    const { id, taskId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Organization Goals endpoints
app.post('/api/organizations/:id/goals', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const newGoal = {
      ...req.body,
      id: Date.now().toString(),
      organizationId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('❌ Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.put('/api/organizations/:id/goals/:goalId', (req, res) => {
  try {
    const { id, goalId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const updatedGoal = {
      ...req.body,
      id: goalId,
      organizationId: id,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedGoal);
  } catch (error) {
    console.error('❌ Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/organizations/:id/goals/:goalId', (req, res) => {
  try {
    const { id, goalId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Organization Portfolios CRUD endpoints
app.post('/api/organizations/:id/portfolios', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const newPortfolio = {
      ...req.body,
      id: Date.now().toString(),
      organizationId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(newPortfolio);
  } catch (error) {
    console.error('❌ Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

app.put('/api/organizations/:id/portfolios/:portfolioId', (req, res) => {
  try {
    const { id, portfolioId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const updatedPortfolio = {
      ...req.body,
      id: portfolioId,
      organizationId: id,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedPortfolio);
  } catch (error) {
    console.error('❌ Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

app.delete('/api/organizations/:id/portfolios/:portfolioId', (req, res) => {
  try {
    const { id, portfolioId } = req.params;
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting portfolio:', error);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

// Export endpoints
app.get('/api/organizations/:id/:resource/export', (req, res) => {
  try {
    const { id, resource } = req.params;
    const { format = 'csv' } = req.query;
    
    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Mock export data
    const exportData = {
      csv: 'text/csv',
      pdf: 'application/pdf'
    };
    
    const contentType = exportData[format as keyof typeof exportData] || 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${resource}-${new Date().toISOString().split('T')[0]}.${format}"`);
    
    // In real app, generate actual export file
    res.send(`Mock ${String(format).toUpperCase()} export for ${resource}`);
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Search endpoint
app.get('/api/organizations/:id/search', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { q, type, limit = 10 } = req.query;
    
    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Mock search results
    const searchResults = {
      projects: [
        { id: '1', name: 'Website Redesign', type: 'project', description: 'Complete website overhaul' },
        { id: '2', name: 'Mobile App', type: 'project', description: 'Native mobile application' }
      ],
      tasks: [
        { id: '1', title: 'Design homepage', type: 'task', description: 'Create new homepage design' },
        { id: '2', title: 'Implement API', type: 'task', description: 'Build REST API endpoints' }
      ],
      goals: [
        { id: '1', title: 'Increase user engagement', type: 'goal', description: 'Improve user interaction metrics' }
      ]
    };
    
    const results = type ? searchResults[type as keyof typeof searchResults] || [] : 
      Object.values(searchResults).flat();
    
    res.json({
      query: q,
      results: results.slice(0, Number(limit)),
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error searching:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.post('/api/organizations/:id/invite', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { email, role, invitedBy } = req.body;
    
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    // Check if inviter is admin or super_admin
    const inviter = org.members.find(member => member.userId === invitedBy);
    
    if (!inviter || (inviter.role !== 'admin' && inviter.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can send invitations'
      });
    }

    // Check if user is already a member
    const existingMember = org.members.find(member => member.userId === email);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this organization'
      });
    }

    // Check if invitation already exists
    const existingInvitation = org.invitations.find(inv => inv.email === email);
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: 'Invitation already sent to this email'
      });
    }

    // Create invitation
    const invitation = {
      id: `inv_${Date.now()}`,
      email,
      role,
      invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'pending' as const
    };

    org.invitations.push(invitation);
    org.updatedAt = new Date().toISOString();

    // Save organizations
    const orgPath = path.join(process.cwd(), 'data/organizations.json');
    fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));
    
    console.log(`📧 Invitation sent to ${email} for role ${role} in organization ${org.name}`);
    
    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation
    });
  } catch (error) {
    console.error('❌ Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation'
    });
  }
});

// Get user's pending invitations
app.get('/api/invitations/:userId', (req, res) => {
  try {
    const { userId } = req.params as { userId: string };
    
    // Find user by email or ID
    const user = users.find(u => u.id.toString() === userId || u.email === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all pending invitations for this user
    const userInvitations: any[] = [];
    organizations.forEach(org => {
      const userInvites = org.invitations.filter(inv => 
        inv.email === user.email && inv.status === 'pending'
      );
      userInvites.forEach(invite => {
        userInvitations.push({
          ...invite,
          organization: {
            id: org.id,
            name: org.name,
            description: org.description
          }
        });
      });
    });

    res.json({
      success: true,
      invitations: userInvitations
    });
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

// Accept invitation
app.post('/api/invitations/:invitationId/accept', (req, res) => {
  try {
    const { invitationId } = req.params as { invitationId: string };
    const { userId } = req.body;

    // Find the invitation
    let invitation: any = null;
    let organization: any = null;
    
    for (const org of organizations) {
      const inv = org.invitations.find(inv => inv.id === invitationId);
      if (inv) {
        invitation = inv;
        organization = org;
        break;
      }
    }

    if (!invitation || !organization) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invitation is no longer pending'
      });
    }

    // Add user to organization
    organization.members.push({
      userId: userId,
      role: invitation.role as 'super_admin' | 'admin' | 'manager' | 'member' | 'viewer',
      joinedAt: new Date().toISOString(),
      status: 'active' as const
    });

    // Update invitation status
    invitation.status = 'accepted' as const;
    invitation.acceptedAt = new Date().toISOString();

    // Update member count
    organization.memberCount = organization.members.length;
    organization.updatedAt = new Date().toISOString();

    // Save organizations
    const orgPath = path.join(process.cwd(), 'data/organizations.json');
    fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      organization: {
        id: organization.id,
        name: organization.name
      }
    });
  } catch (error) {
    console.error('❌ Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
});

// Decline invitation
app.post('/api/invitations/:invitationId/decline', (req, res) => {
  try {
    const { invitationId } = req.params as { invitationId: string };

    // Find the invitation
    let invitation: any = null;
    let organization: any = null;
    
    for (const org of organizations) {
      const inv = org.invitations.find(inv => inv.id === invitationId);
      if (inv) {
        invitation = inv;
        organization = org;
        break;
      }
    }

    if (!invitation || !organization) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Update invitation status
    invitation.status = 'declined' as const;
    invitation.declinedAt = new Date().toISOString();
    organization.updatedAt = new Date().toISOString();

    // Save organizations
    const orgPath = path.join(process.cwd(), 'data/organizations.json');
    fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('❌ Error declining invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline invitation'
    });
  }
});

// Get organization members
app.get('/api/organizations/:id/members', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Get member details
    const membersWithDetails = org.members.map(member => {
      const user = users.find(u => u.id.toString() === member.userId);
      return {
        ...member,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        } : null
      };
    });

    res.json({
      success: true,
      members: membersWithDetails
    });
  } catch (error) {
    console.error('❌ Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members'
    });
  }
});

// Update member role
app.put('/api/organizations/:id/members/:userId/role', (req, res) => {
  try {
    const { id, userId } = req.params as { id: string; userId: string };
    const { newRole, updatedBy } = req.body;

    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if updater is admin or super_admin
    const updater = org.members.find(member => member.userId === updatedBy);
    if (!updater || (updater.role !== 'admin' && updater.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can change roles'
      });
    }

    // Find the member to update
    const member = org.members.find(member => member.userId === userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Update role
    member.role = newRole;
    member.updatedAt = new Date().toISOString();
    org.updatedAt = new Date().toISOString();

    // Save organizations
    const orgPath = path.join(process.cwd(), 'data/organizations.json');
    fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating member role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role'
    });
  }
});

// Remove member from organization
app.delete('/api/organizations/:id/members/:userId', (req, res) => {
  try {
    const { id, userId } = req.params as { id: string; userId: string };
    const { removedBy } = req.body;

    const org = organizations.find(org => org.id === id);
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if remover is admin or super_admin
    const remover = org.members.find(member => member.userId === removedBy);
    if (!remover || (remover.role !== 'admin' && remover.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can remove members'
      });
    }

    // Find the member to remove
    const memberIndex = org.members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Remove member
    org.members.splice(memberIndex, 1);
    org.memberCount = org.members.length;
    org.updatedAt = new Date().toISOString();

    // Save organizations
    const orgPath = path.join(process.cwd(), 'data/organizations.json');
    fs.writeFileSync(orgPath, JSON.stringify(organizations, null, 2));

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('❌ Error removing member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member'
    });
  }
});

// Check if user can access organization
app.get('/api/organizations/:id/access/:userId', (req, res) => {
  try {
    const { id, userId } = req.params as { id: string; userId: string };
    const org = organizations.find(org => org.id === id);
    
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    const member = org.members.find(member => member.userId === userId);
    const canAccess = !!member && member.status === 'active';

    res.json({
      success: true,
      canAccess,
      role: member?.role || null,
      organization: {
        id: org.id,
        name: org.name,
        description: org.description
      }
    });
  } catch (error) {
    console.error('❌ Error checking access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check access'
    });
  }
});

// Project Management endpoints
app.get('/api/projects', (req, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    
    let allProjects: any[] = [];
    
    // If organizationId is provided, load only from organization-specific directory
    if (organizationId) {
      const projectsDir = path.join(process.cwd(), 'data', 'organizations', organizationId, 'projects');
      
      if (fs.existsSync(projectsDir)) {
        const projectFiles = fs.readdirSync(projectsDir).filter(file => file.endsWith('.json'));
        
        const orgProjects = projectFiles.map(file => {
          const filePath = path.join(projectsDir, file);
          const projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return projectData;
        });
        
        allProjects = orgProjects;
      }
    } else {
      // If no organizationId, load from global projects.json file
      const globalProjectsPath = path.join(process.cwd(), 'data', 'projects.json');
      
      if (fs.existsSync(globalProjectsPath)) {
        const globalProjects = JSON.parse(fs.readFileSync(globalProjectsPath, 'utf8'));
        allProjects = globalProjects;
      }
    }
    
    res.json(allProjects);
  } catch (error) {
    console.error('❌ Failed to load projects:', error);
    res.json([]); // Return empty array if directory doesn't exist
  }
});

// Analytics Endpoints

// Get user progress for a specific organization
app.get('/api/analytics/user-progress', (req, res) => {
  try {
    const { userId, organizationId } = req.query;
    
    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'userId and organizationId are required' });
    }

    const tasks = (function(){
      try {
        const p = path.join(process.cwd(), 'data', 'tasks.json');
        return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
      } catch { return []; }
    })();
    const projects = (function(){
      try {
        const p = path.join(process.cwd(), 'data', 'projects.json');
        return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
      } catch { return []; }
    })();
    const users = (function(){
      try {
        const p = path.join(process.cwd(), 'public', 'api', 'users.json');
        return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
      } catch { return []; }
    })();
    
    // Filter tasks for the user in the organization
    const userTasks = tasks.filter(task => 
      task.assignedTo === userId && 
      task.organizationId === organizationId
    );

    const completedTasks = userTasks.filter(task => task.status === 'completed').length;
    const totalTasks = userTasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate on-time completion rate
    const completedOnTime = userTasks.filter(task => 
      task.status === 'completed' && 
      task.dueDate && 
      new Date(task.completedAt || '') <= new Date(task.dueDate)
    ).length;
    const onTimeCompletionRate = completedTasks > 0 ? Math.round((completedOnTime / completedTasks) * 100) : 0;

    // Task status breakdown
    const taskStatus = {
      UPCOMING: userTasks.filter(task => task.status === 'upcoming').length,
      IN_PROGRESS: userTasks.filter(task => task.status === 'in-progress').length,
      IN_REVIEW: userTasks.filter(task => task.status === 'review').length,
      COMPLETED: completedTasks,
      OVERDUE: userTasks.filter(task => 
        task.status !== 'completed' && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length
    };

    const user = users.find(u => u.id === userId);
    const organizationsPath = path.join(process.cwd(), 'data', 'organizations.json');
    let organizationsList: any[] = [];
    if (fs.existsSync(organizationsPath)) {
      organizationsList = JSON.parse(fs.readFileSync(organizationsPath, 'utf8'));
    }
    const organization = organizationsList.find(org => org.id === organizationId);

    const userProgress = {
      userId,
      userName: user?.name || 'Unknown User',
      organizationId,
      organizationName: organization?.name || 'Unknown Organization',
      totalTasks,
      completedTasks,
      completionPercentage,
      onTimeCompletionRate,
      taskStatus
    };

    res.json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

// Get cross-organization stats for a user
app.get('/api/analytics/cross-org-stats', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const tasks = (function(){
      try { const p = path.join(process.cwd(), 'data', 'tasks.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    const users = (function(){
      try { const p = path.join(process.cwd(), 'public', 'api', 'users.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    const organizations = (function(){
      try { const p = path.join(process.cwd(), 'data', 'organizations.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    
    // Get all tasks for the user across all organizations
    const userTasks = tasks.filter(task => task.assignedTo === userId);
    
    // Group by organization
    const orgStats = {};
    userTasks.forEach(task => {
      if (!orgStats[task.organizationId]) {
        orgStats[task.organizationId] = {
          organizationId: task.organizationId,
          organizationName: organizations.find(org => org.id === task.organizationId)?.name || 'Unknown',
          totalTasks: 0,
          completedTasks: 0
        };
      }
      orgStats[task.organizationId].totalTasks++;
      if (task.status === 'completed') {
        orgStats[task.organizationId].completedTasks++;
      }
    });

    const orgsArray = Object.values(orgStats).map(org => ({
      ...org,
      completionPercentage: org.totalTasks > 0 ? Math.round((org.completedTasks / org.totalTasks) * 100) : 0
    }));

    const totalTasksAcrossOrgs = userTasks.length;
    const totalCompletedAcrossOrgs = userTasks.filter(task => task.status === 'completed').length;
    const overallCompletionPercentage = totalTasksAcrossOrgs > 0 ? 
      Math.round((totalCompletedAcrossOrgs / totalTasksAcrossOrgs) * 100) : 0;

    const user = users.find(u => u.id === userId);

    const crossOrgStats = {
      userId,
      userName: user?.name || 'Unknown User',
      organizations: orgsArray,
      overallCompletionPercentage,
      totalTasksAcrossOrgs,
      totalCompletedAcrossOrgs
    };

    res.json(crossOrgStats);
  } catch (error) {
    console.error('Error fetching cross-org stats:', error);
    res.status(500).json({ error: 'Failed to fetch cross-org stats' });
  }
});

// Get organization KPIs
app.get('/api/analytics/org-kpis', (req, res) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const tasks = (function(){
      try { const p = path.join(process.cwd(), 'data', 'tasks.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    const projects = (function(){
      try { const p = path.join(process.cwd(), 'data', 'projects.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    const users = (function(){
      try { const p = path.join(process.cwd(), 'public', 'api', 'users.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    const organizations = (function(){
      try { const p = path.join(process.cwd(), 'data', 'organizations.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []; } catch { return []; }
    })();
    
    // Filter tasks and projects for the organization
    const orgTasks = tasks.filter(task => task.organizationId === organizationId);
    const orgProjects = projects.filter(project => project.organizationId === organizationId);
    
    // Calculate active members (users with tasks in progress or review in last 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const activeMembers = new Set(
      orgTasks
        .filter(task => 
          (task.status === 'in-progress' || task.status === 'review') &&
          new Date(task.updatedAt || task.createdAt) >= fourteenDaysAgo
        )
        .map(task => task.assignedTo)
    ).size;

    // Calculate members who completed all their work
    const membersWithTasks = new Set(orgTasks.map(task => task.assignedTo));
    let membersCompletedAllWork = 0;
    
    membersWithTasks.forEach(memberId => {
      const memberTasks = orgTasks.filter(task => task.assignedTo === memberId);
      const hasOpenTasks = memberTasks.some(task => 
        task.status !== 'completed'
      );
      if (!hasOpenTasks && memberTasks.length > 0) {
        membersCompletedAllWork++;
      }
    });

    // Task status breakdown
    const taskStatus = {
      UPCOMING: orgTasks.filter(task => task.status === 'upcoming').length,
      IN_PROGRESS: orgTasks.filter(task => task.status === 'in-progress').length,
      IN_REVIEW: orgTasks.filter(task => task.status === 'review').length,
      COMPLETED: orgTasks.filter(task => task.status === 'completed').length,
      OVERDUE: orgTasks.filter(task => 
        task.status !== 'completed' && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length
    };

    // Project status breakdown
    const projectStatus = {
      PENDING: orgProjects.filter(project => project.status === 'pending').length,
      IN_PROGRESS: orgProjects.filter(project => project.status === 'in-progress').length,
      IN_REVIEW: orgProjects.filter(project => project.status === 'review').length,
      COMPLETED: orgProjects.filter(project => project.status === 'completed').length
    };

    const organization = organizations.find(org => org.id === organizationId);

    const orgKPIs = {
      organizationId,
      organizationName: organization?.name || 'Unknown Organization',
      activeMembers,
      membersCompletedAllWork,
      totalTasksCompleted: taskStatus.COMPLETED,
      taskStatus,
      projectStatus,
      overdueTasks: taskStatus.OVERDUE
    };

    res.json(orgKPIs);
  } catch (error) {
    console.error('Error fetching org KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch org KPIs' });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const organizationId = req.body.organizationId;
    const createdBy = req.body.createdBy || req.body.assignedTo;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    const projectId = `project${Date.now()}`;
    const newProject = {
      ...req.body,
      id: projectId,
      organizationId: organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [] // Initialize with empty tasks array
    };
    
    // Ensure organization projects directory exists
    const projectsDir = path.join(process.cwd(), 'data', 'organizations', organizationId, 'projects');
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }
    
    // Create individual project file
    const projectFilePath = path.join(projectsDir, `${projectId}.json`);
    fs.writeFileSync(projectFilePath, JSON.stringify(newProject, null, 2));
    
    // Create activity/inbox message for project creation
    const activity = {
      id: `activity_${Date.now()}`,
      type: 'project',
      title: `New Project Created: ${newProject.projectName}`,
      description: `Project "${newProject.projectName}" has been created${newProject.description ? ` - ${newProject.description}` : ''}`,
      timestamp: new Date().toISOString(),
      priority: 'medium',
      status: 'completed',
      user: {
        id: createdBy || 'system',
        name: createdBy || 'System',
        role: 'admin'
      },
      metadata: {
        projectId: projectId,
        organizationId: organizationId,
        action: 'created'
      },
      isRead: false
    };
    
    // Save activity to organization-specific activities file
    const activitiesDir = path.join(process.cwd(), 'data', 'organizations', organizationId);
    if (!fs.existsSync(activitiesDir)) {
      fs.mkdirSync(activitiesDir, { recursive: true });
    }
    
    const activitiesPath = path.join(activitiesDir, 'activities.json');
    let activities: any[] = [];
    try {
      if (fs.existsSync(activitiesPath)) {
        activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading activities file:', error);
    }
    
    activities.unshift(activity);
    fs.writeFileSync(activitiesPath, JSON.stringify(activities, null, 2));
    
    // Also add to inbox messages
    addToInbox(activity);
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('❌ Failed to create project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    const updates = req.body;
    
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
    let projects: Project[] = [];
    
    try {
      projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    } catch (error) {
      return res.status(404).json({ error: 'Projects file not found' });
    }
    
    const projectIndex = projects.findIndex(project => project.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
    res.json(projects[projectIndex]);
  } catch (error) {
    console.error('❌ Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    const { organizationId } = req.body;
    
    console.log('Delete project request:', { projectId, organizationId });
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    // Find and delete the organization-specific project file
    const projectFilePath = path.join(process.cwd(), 'data', 'organizations', organizationId, 'projects', `${projectId}.json`);
    
    console.log('Looking for project file at:', projectFilePath);
    
    if (!fs.existsSync(projectFilePath)) {
      console.log('Project file not found at:', projectFilePath);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Read the project to get details for activity logging
    const project = JSON.parse(fs.readFileSync(projectFilePath, 'utf8'));
    
    // Delete the project file
    fs.unlinkSync(projectFilePath);
    
    // Create activity/inbox message for project deletion
    const activity = {
      id: `activity_${Date.now()}`,
      type: 'project',
      title: `Project Deleted: ${project.projectName}`,
      description: `Project "${project.projectName}" has been deleted`,
      timestamp: new Date().toISOString(),
      priority: 'medium',
      status: 'completed',
      user: {
        id: req.body.deletedBy || 'system',
        name: req.body.deletedBy || 'System',
        role: 'admin'
      },
      metadata: {
        projectId: projectId,
        organizationId: organizationId,
        action: 'deleted'
      },
      isRead: false
    };
    
    // Save activity to organization-specific activities file
    const activitiesDir = path.join(process.cwd(), 'data', 'organizations', organizationId);
    if (!fs.existsSync(activitiesDir)) {
      fs.mkdirSync(activitiesDir, { recursive: true });
    }
    
    const activitiesPath = path.join(activitiesDir, 'activities.json');
    let activities: any[] = [];
    try {
      if (fs.existsSync(activitiesPath)) {
        activities = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading activities file:', error);
    }
    
    activities.unshift(activity);
    fs.writeFileSync(activitiesPath, JSON.stringify(activities, null, 2));
    
    // Also add to inbox messages
    addToInbox(activity);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Custom Status Management endpoints
app.get('/api/custom-statuses', (req, res) => {
  try {
    const statuses = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'custom-statuses.json'), 'utf8'));
    res.json(statuses);
  } catch (error) {
    console.error('❌ Failed to load custom statuses:', error);
    res.json([]); // Return empty array if file doesn't exist
  }
});

app.post('/api/custom-statuses', (req, res) => {
  try {
    const newStatus = {
      ...req.body,
      id: Date.now().toString()
    };
    
    const statusesPath = path.join(process.cwd(), 'data', 'custom-statuses.json');
    let statuses: CustomStatus[] = [];
    
    try {
      statuses = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    statuses.push(newStatus);
    fs.writeFileSync(statusesPath, JSON.stringify(statuses, null, 2));
    
    res.status(201).json(newStatus);
  } catch (error) {
    console.error('❌ Failed to create custom status:', error);
    res.status(500).json({ error: 'Failed to create custom status' });
  }
});

app.put('/api/custom-statuses/:id', (req, res) => {
  try {
    const statusId = req.params.id;
    const updates = req.body;
    
    const statusesPath = path.join(process.cwd(), 'data', 'custom-statuses.json');
    let statuses: CustomStatus[] = [];
    
    try {
      statuses = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
    } catch (error) {
      return res.status(404).json({ error: 'Custom statuses file not found' });
    }
    
    const statusIndex = statuses.findIndex(status => status.id === statusId);
    if (statusIndex === -1) {
      return res.status(404).json({ error: 'Custom status not found' });
    }
    
    statuses[statusIndex] = {
      ...statuses[statusIndex],
      ...updates
    };
    
    fs.writeFileSync(statusesPath, JSON.stringify(statuses, null, 2));
    res.json(statuses[statusIndex]);
  } catch (error) {
    console.error('❌ Failed to update custom status:', error);
    res.status(500).json({ error: 'Failed to update custom status' });
  }
});

app.delete('/api/custom-statuses/:id', (req, res) => {
  try {
    const statusId = req.params.id;
    
    const statusesPath = path.join(process.cwd(), 'data', 'custom-statuses.json');
    let statuses: CustomStatus[] = [];
    
    try {
      statuses = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
    } catch (error) {
      return res.status(404).json({ error: 'Custom statuses file not found' });
    }
    
    const statusIndex = statuses.findIndex(status => status.id === statusId);
    if (statusIndex === -1) {
      return res.status(404).json({ error: 'Custom status not found' });
    }
    
    statuses.splice(statusIndex, 1);
    fs.writeFileSync(statusesPath, JSON.stringify(statuses, null, 2));
    res.json({ message: 'Custom status deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete custom status:', error);
    res.status(500).json({ error: 'Failed to delete custom status' });
  }
});

// AI Job Management endpoint - Routes tasks to appropriate AI models
app.post('/api/ai-job', async (req, res) => {
  try {
    const { jobType, query, context, userId }: AIJobRequest = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Auto-detect job type if not provided
    const detectedJobType = jobType || AIJobManager.detectJobType(query);
    const jobConfig = AIJobManager.getJobConfig(detectedJobType);
    
    if (!jobConfig) {
      return res.status(400).json({ error: `Unsupported job type: ${detectedJobType}` });
    }

    // Build context-aware prompt
    const contextPrompt = AIJobManager.buildContextPrompt(detectedJobType, query, context);
    
    let response: string;
    const preferredModel = jobConfig.preferredModel;
    
    console.log(`🤖 Processing AI job: ${detectedJobType} with ${preferredModel}`);
    
    if (preferredModel === 'gemini') {
      // Use Gemini AI for structured tasks
      if (!gemini) {
        console.log('⚠️ Gemini AI not configured, using fallback task generation');
        response = generateFallbackTask(query, context);
      } else {
        try {
          const geminiModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await geminiModel.generateContent(contextPrompt);
          response = result.response.text();
          
          console.log(`✅ Gemini AI job completed: ${detectedJobType}`);
        } catch (geminiError) {
          console.error('❌ Gemini AI job error:', geminiError);
          console.log('⚠️ Falling back to local task generation');
          response = generateFallbackTask(query, context);
        }
      }
      
    } else if (preferredModel === 'cohere') {
      // Use Cohere AI for creative and conversational tasks
      const cohereApiKey = process.env.COHERE_API_KEY;
      if (!cohereApiKey) {
        return res.status(500).json({ error: 'Cohere AI not configured' });
      }
      
      try {
        const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cohereApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: contextPrompt,
            model: 'command',
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });
        
        if (!cohereResponse.ok) {
          throw new Error(`Cohere API responded with status: ${cohereResponse.status}`);
        }
        
        const cohereData = await cohereResponse.json();
        response = cohereData.text || 'No response generated from Cohere';
        
        console.log(`✅ Cohere AI job completed: ${detectedJobType}`);
      } catch (cohereError) {
        console.error('❌ Cohere AI job error:', cohereError);
        return res.status(500).json({ 
          error: 'Cohere AI error', 
          details: cohereError.message 
        });
      }
      
    } else {
      return res.status(400).json({ error: `Unsupported model: ${preferredModel}` });
    }

    const jobResponse: AIJobResponse = {
      response,
      model: preferredModel,
      jobType: detectedJobType,
      timestamp: new Date().toISOString()
    };

    res.json(jobResponse);
    
  } catch (error) {
    console.error('AI Job error:', error);
    res.status(500).json({ error: 'Failed to process AI job' });
  }
});

// Get available AI job types
app.get('/api/ai-job-types', (req, res) => {
  try {
    const { category } = req.query;
    
    let jobTypes;
    if (category && typeof category === 'string') {
      jobTypes = AIJobManager.getJobTypesByCategory(category);
    } else {
      jobTypes = AIJobManager.getAllJobTypes();
    }
    
    res.json({ jobTypes });
  } catch (error) {
    console.error('Error fetching job types:', error);
    res.status(500).json({ error: 'Failed to fetch job types' });
  }
});

// Helper functions for user management
const readRegisterFile = (): ParsedUser[] => {
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'public/api/register.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading register file:', error);
    return [];
  }
};

const writeRegisterFile = (users: ParsedUser[]) => {
  try {
    fs.writeFileSync(path.join(process.cwd(), 'public/api/register.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing register file:', error);
    return false;
  }
};

const readLoginFile = (): LoginUser[] => {
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'public/api/login.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading login file:', error);
    return [];
  }
};

const writeLoginFile = (users: LoginUser[]) => {
  try {
    fs.writeFileSync(path.join(process.cwd(), 'public/api/login.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing login file:', error);
    return false;
  }
};

// Store passwords as plain text (for development - in production, use bcrypt)
const storePassword = (password: string) => {
  return password; // Store as plain text
};

// Repair user data to ensure consistency
const repairUserData = () => {
  try {
    // Ensure all users have proper role field
    chatUsers.forEach(user => {
      if (!user.role) {
        user.role = "User";
      }
    });
    
    // Save repaired data
    saveData();
    console.log('🔧 User data repaired and saved');
  } catch (error) {
    console.error('Error repairing user data:', error);
  }
};

// Authentication endpoints
app.post('/api/register', (req, res) => {
  try {
    const { name, email, password } = (req.body || {}) as { name?: string; email?: string; password?: string };
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    // Check if email already exists in both in-memory and file
    const existingUserInMemory = chatUsers.find(u => u.email === email);
    const existingUserInFile = readRegisterFile().find(u => u.email === email);
    
    if (existingUserInMemory || existingUserInFile) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user with proper ID
    const newUserId = Math.max(...chatUsers.map(u => parseInt(u.id)), ...readRegisterFile().map(u => parseInt(u.id)), 0) + 1;
    
    const newUser = {
      id: newUserId.toString(),
      name,
      email,
      password: storePassword(password),
      role: "User",
      isOnline: false,
      lastSeen: new Date()
    };
    
    // Add to in-memory chatUsers array
    chatUsers.push(newUser);
    
    // Save to file - use the updated chatUsers array directly
    const fileUsers = chatUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role || "User"
    }));
    
    if (writeRegisterFile(fileUsers)) {
      console.log(`✅ New user registered: ${email} (ID: ${newUserId})`);
      console.log(`💾 User saved to file. Total users: ${fileUsers.length}`);
      
      // Also save to users.json for Team Chat compatibility
      try {
        const usersPath = path.join(process.cwd(), 'public/api/users.json');
        const existingUsersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        existingUsersData.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role.toLowerCase()
        });
        fs.writeFileSync(usersPath, JSON.stringify(existingUsersData, null, 2));
        console.log(`💾 User also saved to users.json for Team Chat compatibility`);
      } catch (error) {
        console.error('Could not update users.json:', error);
      }
      
      // Broadcast new user to all connected clients via Socket.IO
      io.emit('newUserRegistered', {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isOnline: false,
        lastSeen: newUser.lastSeen
      });
      
      // Save all data to ensure consistency
      saveData();
      
      res.status(201).json({ 
        success: true, 
        message: 'Registration successful! Please login.',
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
      });
    } else {
      // Rollback in-memory addition if file save fails
      chatUsers.pop();
      console.error('❌ Failed to write user to file');
      res.status(500).json({ error: 'Failed to save user data' });
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OLD LOGIN ENDPOINT - DISABLED FOR ROLE-BASED TASK MANAGEMENT SYSTEM
// This endpoint uses the old JSON file system without roles
/*
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const chatUsersFromFile = readRegisterFile();
    const user = chatUsers.find((u: User) => u.email === email);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Add user to login.json (currently logged in users)
    const loggedInUsers = readLoginFile();
    
    // Check if user is already logged in
    const existingLogin = loggedInUsers.find((u: LoginUser) => u.id === user.id);
    if (existingLogin) {
      // Update login time
      existingLogin.loginTime = new Date().toISOString();
    } else {
      // Add new login entry
      const newLogin = {
        id: user.id,
        name: user.name,
        email: user.email,
        loginTime: new Date().toISOString()
      };
      loggedInUsers.push(newLogin);
    }
    
    writeLoginFile(loggedInUsers);
    
    console.log(`✅ User logged in: ${email}`);
    res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    // Provide a safer error response, avoiding JSON parsing issues on the client
    res.status(500).json({ error: 'Internal server error during login' });
  }
});
*/

app.post('/api/logout', (req, res) => {
  try {
    const { email } = (req.body || {}) as { email?: string };
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const loggedInUsers = readLoginFile();
    const userIndex = loggedInUsers.findIndex((u: LoginUser) => u.email === email);
    
    if (userIndex !== -1) {
      const removedUser = loggedInUsers.splice(userIndex, 1)[0];
      writeLoginFile(loggedInUsers);
      console.log(`✅ User logged out: ${removedUser.email}`);
    }
    
    res.json({ success: true, message: 'Logout successful' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    const loggedInUsers = readLoginFile();
    const loggedInUser = loggedInUsers.find((u: LoginUser) => u.email === email);
    
    if (!loggedInUser) {
      return res.status(401).json({ error: 'User not logged in' });
    }
    
    const chatUsersFromFile = readRegisterFile();
    const user = chatUsers.find((u: User) => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TeamChat API endpoints (renamed to avoid conflict with task management)
app.get('/api/chat/users', (req, res) => {
  try {
    const usersList = chatUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen
    }));
    res.json(usersList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/groups', (req, res) => {
  try {
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.get('/api/chat/:chatId/messages', (req, res) => {
  try {
    const { chatId } = req.params;
    const chatMessages = messages.filter(m => m.chatId === chatId);
    res.json(chatMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/chats', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userChats = chatRooms.filter(room => 
      room.participants.includes(userId as string)
    );
    
    res.json(userChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Serve CRM data
app.get('/api/crm-data.json', (req, res) => {
  try {
    const crmDataPath = path.join(process.cwd(), 'public', 'api', 'crm-data.json');
    const crmData = fs.readFileSync(crmDataPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(crmData);
  } catch (error) {
    console.error('Error serving CRM data:', error);
    res.status(500).json({ error: 'Failed to load CRM data' });
  }
});

// News API endpoint using RapidAPI
app.get('/api/news', async (req, res) => {
  try {
    const { story, country = 'US', lang = 'en', sort = 'RELEVANCE' } = req.query;
    
    if (!story) {
      return res.status(400).json({ error: 'Story parameter is required' });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;

    if (!rapidApiKey || !rapidApiHost) {
      return res.status(500).json({ error: 'RapidAPI configuration missing' });
    }

    const url = `https://real-time-news-data.p.rapidapi.com/full-story-coverage?story=${story}&sort=${sort}&country=${country}&lang=${lang}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI responded with status: ${response.status}`);
    }

    const newsData = await response.json();
    res.json(newsData);
    
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
});

// POST endpoint to save new messages
app.post('/api/messages', (req, res) => {
  try {
    const newMessage = req.body;
    
    // Validate required fields
    if (!newMessage.chatId || !newMessage.senderId || !newMessage.content) {
      return res.status(400).json({ error: 'Missing required fields: chatId, senderId, content' });
    }
    
    // Add timestamp if not provided
    if (!newMessage.timestamp) {
      newMessage.timestamp = new Date().toISOString();
    }
    
    // Add to in-memory messages array
    messages.push(newMessage);
    
    // Save to file immediately
    saveData();
    
    console.log(`💾 New message saved: ${newMessage.content.substring(0, 30)}...`);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message ' });
  }
});

// Periodic save to ensure data persistence
setInterval(() => {
  saveData();
  console.log(`💾 Periodic save completed at ${new Date().toISOString()}`);
}, 30000); // Save every 30 seconds

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  saveData();
  console.log('💾 All data saved before shutdown');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...');
  saveData();
  console.log('💾 All data saved before shutdown');
  process.exit(0);
});

// Settings API endpoints
interface UserSettings {
  profile: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  notifications: {
    email: {
      enabled: boolean;
      weeklyUpdates: boolean;
      salesAlerts: boolean;
      taskReminders: boolean;
    };
    push: {
      enabled: boolean;
      browserNotifications: boolean;
    };
    chat: {
      enabled: boolean;
      newMessages: boolean;
      mentions: boolean;
    };
  };
  security: {
    twoFactorEnabled: boolean;
    apiKeys: Array<{
      id: string;
      name: string;
      key: string;
      createdAt: string;
      lastUsed?: string;
    }>;
  };
  system: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

// In-memory settings storage (in production, use a database)
const userSettings: Map<string, UserSettings> = new Map();

// Helper function to get default settings
const getDefaultSettings = (): UserSettings => ({
  profile: {
    name: "",
    email: "",
    role: "user",
    avatar: undefined
  },
  notifications: {
    email: {
      enabled: true,
      weeklyUpdates: true,
      salesAlerts: true,
      taskReminders: true
    },
    push: {
      enabled: false,
      browserNotifications: false
    },
    chat: {
      enabled: true,
      newMessages: true,
      mentions: true
    }
  },
  security: {
    twoFactorEnabled: false,
    apiKeys: []
  },
  system: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC+0'
  }
});

// Get user settings
app.get('/api/settings', (req, res) => {
  const userId = req.headers['user-id'] as string || 'default';
  const settings = userSettings.get(userId) || getDefaultSettings();
  res.json(settings);
});

// Update profile settings
app.put('/api/settings/profile', (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || 'default';
    const profileUpdate = req.body;
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.profile = { ...currentSettings.profile, ...profileUpdate };
    userSettings.set(userId, currentSettings);
    
    res.json({ success: true, profile: currentSettings.profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update notification settings
app.put('/api/settings/notifications', (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || 'default';
    const notificationUpdate = req.body;
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.notifications = { ...currentSettings.notifications, ...notificationUpdate };
    userSettings.set(userId, currentSettings);
    
    res.json({ success: true, notifications: currentSettings.notifications });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Update security settings
app.put('/api/settings/security', (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || 'default';
    const securityUpdate = req.body;
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.security = { ...currentSettings.security, ...securityUpdate };
    userSettings.set(userId, currentSettings);
    
    res.json({ success: true, security: currentSettings.security });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// Update system settings
app.put('/api/settings/system', (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || 'default';
    const systemUpdate = req.body;
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.system = { ...currentSettings.system, ...systemUpdate };
    userSettings.set(userId, currentSettings);
    
    res.json({ success: true, system: currentSettings.system });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// Change password
app.post('/api/settings/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.headers['user-id'] as string || 'default';
    
    // In a real application, you would verify the current password
    // and hash the new password before storing it
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Simulate password change (in production, update the user's password in the database)
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Generate API key
app.post('/api/settings/api-keys', (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.headers['user-id'] as string || 'default';
    
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }
    
    const apiKey = {
      id: uuidv4(),
      name,
      key: `sk-${crypto.randomBytes(32).toString('hex')}`,
      createdAt: new Date().toISOString()
    };
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.security.apiKeys.push(apiKey);
    userSettings.set(userId, currentSettings);
    
    res.json(apiKey);
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Revoke API key
app.delete('/api/settings/api-keys/:keyId', (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.headers['user-id'] as string || 'default';
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.security.apiKeys = currentSettings.security.apiKeys.filter(key => key.id !== keyId);
    userSettings.set(userId, currentSettings);
    
    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Upload avatar (simplified - in production, use proper file upload handling)
app.post('/api/settings/avatar', (req, res) => {
  try {
    const userId = req.headers['user-id'] as string || 'default';
    
    // In a real application, you would handle file upload properly
    // For now, we'll simulate a successful upload
    const avatarUrl = `/avatars/${userId}-${Date.now()}.jpg`;
    
    const currentSettings = userSettings.get(userId) || getDefaultSettings();
    currentSettings.profile.avatar = avatarUrl;
    userSettings.set(userId, currentSettings);
    
    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Debug endpoint removed (dummy data)

// Manual repair endpoint for admin use

// Organization Invitation System - In-memory storage
const invitations: Array<{
  id: string;
  organizationId: string;
  organizationName: string;
  invitedUserId: string;
  invitedUserEmail: string;
  invitedUserName?: string;
  invitedBy: string;
  invitedByName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  message?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}> = [];

const organizationAccess: Array<{
  organizationId: string;
  userId: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  invitedBy: string;
}> = [];

const notifications: Array<{
  id: string;
  type: 'invitation_received' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired';
  organizationId: string;
  organizationName: string;
  invitationId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  role: string;
  message?: string;
  createdAt: string;
  read: boolean;
}> = [];

// Helper function to check if user has access to organization
const checkOrganizationAccess = (organizationId: string, userId: string) => {
  // Check if user has access through invitation system
  const access = organizationAccess.find(
    a => a.organizationId === organizationId && a.userId === userId && a.status === 'active'
  );
  
  if (access) {
    return {
      canAccess: true,
      role: access.role,
      reason: 'User is a member of the organization'
    };
  }

  // Check if user has access through old members system (for backward compatibility)
  const organization = organizations.find(org => org.id === organizationId);
  if (organization) {
    const memberAccess = organization.members?.find(
      m => m.userId === userId && m.status === 'active'
    );
    
    if (memberAccess) {
      return {
        canAccess: true,
        role: memberAccess.role,
        reason: 'User is a member of the organization'
      };
    }
  }

  // Check for pending invitation
  const pendingInvitation = invitations.find(
    inv => inv.organizationId === organizationId && 
           inv.invitedUserId === userId && 
           inv.status === 'pending' &&
           new Date(inv.expiresAt) > new Date()
  );

  if (pendingInvitation) {
    return {
      canAccess: false,
      role: null,
      invitationId: pendingInvitation.id,
      invitationStatus: pendingInvitation.status,
      reason: 'User has a pending invitation'
    };
  }

  return {
    canAccess: false,
    role: null,
    reason: 'User is not a member and has no pending invitation'
  };
};

// Organization Invitation API Endpoints
app.post('/api/organizations/:organizationId/invitations', (req, res) => {
  try {
    const { organizationId } = req.params;
    const { invitedUserEmail, role, message, expiresInDays = 7 } = req.body;
    const invitedBy = req.headers['user-id'] as string;
    const invitedByName = req.headers['user-name'] as string;

    if (!invitedUserEmail || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Check if user already has access
    const existingAccess = organizationAccess.find(
      a => a.organizationId === organizationId && a.userId === invitedUserEmail
    );

    if (existingAccess) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Check for existing pending invitation
    const existingInvitation = invitations.find(
      inv => inv.organizationId === organizationId && 
             inv.invitedUserEmail === invitedUserEmail && 
             inv.status === 'pending'
    );

    if (existingInvitation) {
      return res.status(400).json({ error: 'User already has a pending invitation' });
    }

    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = {
      id: invitationId,
      organizationId,
      organizationName: req.headers['organization-name'] as string || 'Organization',
      invitedUserId: invitedUserEmail,
      invitedUserEmail,
      invitedBy,
      invitedByName,
      role,
      status: 'pending' as const,
      message,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    invitations.push(invitation);

    // Create notification
    const notificationId = uuidv4();
    notifications.push({
      id: notificationId,
      type: 'invitation_received',
      organizationId,
      organizationName: invitation.organizationName,
      invitationId,
      fromUserId: invitedBy,
      fromUserName: invitedByName,
      toUserId: invitedUserEmail,
      toUserName: invitedUserEmail,
      role,
      message,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

app.get('/api/users/:userId/invitations/pending', (req, res) => {
  try {
    const { userId } = req.params;
    
    const userInvitations = invitations.filter(
      inv => inv.invitedUserId === userId && inv.status === 'pending'
    );

    res.json(userInvitations);
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ error: 'Failed to fetch pending invitations' });
  }
});

app.post('/api/invitations/:invitationId/accept', (req, res) => {
  try {
    const { invitationId } = req.params;
    const { message } = req.body;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      invitation.updatedAt = new Date().toISOString();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date().toISOString();
    invitation.updatedAt = new Date().toISOString();

    // Add user to organization
    const access = {
      organizationId: invitation.organizationId,
      userId: invitation.invitedUserId,
      role: invitation.role,
      status: 'active' as const,
      joinedAt: new Date().toISOString(),
      invitedBy: invitation.invitedBy
    };

    organizationAccess.push(access);

    // Create notification
    const notificationId = uuidv4();
    notifications.push({
      id: notificationId,
      type: 'invitation_accepted',
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      invitationId,
      fromUserId: invitation.invitedUserId,
      fromUserName: invitation.invitedUserEmail,
      toUserId: invitation.invitedBy,
      toUserName: invitation.invitedByName,
      role: invitation.role,
      message,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.json(invitation);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

app.post('/api/invitations/:invitationId/decline', (req, res) => {
  try {
    const { invitationId } = req.params;
    const { message } = req.body;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.declinedAt = new Date().toISOString();
    invitation.updatedAt = new Date().toISOString();

    res.json(invitation);
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: 'Failed to decline invitation' });
  }
});

app.get('/api/organizations/:organizationId/access/:userId', (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    
    const access = checkOrganizationAccess(organizationId, userId);
    res.json(access);
  } catch (error) {
    console.error('Error checking organization access:', error);
    res.status(500).json({ error: 'Failed to check organization access' });
  }
});

app.get('/api/organizations/:organizationId/members', (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const members = organizationAccess
      .filter(access => access.organizationId === organizationId)
      .map(access => ({
        id: uuidv4(),
        userId: access.userId,
        userName: access.userId,
        userEmail: access.userId,
        role: access.role,
        status: access.status,
        joinedAt: access.joinedAt,
        invitedBy: access.invitedBy,
        invitedByName: 'System',
        permissions: []
      }));

    res.json(members);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ error: 'Failed to fetch organization members' });
  }
});

// Custom Status Management API Routes
const customStatuses: Array<{
  id: string;
  name: string;
  color: string;
  order: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}> = [];

// Get custom statuses for an organization
app.get('/api/custom-statuses', (req, res) => {
  try {
    const { organizationId } = req.query;
    
    const orgStatuses = customStatuses.filter(status => 
      status.organizationId === (organizationId || 'default-org')
    );
    
    res.json(orgStatuses);
  } catch (error) {
    console.error('Error fetching custom statuses:', error);
    res.status(500).json({ error: 'Failed to fetch custom statuses' });
  }
});

// Create custom status
app.post('/api/custom-statuses', (req, res) => {
  try {
    const { name, color, order, organizationId } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }
    
    const newStatus = {
      id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      order: order || 0,
      organizationId: organizationId || 'default-org',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    customStatuses.push(newStatus);
    
    console.log(`✅ Custom status created: ${name} for organization ${organizationId}`);
    
    res.status(201).json(newStatus);
  } catch (error) {
    console.error('Error creating custom status:', error);
    res.status(500).json({ error: 'Failed to create custom status' });
  }
});

// Update custom status
app.put('/api/custom-statuses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;
    
    const statusIndex = customStatuses.findIndex(status => status.id === id);
    if (statusIndex === -1) {
      return res.status(404).json({ error: 'Custom status not found' });
    }
    
    if (name) customStatuses[statusIndex].name = name;
    if (color) customStatuses[statusIndex].color = color;
    if (order !== undefined) customStatuses[statusIndex].order = order;
    customStatuses[statusIndex].updatedAt = new Date().toISOString();
    
    console.log(`✅ Custom status updated: ${id}`);
    
    res.json(customStatuses[statusIndex]);
  } catch (error) {
    console.error('Error updating custom status:', error);
    res.status(500).json({ error: 'Failed to update custom status' });
  }
});

// Delete custom status
app.delete('/api/custom-statuses/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const statusIndex = customStatuses.findIndex(status => status.id === id);
    if (statusIndex === -1) {
      return res.status(404).json({ error: 'Custom status not found' });
    }
    
    const deletedStatus = customStatuses.splice(statusIndex, 1)[0];
    
    console.log(`✅ Custom status deleted: ${id}`);
    
    res.json({ success: true, deletedStatus });
  } catch (error) {
    console.error('Error deleting custom status:', error);
    res.status(500).json({ error: 'Failed to delete custom status' });
  }
});

// Serve the SPA for any non-API routes (for client-side routing with SSG)
// Using a more specific pattern instead of '*' to avoid path-to-regexp issues
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// File Management Routes
import multer from 'multer';

// Test endpoint to verify file upload is working
app.get('/api/files/test', (req, res) => {
  console.log('📁 Test endpoint called');
  res.json({ 
    success: true, 
    message: 'File upload system is working',
    timestamp: new Date().toISOString()
  });
});

// Simple file upload test without multer
app.post('/api/files/upload-simple', (req, res) => {
  console.log('📁 Simple upload test called');
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body || {}));
  
  res.json({
    success: true,
    message: 'Simple upload endpoint working',
    receivedHeaders: req.headers,
    bodyKeys: Object.keys(req.body || {})
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to read files metadata
const readFiles = () => {
  try {
    const filesPath = path.join(process.cwd(), 'public', 'api', 'files.json');
    const data = fs.readFileSync(filesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading files:', error);
    return [];
  }
};

// Helper function to write files metadata
const writeFiles = (files) => {
  try {
    const filesPath = path.join(process.cwd(), 'public', 'api', 'files.json');
    fs.writeFileSync(filesPath, JSON.stringify(files, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing files:', error);
    return false;
  }
};

// Helper function to get file type
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.pdf': 'pdf',
    '.doc': 'document',
    '.docx': 'document',
    '.txt': 'text',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.bmp': 'image',
    '.svg': 'image',
    '.mp4': 'video',
    '.avi': 'video',
    '.mov': 'video',
    '.wmv': 'video',
    '.xls': 'spreadsheet',
    '.xlsx': 'spreadsheet',
    '.csv': 'spreadsheet',
    '.ppt': 'presentation',
    '.pptx': 'presentation',
    '.zip': 'archive',
    '.rar': 'archive',
    '.7z': 'archive'
  };
  return typeMap[ext] || 'file';
};

// Upload file
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  console.log('📁 File upload request received');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  } : 'No file');
  
  try {
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { organizationId, projectId, taskId, uploadedBy } = req.body;
    console.log('Upload parameters:', { organizationId, projectId, taskId, uploadedBy });
    
    if (!organizationId || !uploadedBy) {
      console.log('❌ Missing required parameters');
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Organization ID and uploadedBy are required' });
    }

    const files = readFiles();
    const fileId = uuidv4();
    const fileInfo = fs.statSync(req.file.path);
    const fileType = getFileType(req.file.originalname);

    const fileMetadata = {
      id: fileId,
      organizationId,
      projectId: projectId || null,
      taskId: taskId || null,
      uploadedBy,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType,
      mimeType: req.file.mimetype,
      size: fileInfo.size,
      canPreview: ['pdf', 'image', 'text', 'document', 'spreadsheet', 'presentation'].includes(fileType),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    files.push(fileMetadata);
    
    if (writeFiles(files)) {
      console.log('✅ File uploaded successfully:', fileMetadata.id);
      res.status(201).json({
        success: true,
        file: fileMetadata,
        message: 'File uploaded successfully'
      });
    } else {
      console.log('❌ Failed to save file metadata');
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Failed to save file metadata' });
    }
  } catch (error) {
    console.error('❌ Error processing file upload:', error);
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// Get files for organization
app.get('/api/files/organization/:organizationId', (req, res) => {
  try {
    const { organizationId } = req.params;
    const { projectId, taskId, fileType } = req.query;
    
    const files = readFiles();
    let filteredFiles = files.filter(file => file.organizationId === organizationId);
    
    // Filter by project if specified
    if (projectId) {
      filteredFiles = filteredFiles.filter(file => file.projectId === projectId);
    }
    
    // Filter by task if specified
    if (taskId) {
      filteredFiles = filteredFiles.filter(file => file.taskId === taskId);
    }
    
    // Filter by file type if specified
    if (fileType) {
      filteredFiles = filteredFiles.filter(file => file.fileType === fileType);
    }
    
    // Sort by creation date (newest first)
    filteredFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      files: filteredFiles,
      total: filteredFiles.length
    });
  } catch (error) {
    console.error('Error fetching organization files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Download file
app.get('/api/files/:fileId/download', (req, res) => {
  try {
    const { fileId } = req.params;
    const files = readFiles();
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.download(file.filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// View/Preview file
app.get('/api/files/:fileId/view', (req, res) => {
  try {
    const { fileId } = req.params;
    const files = readFiles();
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    // Set appropriate headers for different file types
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({ error: 'Failed to view file' });
  }
});

// Delete file
app.delete('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;
    
    const files = readFiles();
    const fileIndex = files.findIndex(f => f.id === fileId);
    
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[fileIndex];
    
    // Check if user has permission to delete (uploader or admin)
    if (file.uploadedBy !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    
    // Remove from metadata
    files.splice(fileIndex, 1);
    
    if (writeFiles(files)) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to delete file metadata' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file statistics
app.get('/api/files/organization/:organizationId/stats', (req, res) => {
  try {
    const { organizationId } = req.params;
    const files = readFiles();
    const orgFiles = files.filter(f => f.organizationId === organizationId);
    
    const stats = {
      totalFiles: orgFiles.length,
      totalSize: orgFiles.reduce((sum, file) => sum + file.size, 0),
      byType: {},
      byProject: {},
      recentUploads: orgFiles
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };
    
    // Group by file type
    orgFiles.forEach(file => {
      stats.byType[file.fileType] = (stats.byType[file.fileType] || 0) + 1;
    });
    
    // Group by project
    orgFiles.forEach(file => {
      const projectId = file.projectId || 'unassigned';
      stats.byProject[projectId] = (stats.byProject[projectId] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching file stats:', error);
    res.status(500).json({ error: 'Failed to fetch file statistics' });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================


// Performance Metrics - Velocity Chart
app.get('/api/analytics/velocity', (req, res) => {
  try {
    const orgId = String(req.query.orgId ?? "");
    const projectId = String(req.query.projectId ?? "");
    const interval = (String(req.query.interval ?? "week")) as "week" | "sprint" | "quarter";
    const limit = Number(req.query.limit ?? 8);
    const unit = String(req.query.unit ?? "hours") as "hours" | "tasks";

    // Load tasks from JSON file
    const tasksPath = path.join(process.cwd(), 'data', 'tasks.json');
    let tasks: any[] = [];
    
    if (fs.existsSync(tasksPath)) {
      tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    }

    // Filter tasks by organization and project
    const inScope = tasks.filter(t => {
      const orgMatch = !orgId || t.organizationId === orgId;
      const projectMatch = !projectId || t.projectId === projectId;
      const status: string = typeof t.status === 'string' ? t.status : '';
      const hasCompletedAt = t.completedAt || /(completed|done)/i.test(status);
      return orgMatch && projectMatch && hasCompletedAt;
    });

    // Create time buckets
    const buckets: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();
    let cursor = new Date(now);

    for (let i = 0; i < limit; i++) {
      const end = new Date(cursor);
      let start: Date;

      if (interval === "quarter") {
        start = new Date(cursor.getFullYear(), Math.floor(cursor.getMonth() / 3) * 3, 1);
        cursor = new Date(cursor.getFullYear(), Math.floor(cursor.getMonth() / 3) * 3 - 1, 1);
      } else {
        // week or sprint treated as 7-day buckets
        start = new Date(cursor);
        start.setDate(cursor.getDate() - 6);
        cursor = new Date(start);
        cursor.setDate(cursor.getDate() - 1);
      }

      buckets.unshift({
        label: interval === "quarter" ? `Q${Math.floor(end.getMonth() / 3) + 1}` : `W${i + 1}`,
        start,
        end
      });
    }

    // Calculate data for each bucket
    const data = buckets.map(bucket => {
      const completedInBucket = inScope.filter(task => {
        const completedAt = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt || task.dueDate || Date.now());
        return completedAt >= bucket.start && completedAt <= bucket.end;
      });

      if (unit === "hours") {
        return completedInBucket.reduce((sum, task) => sum + Number(task.estimatedHours || task.estimateHours || 1), 0);
      } else {
        return completedInBucket.length;
      }
    });

    const response = {
      labels: buckets.map(b => b.label),
      series: [{ name: unit === "hours" ? "Completed Effort" : "Completed Tasks", data }],
      unit: unit
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching velocity data:', error);
    res.status(500).json({ error: 'Failed to fetch velocity data' });
  }
});


// Recent Subscriptions
app.get('/api/finance/subscriptions', (req, res) => {
  try {
    const orgId = String(req.query.orgId ?? "");
    const limit = Number(req.query.limit ?? 5);

    const transactionsPath = path.join(process.cwd(), 'data', 'transactions.json');
    let transactions: any[] = [];
    
    if (fs.existsSync(transactionsPath)) {
      transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
    }

    const subscriptions = transactions
      .filter(t => t.orgId === orgId && t.type === "subscription")
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, limit);

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});


// Create Transaction (RBAC: admin/manager/super_admin)
app.post('/api/finance/transactions', (req, res) => {
  try {
    const { orgId, projectId, type, vendor, category, amount, currency, occurredAt, notes, recurring } = req.body;
    const userId = req.headers['user-id'] as string;

    // Basic validation
    if (!orgId || !type || !amount || amount < 0) {
      return res.status(400).json({ error: 'Invalid transaction data' });
    }

    // TODO: Add RBAC check for admin/manager/super_admin
    // For now, allow all authenticated users

    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      projectId: projectId || null,
      type,
      vendor: vendor || null,
      category: category || "Other",
      amount: Number(amount),
      currency: currency || "USD",
      occurredAt: occurredAt || new Date().toISOString(),
      notes: notes || null,
      recurring: recurring || null,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };

    // Load existing transactions
    const transactionsPath = path.join(process.cwd(), 'data', 'transactions.json');
    let transactions: any[] = [];
    
    if (fs.existsSync(transactionsPath)) {
      transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
    }

    // Add new transaction
    transactions.push(transaction);

    // Save to file
    fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));

    // Emit real-time update
    io.to(orgId).emit('finance:summary:updated', { orgId });

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// ==================== END ANALYTICS ENDPOINTS ====================

// Start server - Listen on all interfaces for mobile access
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT} (accessible from all network interfaces)`);
  console.log(`🔌 Socket.IO server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 AI Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🔐 Authentication endpoints:`);
  console.log(`   - Register: http://localhost:${PORT}/api/register`);
  console.log(`   - Login: http://localhost:${PORT}/api/login`);
  console.log(`   - Logout: http://localhost:${PORT}/api/logout`);
  console.log(`💬 TeamChat endpoints:`);
  console.log(`   - Users: http://localhost:${PORT}/api/users`);
  console.log(`   - Groups: http://localhost:${PORT}/api/groups`);
  console.log(`   - Chats: http://localhost:${PORT}/api/chats`);
  console.log(`📊 CRM Data endpoint: http://localhost:${PORT}/api/crm-data.json`);
  console.log(`📰 News API endpoint: http://localhost:${PORT}/api/news`);
  console.log(`📋 Project Management endpoints:`);
  console.log(`   - Get Projects: http://localhost:${PORT}/api/projects`);
  console.log(`   - Create Project: http://localhost:${PORT}/api/projects`);
  console.log(`   - Update Project: http://localhost:${PORT}/api/projects/:id`);
  console.log(`   - Delete Project: http://localhost:${PORT}/api/projects/:id`);
  console.log(`⚙️ Settings endpoints:`);
  console.log(`   - Get Settings: http://localhost:${PORT}/api/settings`);
  console.log(`   - Update Profile: http://localhost:${PORT}/api/settings/profile`);
  console.log(`   - Update Notifications: http://localhost:${PORT}/api/settings/notifications`);
  console.log(`   - Update Security: http://localhost:${PORT}/api/settings/security`);
  console.log(`   - Update System: http://localhost:${PORT}/api/settings/system`);
  console.log(`   - Change Password: http://localhost:${PORT}/api/settings/change-password`);
  console.log(`   - API Keys: http://localhost:${PORT}/api/settings/api-keys`);
  console.log(`   - Upload Avatar: http://localhost:${PORT}/api/settings/avatar`);
  console.log(`🤖 Supported models: Gemini (default), OpenAI, Cohere, DeepAI`);
  console.log(`🔑 API Keys loaded:`);
  console.log(`   - Gemini: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - Cohere: ${process.env.COHERE_API_KEY ? '✅' : '❌'}`);
  console.log(`   - DeepAI: ${process.env.DEEPAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - RapidAPI: ${process.env.RAPIDAPI_KEY ? '✅' : '❌'}`);
  console.log(`💾 Message persistence: ENABLED - Messages will be saved to messages.json`);
  console.log(`🔄 SSG: ENABLED - Static files will be served from the dist directory`);
});