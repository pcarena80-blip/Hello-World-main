import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export default function NoticesScreen() {
  const navigation = useNavigation<any>();
  const [notices, setNotices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      console.log('📋 NoticeBoard: Fetching notices...');
      const data = await api.notices.getAll();
      console.log('📋 NoticeBoard: Received', data?.length, 'notices');
      setNotices(data || []);
    } catch (error: any) {
      console.error('📋 NoticeBoard: Error:', error);
      Alert.alert(
        'Cannot Load Notices',
        error.message || 'Please check your internet connection and try again.'
      );
      setNotices([]); // Set empty array so UI shows "No notices"
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  const getPriorityConfig = (priority: string) => {
    // Defaulting logic since backend might not send priority yet (schema didn't strictly have it, though Notices model I created has title/desc/expiry)
    // Wait, my Notice model ONLY has title, description, expiryDate. NO priority.
    // So I will default to 'medium' or add logic based on expiry?
    // Let's just default to 'medium' for now or random to keep UI vibrant, or 'high' if very close to expiry.

    // For now, let's just make it look good.
    return { bg: '#027A4C', label: 'Safety' }; // Default generic label + color since we don't store priority
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-6 rounded-b-[32px]"
      >
        <View className="flex-row items-center gap-4 mb-2">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">
            Notice Board
          </Text>
        </View>
        <Text className="text-white/80 ml-10 text-sm">
          Stay updated with society announcements
        </Text>
      </LinearGradient>

      {/* Notices List */}
      <ScrollView
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <Text className="text-center text-gray-500 mt-10">Loading notices...</Text>
        ) : notices.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">No new notices.</Text>
        ) : (
          notices.map((notice) => {
            return (
              <TouchableOpacity
                key={notice._id}
                onPress={() => navigation.navigate('NoticeDetails', { notice })}
                className="bg-white rounded-2xl p-5 shadow-sm mb-4"
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View
                    className="px-3 py-1 rounded-full bg-[#027A4C]/10"
                  >
                    <Text className="text-[#027A4C] text-[11px] font-medium">Community</Text>
                  </View>
                  <Text className="text-gray-400 text-xs">
                    {formatDate(notice.createdAt)}
                  </Text>
                </View>

                <Text className="text-gray-900 mb-2 text-base font-semibold">
                  {notice.title}
                </Text>
                <Text className="text-gray-600 text-sm" numberOfLines={2}>
                  {notice.description}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
