import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.auth.login(email, password);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));

      Alert.alert('Success', 'Login successful');
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="h-full bg-gray-50" contentContainerStyle={{ flexGrow: 1 }}>
      {/* Top Section with Icon */}
      <View className="pt-16 pb-8 px-8 flex items-center">
        <LinearGradient
          colors={['#003E2F', '#027A4C']}
          className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center shadow-lg"
        >
          <Building2 className="text-white" size={40} strokeWidth={1.5} color="white" />
        </LinearGradient>
        <Text className="text-gray-900 mb-2 text-2xl font-semibold">
          UrbanEase
        </Text>
        <Text className="text-gray-500 text-sm">
          Welcome back! Please login to continue
        </Text>
      </View>

      {/* Login Card */}
      <View className="flex-1 px-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm">
          <View className="space-y-5">
            <View>
              <Text className="text-gray-700 mb-2 text-sm font-medium">
                Email Address
              </Text>
              <View className="relative">
                <View className="absolute left-4 top-3.5 z-10">
                  <Mail size={20} color="#9CA3AF" strokeWidth={1.5} />
                </View>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white"
                  style={{ fontSize: 15 }}
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-700 mb-2 text-sm font-medium">
                Password
              </Text>
              <View className="relative">
                <View className="absolute left-4 top-3.5 z-10">
                  <Lock size={20} color="#9CA3AF" strokeWidth={1.5} />
                </View>
                <TextInput
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white"
                  style={{ fontSize: 15 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 z-10"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" strokeWidth={1.5} />
                  ) : (
                    <Eye size={20} color="#9CA3AF" strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View className={`w-4 h-4 rounded border ${rememberMe ? 'bg-[#027A4C] border-[#027A4C]' : 'border-gray-300'}`} />
                <Text className="text-gray-600 text-sm">Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text className="text-[#027A4C] text-sm font-medium">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
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
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white text-base font-medium">Login</Text>
                    <ArrowRight size={20} color="white" strokeWidth={2} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-center text-gray-600 text-sm">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text className="text-[#027A4C] font-medium text-sm">
              Sign Up Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
