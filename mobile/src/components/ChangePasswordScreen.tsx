import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Lock, Building2, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function ChangePasswordScreen() {
    const navigation = useNavigation();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            Alert.alert('Error', 'Password must be at least 8 chars, include uppercase, number, and special character');
            return;
        }

        setLoading(true);
        try {
            await api.profile.update({
                oldPassword: oldPassword,
                password: newPassword
            });
            Alert.alert('Success', 'Password changed successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="h-full flex-col bg-gray-50">
            <View className="pt-12 pb-6 px-8 flex items-center bg-gray-50 z-10">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="absolute left-6 top-14 p-2 z-20"
                >
                    <ArrowLeft size={24} color="#374151" strokeWidth={1.5} />
                </TouchableOpacity>

                <LinearGradient
                    colors={['#003E2F', '#027A4C']}
                    className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-md"
                >
                    <Lock className="text-white" size={32} strokeWidth={1.5} color="white" />
                </LinearGradient>
                <Text className="text-gray-900 mb-2 text-2xl font-semibold">
                    Change Password
                </Text>
                <Text className="text-gray-500 text-sm">
                    Secure your account
                </Text>
            </View>

            <ScrollView className="flex-1 px-6">
                <View className="bg-white rounded-3xl p-6 shadow-sm space-y-5">

                    {/* Old Password */}
                    <View>
                        <Text className="text-gray-700 mb-2 text-sm font-medium">Old Password</Text>
                        <View className="relative">
                            <View className="absolute left-4 top-3.5 z-10">
                                <Lock size={20} color="#9CA3AF" strokeWidth={1.5} />
                            </View>
                            <TextInput
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                placeholder="Enter old password"
                                secureTextEntry={!showOld}
                                className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900"
                                style={{ fontSize: 15 }}
                            />
                            <TouchableOpacity
                                onPress={() => setShowOld(!showOld)}
                                className="absolute right-4 top-3.5 z-10"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showOld ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View>
                        <Text className="text-gray-700 mb-2 text-sm font-medium">New Password</Text>
                        <View className="relative">
                            <View className="absolute left-4 top-3.5 z-10">
                                <Lock size={20} color="#9CA3AF" strokeWidth={1.5} />
                            </View>
                            <TextInput
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                secureTextEntry={!showNew}
                                className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900"
                                style={{ fontSize: 15 }}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNew(!showNew)}
                                className="absolute right-4 top-3.5 z-10"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showNew ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View>
                        <Text className="text-gray-700 mb-2 text-sm font-medium">Confirm New Password</Text>
                        <View className="relative">
                            <View className="absolute left-4 top-3.5 z-10">
                                <Lock size={20} color="#9CA3AF" strokeWidth={1.5} />
                            </View>
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter new password"
                                secureTextEntry={!showConfirm}
                                className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900"
                                style={{ fontSize: 15 }}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-3.5 z-10"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showConfirm ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                        <LinearGradient
                            colors={['#003E2F', '#027A4C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full py-3.5 rounded-xl items-center justify-center shadow-md"
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-medium">Change Password</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </View>
    );
}
