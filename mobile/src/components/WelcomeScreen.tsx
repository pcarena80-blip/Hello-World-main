import { View, Text, TouchableOpacity } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <LinearGradient
      colors={['#003E2F', '#005C3C', '#027A4C']}
      className="h-full flex flex-col items-center justify-center px-8"
    >
      <View className="flex flex-col items-center mb-16">
        <View className="w-28 h-28 rounded-3xl bg-white/10 flex items-center justify-center mb-8 shadow-lg">
          <Building2
            className="text-white"
            size={56}
            strokeWidth={1.5}
            color="white"
          />
        </View>
        <Text
          className="text-white text-center mb-3 text-4xl font-semibold"
        >
          UrbanEase
        </Text>
        <Text
          className="text-white/80 text-center text-base"
        >
          Where Convenience meets Community
        </Text>
      </View>

      <View className="w-full space-y-4">
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className="w-full bg-white py-4 rounded-xl shadow-lg"
          activeOpacity={0.8}
        >
          <Text className="text-[#027A4C] text-center text-lg font-medium">
            Login to Your Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          className="w-full bg-transparent py-4 rounded-xl border-2 border-white/30"
          activeOpacity={0.8}
        >
          <Text className="text-white text-center text-lg font-medium">
            Create New Account
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}