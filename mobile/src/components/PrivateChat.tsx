import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function PrivateChat() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCachedInbox();
    loadInbox();
    // Refresh inbox every 5 seconds
    const interval = setInterval(loadInbox, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCachedInbox = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedInbox');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (parsedData && parsedData.length > 0) {
          setConversations(parsedData);
          setLoading(false);
        }
      }
    } catch (error) {
      console.log('Failed to load cached inbox');
    }
  };

  const loadInbox = async () => {
    try {
      const data = await api.chat.getInbox();
      setConversations(data);
      // Update cache
      await AsyncStorage.setItem('cachedInbox', JSON.stringify(data));
    } catch (error) {
      console.log('Failed to load inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#027A4C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">No conversations yet</Text>
            <Text className="text-gray-400 text-sm mt-2">Start a chat from Community Chat</Text>
          </View>
        ) : (
          conversations.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              onPress={() => navigation.navigate('PrivateChatDetail', { chat: contact })}
              className="w-full px-6 py-4 border-b border-gray-100 flex-row items-center gap-4"
            >
              <View className="relative">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center bg-[#027A4C]"
                >
                  <Text className="text-white text-sm font-semibold">
                    {contact.avatar}
                  </Text>
                </View>
                {contact.online && (
                  <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4CAF50] rounded-full border-2 border-white" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 mb-1 text-[15px] font-medium">
                  {contact.name}
                </Text>
                <Text className="text-gray-500 text-[13px]" numberOfLines={1}>
                  {contact.lastMessage}
                </Text>
              </View>
              <Text className="text-gray-400 text-[11px]">
                {contact.time}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
