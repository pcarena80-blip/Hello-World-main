import { useState } from 'react';
import { Toaster } from 'sonner';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import HomeScreen from './components/HomeScreen';
import NoticeBoard from './components/NoticeBoard';
import NoticeDetails from './components/NoticeDetails';
import BillsScreen from './components/BillsScreen';
import BillDetails from './components/BillDetails';
import ComplaintsScreen from './components/ComplaintsScreen';
import NewComplaint from './components/NewComplaint';
import ComplaintDetails from './components/ComplaintDetails';
import ChatCenter from './components/ChatCenter';
import CommunityChat from './components/CommunityChat';
import PrivateChat from './components/PrivateChat';
import ChatDetail from './components/ChatDetail';
import ProfileScreen from './components/ProfileScreen';
import EditProfileScreen from './components/EditProfileScreen';
import NotificationsScreen from './components/NotificationsScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  const navigate = (screen: string, data?: any) => {
    if (data?.notice) setSelectedNotice(data.notice);
    if (data?.bill) setSelectedBill(data.bill);
    if (data?.complaint) setSelectedComplaint(data.complaint);
    if (data?.chat) setSelectedChat(data.chat);
    setCurrentScreen(screen);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('welcome');
  };

  // Auth screens
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Toaster position="top-center" richColors />
        <div className="w-full max-w-[390px] h-[844px] bg-gray-50 relative overflow-hidden shadow-2xl">
          {currentScreen === 'welcome' && <WelcomeScreen onNavigate={navigate} />}
          {currentScreen === 'login' && <LoginScreen onNavigate={navigate} onLogin={handleLogin} />}
          {currentScreen === 'signup' && <SignupScreen onNavigate={navigate} />}
          {currentScreen === 'forgot-password' && <ForgotPasswordScreen onNavigate={navigate} />}
        </div>
      </div>
    );
  }

  // Main app screens
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-[390px] h-[844px] bg-gray-50 relative overflow-hidden shadow-2xl flex flex-col">
        <div className="flex-1 overflow-hidden">
          {currentScreen === 'home' && <HomeScreen onNavigate={navigate} />}
          {currentScreen === 'notices' && <NoticeBoard onNavigate={navigate} />}
          {currentScreen === 'notice-details' && <NoticeDetails notice={selectedNotice} onNavigate={navigate} />}
          {currentScreen === 'bills' && <BillsScreen onNavigate={navigate} />}
          {currentScreen === 'bill-details' && <BillDetails bill={selectedBill} onNavigate={navigate} />}
          {currentScreen === 'complaints' && <ComplaintsScreen onNavigate={navigate} />}
          {currentScreen === 'new-complaint' && <NewComplaint onNavigate={navigate} />}
          {currentScreen === 'complaint-details' && <ComplaintDetails complaint={selectedComplaint} onNavigate={navigate} />}
          {currentScreen === 'chat' && <ChatCenter onNavigate={navigate} />}
          {currentScreen === 'community-chat' && <CommunityChat onNavigate={navigate} />}
          {currentScreen === 'private-chat' && <PrivateChat onNavigate={navigate} />}
          {currentScreen === 'chat-detail' && <ChatDetail chat={selectedChat} onNavigate={navigate} />}
          {currentScreen === 'profile' && <ProfileScreen onNavigate={navigate} onLogout={handleLogout} />}
          {currentScreen === 'edit-profile' && <EditProfileScreen onNavigate={navigate} />}
          {currentScreen === 'notifications' && <NotificationsScreen onNavigate={navigate} />}
        </div>
        <BottomNav currentScreen={currentScreen} onNavigate={navigate} />
      </div>
    </div>
  );
}
