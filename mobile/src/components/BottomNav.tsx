import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ClipboardList, MessageSquare, User, FileText } from 'lucide-react-native';
import { View, Text } from 'react-native';
import HomeScreen from './HomeScreen';
import ComplaintsScreen from './ComplaintsScreen';
import NoticesScreen from './NoticeBoard';
import ChatCenter from './ChatCenter';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomNav() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#027A4C',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 10,
          opacity: 0.8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Complaints"
        component={ComplaintsScreen}
        options={{
          tabBarLabel: 'Complaints',
          tabBarIcon: ({ color, size }) => <ClipboardList size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Notices"
        component={NoticesScreen}
        options={{
          tabBarLabel: 'Notices',
          tabBarIcon: ({ color, size }) => <FileText size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatCenter}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageSquare size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={24} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tab.Navigator>
  );
}
