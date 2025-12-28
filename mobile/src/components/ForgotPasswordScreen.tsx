import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      Alert.alert('Success', 'OTP code sent to your email');
      setStep('otp');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter valid 6-digit code');
      return;
    }
    setStep('reset');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password strength? Backend does it too.
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(email, otp, newPassword);
      Alert.alert('Success', 'Password reset successfully');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reset password');
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
          <Building2 className="text-white" size={32} strokeWidth={1.5} color="white" />
        </LinearGradient>
        <Text className="text-gray-900 mb-2 text-2xl font-semibold">
          Reset Password
        </Text>
        <Text className="text-gray-500 text-sm text-center px-4">
          {step === 'email' && 'Enter your email to receive reset code'}
          {step === 'otp' && 'Enter the code sent to your email'}
          {step === 'reset' && 'Create a new password'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm">
          {step === 'email' && (
            <View className="space-y-5">
              <View>
                <Text className="text-gray-700 mb-2 text-sm font-medium">Email Address</Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5 z-10">
                    <Mail size={20} color="#9CA3AF" strokeWidth={1.5} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900"
                    style={{ fontSize: 15 }}
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleSendCode} disabled={loading}>
                <LinearGradient
                  colors={['#003E2F', '#027A4C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-3.5 rounded-xl items-center justify-center shadow-md"
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-medium">Send Reset Code</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View className="space-y-5">
              <View>
                <Text className="text-gray-700 mb-2 text-sm font-medium">Verification Code</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-center text-gray-900 tracking-widest font-semibold"
                  style={{ fontSize: 20 }}
                />
              </View>

              <TouchableOpacity onPress={handleVerifyCode}>
                <LinearGradient
                  colors={['#003E2F', '#027A4C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-3.5 rounded-xl items-center justify-center shadow-md"
                >
                  <Text className="text-white text-base font-medium">Verify Code</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('email')}>
                <Text className="text-[#027A4C] text-center font-medium">Resend Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'reset' && (
            <View className="space-y-5">
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
                    secureTextEntry={!showPassword}
                    className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900"
                    style={{ fontSize: 15 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 z-10"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 mb-2 text-sm font-medium">Confirm Password</Text>
                <View className="relative">
                  <View className="absolute left-4 top-3.5 z-10">
                    <Lock size={20} color="#9CA3AF" strokeWidth={1.5} />
                  </View>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    secureTextEntry={!showConfirmPassword}
                    className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900"
                    style={{ fontSize: 15 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 z-10"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
                <LinearGradient
                  colors={['#003E2F', '#027A4C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-3.5 rounded-xl items-center justify-center shadow-md"
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-medium">Reset Password</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
