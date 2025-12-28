import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Bell, Receipt, MessageSquare, ClipboardList, FileText, User, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('');

  const [activeNotices, setActiveNotices] = useState<any[]>([]);

  // Reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadNotices();
    }, [])
  );

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.name);
      }
      // Optionally fetch fresh profile
      const profile = await api.profile.get();
      if (profile?.name) setUserName(profile.name);
    } catch (e) { console.log(e); }
  };

  const loadNotices = async () => {
    try {
      const data = await api.notices.getAll();
      // Take top 2 recent notices
      setActiveNotices(data.slice(0, 2));
    } catch (e) {
      console.log('Failed to load notices', e);
    }
  };

  const quickActions = [
    { icon: Receipt, label: 'Bills', screen: 'Bills', bg: '#FFF4E6', color: '#FF9800' },
    { icon: ClipboardList, label: 'Complaints', screen: 'Complaints', bg: '#FFEBEE', color: '#F44336' },
    { icon: FileText, label: 'Notices', screen: 'Notices', bg: '#F1F8F4', color: '#027A4C' },
    { icon: MessageSquare, label: 'Chat', screen: 'Chat', bg: '#E3F2FD', color: '#2196F3' },
    { icon: User, label: 'Profile', screen: 'Profile', bg: '#F3E5F5', color: '#9C27B0' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Calc time ago if needed, or just date
    return date.toLocaleDateString();
  };

  return (
    <ScrollView className="h-full bg-gray-50" contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Deep Green Gradient Header with Curved Bottom */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="pb-20 rounded-b-[32px] pt-12 px-6"
      >
        <View className="flex-row items-start justify-between mb-8">
          <View>
            <Text className="text-white/80 mb-2 text-sm">
              Welcome Home,
            </Text>
            <Text className="text-white mb-1 text-2xl font-semibold">
              {userName || 'User'}!
            </Text>
            <Text className="text-white/70 text-xs">
              Check out today's updates
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center relative"
          >
            <Bell size={20} color="white" strokeWidth={1.5} />
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#F44336] rounded-full flex items-center justify-center">
              <Text className="text-white text-[10px] font-bold">3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notice Board Preview Card */}
        <View className="bg-white rounded-2xl p-5 shadow-md">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-[#F1F8F4] flex items-center justify-center">
                <FileText size={20} color="#027A4C" strokeWidth={1.5} />
              </View>
              <View>
                <Text className="text-gray-900 text-base font-semibold">
                  Notice Board
                </Text>
                <Text className="text-gray-500 text-xs">
                  Latest updates
                </Text>
              </View>
            </View>
            <View className="px-3 py-1 rounded-full bg-[#027A4C]">
              <Text className="text-white text-xs font-medium">
                {activeNotices.length} Active
              </Text>
            </View>
          </View>

          <View className="space-y-2 mb-4">
            {activeNotices.length === 0 ? (
              <Text className="text-gray-400 text-sm py-2 text-center">No recent notices</Text>
            ) : (
              activeNotices.map((notice) => (
                <View key={notice._id} className="p-3 bg-gray-50 rounded-xl mb-2">
                  <Text className="text-gray-900 mb-1 text-sm font-medium">
                    {notice.title}
                  </Text>
                  <Text className="text-gray-400 text-[11px]">
                    {formatDate(notice.createdAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notices')}
            className="w-full py-2.5 rounded-lg flex-row items-center justify-center gap-2 bg-[#F1F8F4]"
          >
            <Text className="text-[#027A4C] text-sm font-medium">View All Notices</Text>
            <ArrowRight size={16} color="#027A4C" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View className="px-6 -mt-12">
        <View className="bg-white rounded-2xl p-5 shadow-md">
          <Text className="text-gray-900 mb-4 text-lg font-semibold">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigation.navigate(action.screen)}
                className="items-center gap-2 mb-4 w-[30%]"
                style={{ marginRight: (index + 1) % 3 === 0 ? 0 : '5%' }} // Manual gap for 3 items per row
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: action.bg }}
                >
                  <action.icon size={24} color={action.color} strokeWidth={1.5} />
                </View>
                <Text className="text-gray-700 text-center text-xs font-medium">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
