import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivateChatDetail() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { chat } = route.params || {};
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    useEffect(() => {
        loadUser();
        // Initial load
        loadMessages();
        // Poll for new messages every 3s
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    };

    const loadMessages = async () => {
        try {
            // Fetch all messages (or filtered by chat.id if backend supports it)
            // Assuming getMessages returns all messages involving this user
            // We need to filter client-side if backend doesn't filter
            // But api.chat.getMessages currently hits /chat/:userId (GET)
            // It might return all chats or specific conversation?
            // Let's assume it returns a list of messages.
            const data = await api.chat.getMessages(chat.id);
            setMessages(data);
        } catch (error) {
            console.log('Error loading private messages:', error);
        }
    };

    if (!chat) return null;

    // Mock messages removed

    const handleSend = async () => {
        if (!messageText.trim()) return;

        try {
            await api.chat.sendMessage({
                receiverId: chat.id,
                message: messageText
            });
            setMessageText('');
            loadMessages();
        } catch (error) {
            console.error('Send failed:', error);
        }
    };

    const renderItem = ({ item: msg }: { item: any }) => {
        const isMe = msg.senderId === user?._id || msg.sender === 'user';
        return (
            <View className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'} px-6`}>
                <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Image Message - NO bubble, just clean image */}
                    {msg.attachment && msg.attachmentType === 'image' && (
                        <TouchableOpacity
                            onPress={() => setViewerImage(api.getImageUrl(msg.attachment))}
                            activeOpacity={0.9}
                            style={{ marginBottom: msg.message ? 8 : 0 }}
                        >
                            <Image
                                source={{ uri: api.getImageUrl(msg.attachment) }}
                                style={{
                                    width: 200,
                                    height: 150,
                                    borderRadius: 12,
                                    backgroundColor: '#f0f0f0',
                                    borderWidth: 1,
                                    borderColor: '#e0e0e0'
                                }}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}

                    {/* Text Message - WITH bubble */}
                    {msg.message && (
                        <View
                            className={`p-3.5 ${isMe
                                ? 'bg-[#F1F8F4] rounded-2xl rounded-tr-sm'
                                : 'bg-white rounded-2xl rounded-tl-sm'
                                }`}
                        >
                            <Text className={`${isMe ? 'text-[#027A4C]' : 'text-gray-900'} text-sm`}>
                                {msg.message}
                            </Text>
                        </View>
                    )}
                    <Text className="text-gray-400 mt-1 text-[11px]">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        )
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <View className="flex-1">
                    {/* Header */}
                    <LinearGradient
                        colors={['#003E2F', '#027A4C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-6 pt-4 pb-4 border-b border-gray-100"
                    >
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <ArrowLeft size={24} color="white" strokeWidth={1.5} />
                            </TouchableOpacity>
                            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                                <Text className="text-white text-sm font-semibold">
                                    {chat.avatar}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-semibold">
                                    {chat.name}
                                </Text>
                                <Text className="text-white/80 text-xs">
                                    {chat.online ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Messages */}
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 24 }}
                        className="flex-1 bg-gray-50"
                    />

                    {/* Input Bar - Now properly positioned with KeyboardAvoidingView */}
                    <View className="bg-white border-t border-gray-100 px-4 py-3">
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity className="text-gray-400">
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
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
