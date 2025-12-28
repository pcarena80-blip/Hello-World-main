import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Building2,
  User,
  Mail,
  CreditCard,
  Phone,
  Lock,
  Home as HomeIcon,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  Check
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import StatusModal from './common/StatusModal';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cnic: "",
    phone: "",
    propertyType: "house",
    ownership: "owner",
    block: "",
    street: "",
    houseNo: "",
    plazaName: "",
    floorNumber: "",
    flatNumber: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' });

  const handleModalClose = () => {
    setModal(prev => ({ ...prev, visible: false }));
    if (modal.type === 'success') {
      navigation.navigate('Login');
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.cnic) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    // Strict Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|icloud\.com)$/;
    if (!emailRegex.test(formData.email.toLowerCase())) {
      Alert.alert('Error', 'Please use a valid email address (gmail.com, outlook.com, etc.)');
      return;
    }

    // Strict Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      Alert.alert('Error', 'Password must be at least 8 chars, include uppercase, number, and special character');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.signup(formData);
      setModal({
        visible: true,
        type: 'success',
        title: 'Account Created!',
        message: 'Your account has been successfully created. Please login to continue.'
      });
    } catch (error) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Signup Failed',
        message: error.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView className="h-full bg-gray-50" contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        {/* Top Section with Icon */}
        <View className="pt-12 pb-6 px-8 flex items-center bg-gray-50 z-10">
          <LinearGradient
            colors={['#003E2F', '#027A4C']}
            className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-md"
          >
            <Building2
              className="text-white"
              size={32}
              strokeWidth={1.5}
              color="white"
            />
          </LinearGradient>
          <Text
            className="text-gray-900 mb-1 text-2xl font-semibold"
          >
            Create Account
          </Text>
          <Text
            className="text-gray-500 text-xs"
          >
            Join UrbanEase
          </Text>
        </View>

        {/* Signup Form Card */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Full Name
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <User
                      size={16}
                      color="#9CA3AF"
                      strokeWidth={1.5}
                    />
                  </View>
                  <TextInput
                    value={formData.fullName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, fullName: text })
                    }
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white"
                    style={{ fontSize: 14 }}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Email Address
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <Mail
                      size={16}
                      color="#9CA3AF"
                      strokeWidth={1.5}
                    />
                  </View>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white"
                    style={{ fontSize: 14 }}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  CNIC Number
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <CreditCard
                      size={16}
                      color="#9CA3AF"
                      strokeWidth={1.5}
                    />
                  </View>
                  <TextInput
                    value={formData.cnic}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, '').slice(0, 13);
                      let formatted = digits;
                      if (digits.length > 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
                      if (digits.length > 12) formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
                      setFormData({ ...formData, cnic: formatted });
                    }}
                    keyboardType="numeric"
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white text-gray-900"
                    style={{ fontSize: 14 }}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Phone Number
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <Phone
                      size={16}
                      color="#9CA3AF"
                      strokeWidth={1.5}
                    />
                  </View>
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) => {
                      // Filter out non-numeric characters except +, -, and spaces
                      const filtered = text.replace(/[^0-9+\s-]/g, '');
                      setFormData({ ...formData, phone: filtered });
                    }}
                    placeholder="+92 XXX XXXXXXX"
                    keyboardType="phone-pad"
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white"
                    style={{ fontSize: 14 }}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Property Type
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, propertyType: "house" })}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.propertyType === "house"
                      ? "border-[#027A4C] bg-[#F1F8F4]"
                      : "border-gray-200"
                      }`}
                  >
                    <Text className={formData.propertyType === "house" ? "text-[#027A4C] font-medium" : "text-gray-600"}>House</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, propertyType: "apartment" })}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.propertyType === "apartment"
                      ? "border-[#027A4C] bg-[#F1F8F4]"
                      : "border-gray-200"
                      }`}
                  >
                    <Text className={formData.propertyType === "apartment" ? "text-[#027A4C] font-medium" : "text-gray-600"}>Apartment</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Ownership
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, ownership: "owner" })}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.ownership === "owner"
                      ? "border-[#027A4C] bg-[#F1F8F4]"
                      : "border-gray-200"
                      }`}
                  >
                    <Text className={formData.ownership === "owner" ? "text-[#027A4C] font-medium" : "text-gray-600"}>Owner</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, ownership: "tenant" })}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.ownership === "tenant"
                      ? "border-[#027A4C] bg-[#F1F8F4]"
                      : "border-gray-200"
                      }`}
                  >
                    <Text className={formData.ownership === "tenant" ? "text-[#027A4C] font-medium" : "text-gray-600"}>Tenant</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {formData.propertyType === 'house' ? (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-700 mb-2 text-xs font-medium">Block / Sector</Text>
                    <TextInput
                      value={formData.block}
                      onChangeText={text => setFormData({ ...formData, block: text })}
                      placeholder="B / S"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white"
                      style={{ fontSize: 14 }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 mb-2 text-xs font-medium">Street</Text>
                    <TextInput
                      value={formData.street}
                      onChangeText={text => setFormData({ ...formData, street: text })}
                      placeholder="Street"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white"
                      style={{ fontSize: 14 }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 mb-2 text-xs font-medium">House</Text>
                    <TextInput
                      value={formData.houseNo}
                      onChangeText={text => setFormData({ ...formData, houseNo: text })}
                      placeholder="No."
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white"
                      style={{ fontSize: 14 }}
                    />
                  </View>
                </View>
              ) : (
                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-700 mb-2 text-xs font-medium">Plaza Name</Text>
                    <View className="relative">
                      <View className="absolute left-3 top-3.5 z-10">
                        <Building2 size={16} color="#9CA3AF" strokeWidth={1.5} />
                      </View>
                      <TextInput
                        value={formData.plazaName || ''}
                        onChangeText={text => setFormData({ ...formData, plazaName: text })}
                        placeholder="Enter plaza name"
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white"
                        style={{ fontSize: 14 }}
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-gray-700 mb-2 text-xs font-medium">Floor</Text>
                      <TextInput
                        value={formData.floorNumber || ''}
                        onChangeText={text => setFormData({ ...formData, floorNumber: text })}
                        placeholder="e.g. 1st"
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white"
                        style={{ fontSize: 14 }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 mb-2 text-xs font-medium">Flat No.</Text>
                      <TextInput
                        value={formData.flatNumber || ''}
                        onChangeText={text => setFormData({ ...formData, flatNumber: text })}
                        placeholder="e.g. A-1"
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white"
                        style={{ fontSize: 14 }}
                      />
                    </View>
                  </View>
                </View>
              )}

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Password
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <Lock
                      size={16}
                      color="#9CA3AF"
                      strokeWidth={1.5}
                    />
                  </View>
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    placeholder="Create password"
                    secureTextEntry={!showPassword}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-white text-gray-900"
                    style={{ fontSize: 14 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 z-10"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color="#9CA3AF" strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} color="#9CA3AF" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">
                  Confirm Password
                </Text>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <Lock
                      size={16}
                      color="#9CA3AF"
                      strokeWidth={1.5}
                    />
                  </View>
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      setFormData({ ...formData, confirmPassword: text })
                    }
                    placeholder="Re-enter password"
                    secureTextEntry={!showConfirmPassword}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-white text-gray-900"
                    style={{ fontSize: 14 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 z-10"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} color="#9CA3AF" strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} color="#9CA3AF" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={() => setFormData({ ...formData, agreeTerms: !formData.agreeTerms })}
              >
                <View className={`w-4 h-4 rounded border items-center justify-center ${formData.agreeTerms ? 'bg-[#027A4C] border-[#027A4C]' : 'border-gray-300'}`}>
                  {formData.agreeTerms && <Check size={10} color="white" strokeWidth={3} />}
                </View>
                <Text className="text-gray-600 text-xs">
                  I agree to <Text className="text-[#027A4C]">Terms & Conditions</Text> and <Text className="text-[#027A4C]">Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#003E2F', '#027A4C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-base font-medium">Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </View>

          <View className="flex-row justify-center mt-6 pb-4">
            <Text className="text-center text-gray-600 text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-[#027A4C] font-medium text-sm">
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <StatusModal
          visible={modal.visible}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={handleModalClose}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}