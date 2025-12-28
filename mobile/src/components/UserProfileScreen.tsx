import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { User, Phone, Mail, MapPin, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';

export default function UserProfileScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const userId = route.params?.userId; // Safe access

    if (!userId) {
        // Handle case where userId is missing
        return (
            <View className="h-full flex items-center justify-center bg-gray-50">
                <Text>Invalid User Profile</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-2 bg-gray-200 rounded">
                    <Text>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            const data = await api.profile.getById(userId);
            setProfile(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View className="h-full flex items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#027A4C" /></View>;
    if (!profile) return <View className="h-full flex items-center justify-center bg-gray-50"><Text>User not found</Text></View>;

    return (
        <View className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={['#003E2F', '#005C3C', '#027A4C']}
                className="px-6 pt-12 pb-16 rounded-b-[32px]"
            >
                <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
                    <ArrowLeft size={24} color="white" strokeWidth={1.5} />
                </TouchableOpacity>
                <View className="items-center">
                    <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-4">
                        <User size={48} color="white" strokeWidth={1.5} />
                    </View>
                    <Text className="text-white mb-2 text-xl font-semibold">
                        {profile.name}
                    </Text>
                    <Text className="text-white/80 text-sm">
                        Resident
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView className="px-6 -mt-8 space-y-4 flex-1">
                {/* Personal Information */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-gray-900 mb-4 text-base font-semibold">
                        Contact Information
                    </Text>
                    <View className="space-y-4">
                        <View className="flex-row items-center gap-4">
                            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F1F8F4]">
                                <Mail size={20} color="#027A4C" strokeWidth={1.5} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-500 mb-1 text-xs">
                                    Email
                                </Text>
                                <Text className="text-gray-900 text-sm font-medium">
                                    {profile.email}
                                </Text>
                            </View>
                        </View>

                        {/* Address (Maybe hidden for privacy? But user has View Profile feature so implies visibility) */}
                        <View className="flex-row items-center gap-4">
                            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F1F8F4]">
                                <MapPin size={20} color="#027A4C" strokeWidth={1.5} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-500 mb-1 text-xs">
                                    Address
                                </Text>
                                <Text className="text-gray-900 text-sm font-medium">
                                    {profile.address || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
