import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, User, Phone, Mail, Camera, Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    propertyType: 'house',
    // House
    block: '',
    street: '',
    houseNo: '',
    // Apartment
    plazaName: '',
    floorNumber: '',
    flatNumber: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.profile.get();
      // The API returns "formattedAddress" but we need raw fields.
      // Ideally the backend GET /profile return object includes raw fields (it does, see profileController.getProfile: populatedProfile.toObject() includes them).
      // So we can extract them.

      setFormData(prev => ({
        ...prev,
        ...data, // This spreads all fields from backend response
        password: '' // Don't prefill password
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate password if provided
      if (formData.password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
          Alert.alert('Error', 'Password must be at least 8 chars, include uppercase, number, and special character');
          setSaving(false);
          return;
        }
      }

      // Send only necessary fields
      await api.profile.update({
        phone: formData.phone,
        password: formData.password || undefined,
        block: formData.block,
        street: formData.street,
        houseNo: formData.houseNo,
        plazaName: formData.plazaName,
        floorNumber: formData.floorNumber,
        flatNumber: formData.flatNumber,
        propertyType: formData.propertyType
      });
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="h-full items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#027A4C" />
      </View>
    );
  }

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-6 rounded-b-[32px]"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
          <ArrowLeft size={24} color="white" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text className="text-white mb-2 text-2xl font-semibold">
          Edit Profile
        </Text>
        <Text className="text-white/80 text-sm">
          Update your information
        </Text>
      </LinearGradient>

      {/* Form */}
      <ScrollView className="flex-1 px-6 py-6 pb-8" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Picture */}
        <View className="items-center mb-6">
          <View className="relative">
            <View className="w-24 h-24 rounded-full items-center justify-center bg-[#F1F8F4]">
              <User size={48} color="#027A4C" strokeWidth={1.5} />
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center shadow-md bg-[#027A4C]">
              <Camera size={16} color="white" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 mt-3 text-[13px]">Change profile picture</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm space-y-5">

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm font-medium">
              Phone Number
            </Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-white">
              <Phone size={20} color="#9CA3AF" strokeWidth={1.5} />
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                className="flex-1 py-3.5 ml-3 text-base text-gray-900"
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm font-medium">
              Email
            </Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
              <Mail size={20} color="#9CA3AF" strokeWidth={1.5} />
              <TextInput
                value={formData.email}
                editable={false}
                className="flex-1 py-3.5 ml-3 text-base text-gray-500"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm font-medium">
              New Password
            </Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-white">
              <User size={20} color="#9CA3AF" strokeWidth={1.5} />
              <TextInput
                placeholder="Enter new password"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                className="flex-1 py-3.5 ml-3 text-base text-gray-900"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-3 text-sm font-medium">
              Address ({formData.propertyType === 'apartment' ? 'Apartment' : 'House'})
            </Text>

            {formData.propertyType === 'house' ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextInput
                    value={formData.block}
                    onChangeText={(text) => setFormData({ ...formData, block: text })}
                    placeholder="Block"
                    className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    value={formData.street}
                    onChangeText={(text) => setFormData({ ...formData, street: text })}
                    placeholder="Street"
                    className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    value={formData.houseNo}
                    onChangeText={(text) => setFormData({ ...formData, houseNo: text })}
                    placeholder="House"
                    className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white"
                  />
                </View>
              </View>
            ) : (
              <View className="space-y-3">
                <View>
                  <TextInput
                    value={formData.plazaName}
                    onChangeText={(text) => setFormData({ ...formData, plazaName: text })}
                    placeholder="Plaza Name"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white"
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextInput
                      value={formData.floorNumber}
                      onChangeText={(text) => setFormData({ ...formData, floorNumber: text })}
                      placeholder="Floor"
                      className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white"
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      value={formData.flatNumber}
                      onChangeText={(text) => setFormData({ ...formData, flatNumber: text })}
                      placeholder="Flat No."
                      className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white"
                    />
                  </View>
                </View>
              </View>
            )}

          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="w-full rounded-xl shadow-md"
          >
            <LinearGradient
              colors={['#003E2F', '#027A4C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3.5 rounded-xl items-center"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-medium">Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
