import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

const PlaceholderScreen = ({ title }: { title: string }) => {
    const navigation = useNavigation();

    return (
        <View className="flex-1 bg-gray-50 items-center justify-center p-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">{title}</Text>
            <Text className="text-gray-500 text-center mb-6">
                This feature is coming soon! We are working hard to bring you the best experience.
            </Text>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-[#027A4C] px-6 py-3 rounded-xl flex-row items-center gap-2"
            >
                <ArrowLeft size={20} color="white" />
                <Text className="text-white font-medium">Go Back</Text>
            </TouchableOpacity>
        </View>
    );
};

export const BillsScreen = () => <PlaceholderScreen title="Bills & Payments" />;
export const ComplaintsScreen = () => <PlaceholderScreen title="Complaints Center" />;
export const NoticesScreen = () => <PlaceholderScreen title="Notice Board" />;
export const ChatScreen = () => <PlaceholderScreen title="Community Chat" />;
export const ProfileScreen = () => <PlaceholderScreen title="My Profile" />;
