import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Lock,
  LogOut,
  ChevronRight
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    password: '',
    block: '',
    street: '',
    houseNo: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.profile.get();
      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await api.auth.logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) return <View className="h-full flex items-center justify-center"><ActivityIndicator size="large" color="#027A4C" /></View>;
  if (!profile) return <View className="h-full flex items-center justify-center"><Text>Failed to load profile</Text></View>;

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-16 rounded-b-[32px]"
      >
        <Text className="text-white mb-8 text-2xl font-semibold">
          Profile
        </Text>

        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-4">
            <User size={48} color="white" strokeWidth={1.5} />
          </View>
          <Text className="text-white mb-2 text-xl font-semibold">
            {profile.name}
          </Text>
          <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-white/20">
            <View className="w-2 h-2 rounded-full bg-[#4CAF50]" />
            <Text className="text-white text-[13px]">
              Verified Resident
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="px-6 -mt-8 space-y-4 flex-1">
        {/* Personal Information */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-gray-900 mb-4 text-base font-semibold">
            Personal Information
          </Text>
          <View className="space-y-4">
            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F1F8F4]">
                <Phone size={20} color="#027A4C" strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 mb-1 text-xs">
                  Phone
                </Text>
                <Text className="text-gray-900 text-sm font-medium">
                  {profile.phone || 'N/A'}
                </Text>
              </View>
            </View>

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
                <Text className="text-gray-900 text-sm font-medium">
                  UrbanEase
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="bg-white rounded-2xl p-2 shadow-sm mb-8">
          <TouchableOpacity
            onPress={() => navigation.navigate("EditProfile")}
            className="w-full flex-row items-center gap-4 p-4 rounded-xl"
            activeOpacity={0.7}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#E3F2FD]">
              <Edit size={20} color="#2196F3" strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-left text-gray-900 text-[15px] font-medium">
              Edit Profile
            </Text>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity className="w-full flex-row items-center gap-4 p-4 rounded-xl" activeOpacity={0.7}>
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F3E5F5]">
              <Lock size={20} color="#9C27B0" strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-left text-gray-900 text-[15px] font-medium">
              Change Password
            </Text>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogout}
            className="w-full flex-row items-center gap-4 p-4 rounded-xl"
            activeOpacity={0.7}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#FFEBEE]">
              <LogOut size={20} color="#F44336" strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-left text-[#F44336] text-[15px] font-medium">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center py-4 mb-8">
          <Text className="text-gray-400 text-[13px]">
            UrbanEase v1.0.0
          </Text>
          <Text className="text-gray-400 text-xs">
            UrbanEase
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}