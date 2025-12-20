import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Bell, Receipt, MessageSquare, ClipboardList, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
    const navigation = useNavigation<any>();

    const notifications = [
        {
            id: 1,
            type: 'bill',
            title: 'New Bill Generated',
            description: 'Your electricity bill for December 2024 is now available.',
            time: '2 hours ago',
            read: false,
            icon: Receipt,
            color: '#FF9800',
            bg: '#FFF4E6'
        },
        {
            id: 2,
            type: 'complaint',
            title: 'Complaint Resolved',
            description: 'Your complaint #CMP-2024-001 regarding water leakage has been resolved.',
            time: '1 day ago',
            read: true,
            icon: ClipboardList,
            color: '#4CAF50',
            bg: '#E8F5E9'
        },
        {
            id: 3,
            type: 'notice',
            title: 'Community Meeting',
            description: 'Reminder: Annual general meeting is scheduled for this Friday at 5 PM.',
            time: '2 days ago',
            read: true,
            icon: Info,
            color: '#2196F3',
            bg: '#E3F2FD'
        },
        {
            id: 4,
            type: 'chat',
            title: 'New Message',
            description: 'You have a new message from the Building Admin.',
            time: '3 days ago',
            read: true,
            icon: MessageSquare,
            color: '#027A4C',
            bg: '#F1F8F4'
        }
    ];

    return (
        <View className="h-full bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={['#003E2F', '#027A4C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-6 pt-12 pb-4 rounded-b-[32px]"
            >
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="white" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold">
                        Notifications
                    </Text>
                </View>
            </LinearGradient>

            {/* Notifications List */}
            <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
                {notifications.map((notification) => (
                    <View
                        key={notification.id}
                        className={`bg-white rounded-2xl p-4 mb-4 shadow-sm ${!notification.read ? 'border border-[#027A4C]/20' : ''}`}
                    >
                        <View className="flex-row gap-4">
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center"
                                style={{ backgroundColor: notification.bg }}
                            >
                                <notification.icon size={24} color={notification.color} strokeWidth={1.5} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className={`text-gray-900 text-[15px] ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                        {notification.title}
                                    </Text>
                                    <Text className="text-gray-400 text-[11px]">
                                        {notification.time}
                                    </Text>
                                </View>
                                <Text className="text-gray-600 text-[13px] leading-snug">
                                    {notification.description}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
