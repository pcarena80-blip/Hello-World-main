import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, Search, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function CommunityChat() {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUser();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadMessages = async () => {
    try {
      const data = await api.chat.getMessages('community');
      setMessages(data);
    } catch (error) {
      console.log('Failed to load messages');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedImage)) return;

    try {
      const formData = new FormData();
      formData.append('receiverId', 'community');

      if (messageText.trim()) {
        formData.append('message', messageText);
      }

      if (selectedImage) {
        // @ts-ignore
        formData.append('file', {
          uri: selectedImage.uri,
          type: 'image/jpeg', // Adjust based on file type if needed, jpeg is safe default
          name: 'upload.jpg',
        });
      }

      await api.chat.sendMessage(formData); // Ensure API handles FormData
      setMessageText('');
      setSelectedImage(null);
      loadMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const startPrivateChat = (otherUser: any) => {
    setSelectedUser(null);
    // Construct a chat object that matches what PrivateChatDetail expects
    // We might need an ID mapping if 'otherUser' just has senderId
    // For now, passing relevant info.
    navigation.navigate('PrivateChatDetail', {
      chat: {
        id: otherUser.senderId,
        name: otherUser.name,
        avatar: otherUser.avatar,
        // Add other necessary fields
      }
    });
  };

  const renderItem = ({ item: msg }: { item: any }) => (
    <View className={`flex-row gap-3 mb-4 ${msg.sender === 'admin' ? 'justify-center' : ''} px-6`}>
      {msg.sender !== 'admin' && msg.sender !== 'user' && (
        <TouchableOpacity
          onPress={() => setSelectedUser(msg)}
          className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center flex-shrink-0"
        >
          <Text className="text-gray-600 text-xs font-medium">
            {msg.avatar}
          </Text>
        </TouchableOpacity>
      )}
      {msg.sender === 'user' && <View className="w-9" />}

      <View
        className={`flex-1 ${msg.sender === 'admin' ? 'max-w-[80%]' : 'max-w-[75%]'} ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
      >
        {msg.sender !== 'admin' && msg.sender !== 'user' && (
          <Text className="text-gray-600 mb-1 text-xs font-medium">
            {msg.name}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => setSelectedMessage(msg)}
          activeOpacity={0.8}
          className={`p-3.5 ${msg.sender === 'admin'
            ? 'bg-gray-100 rounded-2xl'
            : msg.sender === 'user'
              ? 'bg-[#027A4C] rounded-2xl rounded-tr-sm'
              : 'bg-[#F5F5F5] rounded-2xl rounded-tl-sm'
            }`}
        >
          {msg.attachment && msg.attachmentType === 'image' && (
            <Image
              source={{ uri: `http://10.0.2.2:5000/${msg.attachment}` }}
              style={{ width: 200, height: 150, borderRadius: 8, marginBottom: msg.message ? 8 : 0 }}
              resizeMode="cover"
            />
          )}
          {msg.message ? (
            <Text className={`${msg.sender === 'admin' ? 'text-gray-700 text-center' : msg.sender === 'user' ? 'text-white' : 'text-gray-900'} text-sm`}>
              {msg.message}
            </Text>
          ) : null}
        </TouchableOpacity>
        <Text className={`text-gray-400 mt-1 text-[11px] ${msg.sender === 'user' ? 'text-right' : ''}`}>
          {msg.time}
        </Text>
      </View>

      {
        msg.sender === 'user' && (
          <View className="w-9 h-9 rounded-full bg-[#027A4C] items-center justify-center flex-shrink-0">
            <Text className="text-white text-xs font-medium">
              {msg.avatar}
            </Text>
          </View>
        )
      }
    </View >
  );


  const filteredMessages = messages.filter(msg => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (msg.message && msg.message.toLowerCase().includes(lowerQuery)) ||
      (msg.name && msg.name.toLowerCase().includes(lowerQuery))
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 flex flex-col">
        {/* Header */}
        <LinearGradient
          colors={['#003E2F', '#027A4C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 pt-12 pb-4 border-b border-gray-100"
        >
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="white" strokeWidth={1.5} />
            </TouchableOpacity>

            <View className="flex-1">
              {!isSearchOpen ? (
                <View>
                  <Text className="text-white text-lg font-semibold">
                    Urban East Community
                  </Text>
                  <Text className="text-white/80 text-xs">
                    256 members
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-white/20 rounded-lg px-3 py-1">
                  <Search size={16} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    autoFocus
                    className="flex-1 ml-2 text-white text-base"
                    placeholder="Search..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearchOpen(false); }}>
                    <X size={16} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {!isSearchOpen && (
              <TouchableOpacity onPress={() => setIsSearchOpen(true)}>
                <Search size={24} color="white" strokeWidth={1.5} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Messages */}
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 24 }}
          className="flex-1 bg-white"
        />

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View className="bg-white border-t border-gray-100 p-4 pb-8 mb-4">
            {selectedImage && (
              <View className="flex-row items-center mb-2 bg-gray-50 p-2 rounded-lg">
                <Image source={{ uri: selectedImage.uri }} style={{ width: 40, height: 40, borderRadius: 4 }} />
                <TouchableOpacity onPress={() => setSelectedImage(null)} className="ml-auto p-2">
                  <Text className="text-gray-500 font-bold">X</Text>
                </TouchableOpacity>
              </View>
            )}
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={pickImage} className="text-gray-400">
                <Paperclip size={20} color="#9CA3AF" strokeWidth={1.5} />
              </TouchableOpacity>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-base"
                style={{ maxHeight: 100 }}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#003E2F', '#027A4C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-11 h-11 rounded-xl items-center justify-center"
                >
                  <Send size={20} color="white" strokeWidth={1.5} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>


        {/* Profile Options Modal */}
        <Modal
          transparent
          visible={!!selectedUser}
          animationType="fade"
          onRequestClose={() => setSelectedUser(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedUser(null)}>
            <View className="flex-1 bg-black/50 justify-center items-center p-6">
              <TouchableWithoutFeedback>
                <View className="bg-white w-full max-w-[300px] rounded-2xl overflow-hidden shadow-xl">
                  <View className="p-4 items-center border-b border-gray-100">
                    <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                      <Text className="text-xl font-semibold text-gray-600">{selectedUser?.avatar}</Text>
                    </View>
                    <Text className="text-lg font-semibold text-gray-900">{selectedUser?.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => startPrivateChat(selectedUser)}
                    className="p-4 border-b border-gray-100 active:bg-gray-50"
                  >
                    <Text className="text-center text-gray-700 font-medium">Private Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      // Navigate to profile
                      setSelectedUser(null);
                      // navigation.navigate('UserProfile', { userId: selectedUser?.id });
                    }}
                    className="p-4 active:bg-gray-50"
                  >
                    <Text className="text-center text-gray-700 font-medium">View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedUser(null)}
                    className="p-4 border-t border-gray-100 bg-gray-50 active:bg-gray-100"
                  >
                    <Text className="text-center text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Message Options Modal */}
        <Modal
          transparent
          visible={!!selectedMessage}
          animationType="fade"
          onRequestClose={() => setSelectedMessage(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
            <View className="flex-1 bg-black/50 justify-center items-center p-6">
              <TouchableWithoutFeedback>
                <View className="bg-white w-full max-w-[300px] rounded-2xl overflow-hidden shadow-xl">
                  <View className="p-4 border-b border-gray-100">
                    <Text className="text-center text-gray-900 font-semibold mb-1">Message Options</Text>
                    <Text className="text-center text-gray-500 text-sm" numberOfLines={2}>
                      "{selectedMessage?.message}"
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      // Handle report message
                      setSelectedMessage(null);
                      alert('Message reported');
                    }}
                    className="p-4 border-b border-gray-100 active:bg-gray-50"
                  >
                    <Text className="text-center text-red-500 font-medium">Report Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      // Handle report profile
                      setSelectedMessage(null);
                      alert('Profile reported');
                    }}
                    className="p-4 active:bg-gray-50"
                  >
                    <Text className="text-center text-red-500 font-medium">Report Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedMessage(null)}
                    className="p-4 border-t border-gray-100 bg-gray-50 active:bg-gray-100"
                  >
                    <Text className="text-center text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
