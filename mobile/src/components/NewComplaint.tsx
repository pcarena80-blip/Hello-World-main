import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Image as ImageIcon, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function NewComplaint() {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'low'
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Maintenance',
    'Water Supply',
    'Electricity',
    'Security',
    'Garbage Collection',
    'Noise Complaint',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!formData.category || !formData.title || !formData.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.complaints.create(formData);
      Alert.alert('Success', 'Complaint submitted successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit complaint');
    } finally {
      setIsLoading(false);
    }
  };

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
          New Complaint
        </Text>
        <Text className="text-white/80 text-sm">
          Submit your issue
        </Text>
      </LinearGradient>

      {/* Form */}
      <ScrollView className="flex-1 px-6 py-6 pb-8" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm font-medium">
              Category
            </Text>
            {/* Simple selection simulation using a horizontal scroll or just buttons for now */}
            <View className="relative z-50">
              <TouchableOpacity
                onPress={() => setShowDropdown(!showDropdown)}
                className="flex-row items-center justify-between px-4 py-3.5 border border-gray-200 rounded-xl bg-white"
              >
                <Text className={`${formData.category ? 'text-gray-900' : 'text-gray-500'} text-base`}>
                  {formData.category || 'Select Category'}
                </Text>
                <ChevronDown size={20} color="#9CA3AF" strokeWidth={1.5} />
              </TouchableOpacity>

              {showDropdown && (
                <View className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setFormData({ ...formData, category: cat });
                        setShowDropdown(false);
                      }}
                      className={`px-4 py-3 ${index !== categories.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <Text className={`text-base ${formData.category === cat ? 'text-[#027A4C] font-medium' : 'text-gray-700'}`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>



          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm font-medium">
              Title
            </Text>
            <TextInput
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base bg-white"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm font-medium">
              Description
            </Text>
            <TextInput
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Provide detailed information about your complaint"
              multiline
              numberOfLines={4}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base bg-white h-32"
              textAlignVertical="top"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-3 text-sm font-medium">
              Attach Photo (Optional)
            </Text>
            <TouchableOpacity className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl items-center gap-3">
              <View className="w-14 h-14 rounded-2xl items-center justify-center bg-[#F1F8F4]">
                <ImageIcon size={28} color="#027A4C" strokeWidth={1.5} />
              </View>
              <View className="items-center">
                <Text className="text-gray-700 mb-1 text-sm font-medium">
                  Tap to upload image
                </Text>
                <Text className="text-gray-400 text-xs">
                  JPG, PNG (Max 5MB)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            className="w-full rounded-xl shadow-md"
          >
            <LinearGradient
              colors={['#003E2F', '#027A4C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-3.5 rounded-xl items-center flex-row justify-center gap-2"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-medium">Submit Complaint</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
