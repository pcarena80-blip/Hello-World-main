import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { api } from '../services/api';

// Fallback images
const easypaisaLogo = 'https://upload.wikimedia.org/wikipedia/commons/archive/f/f3/20160126040854%21Easypaisa_Logo.png';
const jazzcashLogo = 'https://upload.wikimedia.org/wikipedia/commons/5/58/JazzCash_logo.png';

export default function BillDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bill } = route.params || {};
  const [processing, setProcessing] = useState(false);

  if (!bill) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500">No bill details available.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-[#027A4C] font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handlePayment = async () => {
    if (bill.status === 'paid') {
      Alert.alert('Info', 'This bill is already paid.');
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing delay
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // Call API to update bill status
      await api.bills.pay(bill._id, {
        status: 'paid',
        paidDate: new Date(),
        method: 'Online Payment'
      });

      Alert.alert('Success', 'Bill paid successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
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
          Bill Details
        </Text>
        <Text className="text-white/80 text-sm">
          {bill.type} - {bill.month}
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-6 pb-32 space-y-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Amount Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm items-center mb-4">
          <Text className="text-gray-500 mb-2 text-sm">
            Total Amount
          </Text>
          <Text className="text-gray-900 mb-4 text-3xl font-semibold">
            PKR {bill.amount.toLocaleString()}
          </Text>
          <View
            className={`px-4 py-2 rounded-lg ${bill.status === 'due' ? 'bg-[#FFEBEE]' : 'bg-[#FFF4E6]'}`}
          >
            <Text
              className="text-[13px] font-medium"
              style={{ color: bill.status === 'due' ? '#F44336' : bill.status === 'paid' ? '#4CAF50' : '#FF9800' }}
            >
              {bill.status === 'paid' ? 'Paid' : `Due: ${bill.dueDate}`}
            </Text>
          </View>
        </View>

        {/* Breakdown - Simplified dynamically */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-gray-900 mb-4 text-base font-semibold">
            Bill Summary
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-600 text-sm">{bill.type} Bill</Text>
              <Text className="text-gray-900 text-sm font-medium">PKR {bill.amount.toLocaleString()}</Text>
            </View>
            <View className="border-t border-gray-200 pt-3 mt-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 text-[15px] font-semibold">
                  Total Payable
                </Text>
                <Text className="text-gray-900 text-[15px] font-semibold">
                  PKR {bill.amount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Methods - Only show if not paid */}
        {bill.status !== 'paid' && (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <Text className="text-gray-900 mb-4 text-base font-semibold">
              Payment Methods
            </Text>
            <View className="space-y-3">
              <TouchableOpacity className="w-full p-4 border border-gray-200 rounded-xl flex-row items-center gap-4">
                <View className="w-11 h-11 rounded-xl items-center justify-center overflow-hidden p-2 bg-[#E8F5E9]">
                  <Image
                    source={{ uri: easypaisaLogo }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-sm font-medium">Easypaisa</Text>
                  <Text className="text-gray-500 text-xs">Mobile wallet</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="w-full p-4 border border-gray-200 rounded-xl flex-row items-center gap-4">
                <View className="w-11 h-11 rounded-xl items-center justify-center overflow-hidden p-2 bg-[#FFEBEE]">
                  <Image
                    source={{ uri: jazzcashLogo }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-sm font-medium">JazzCash</Text>
                  <Text className="text-gray-500 text-xs">Mobile wallet</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`w-full mt-5 rounded-xl shadow-md ${processing ? 'opacity-70' : ''}`}
              activeOpacity={0.8}
              onPress={handlePayment}
              disabled={processing}
            >
              <LinearGradient
                colors={['#003E2F', '#027A4C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3.5 rounded-xl items-center"
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-base font-medium">Proceed to Payment</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}