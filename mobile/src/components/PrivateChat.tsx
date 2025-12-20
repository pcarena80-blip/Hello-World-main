import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const contacts: any[] = [];

export default function PrivateChat() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {contacts.map((contact, index) => (
          contact ? (
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
          ) : <View key={index} className="h-20" />
        ))}
      </ScrollView>
    </View>
  );
}
