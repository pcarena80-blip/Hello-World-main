import { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import CommunityChat from './CommunityChat';
import PrivateChat from './PrivateChat';

export default function ChatCenter() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community');

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
            Chat Center
          </Text>
        </View>
        <Text className="text-white/80 ml-10 text-sm">
          Connect with your community
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View className="bg-white px-4 pt-4 pb-2 border-b border-gray-100">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab('community')}
            className={`flex-1 py-3 rounded-t-2xl items-center justify-center ${activeTab !== 'community' ? 'bg-gray-100' : ''}`}
          >
            {activeTab === 'community' ? (
              <LinearGradient
                colors={['#003E2F', '#027A4C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute top-0 left-0 right-0 bottom-0 rounded-t-2xl"
              />
            ) : null}
            <Text className={`${activeTab === 'community' ? 'text-white' : 'text-gray-600'} text-[15px] font-medium relative top-0`}>
              Community Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('private')}
            className={`flex-1 py-3 rounded-t-2xl items-center justify-center ${activeTab !== 'private' ? 'bg-gray-100' : ''}`}
          >
            {activeTab === 'private' ? (
              <LinearGradient
                colors={['#003E2F', '#027A4C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute top-0 left-0 right-0 bottom-0 rounded-t-2xl"
              />
            ) : null}
            <Text className={`${activeTab === 'private' ? 'text-white' : 'text-gray-600'} text-[15px] font-medium`}>
              Private Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-white">
        {activeTab === 'community' ? (
          <View className="flex-1">
            {/* We can render the list of chats here if we want to show 'Enter Chat' buttons, 
                 or directly the CommunityChat component. 
                 The original code showed a button to ENTER community chat. 
                 Let's stick to the original design: A button to enter the chat. 
              */}
            <View className="px-6 py-6">
              <TouchableOpacity
                onPress={() => navigation.navigate('CommunityChatDetail')}
                className="w-full bg-gray-50 rounded-2xl p-5 flex-row items-center gap-4"
              >
                <LinearGradient
                  colors={['#003E2F', '#027A4C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                >
                  <Text className="text-white text-xl font-semibold">GV</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-gray-900 mb-1 text-base font-semibold">UrbanEase Community</Text>
                  <Text className="text-gray-500 text-xs">256 members • Tap to open chat</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <PrivateChat />
        )}
      </View>
    </View>
  );
}
