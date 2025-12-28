import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { ArrowLeft, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

export default function BillsScreen() {
  const navigation = useNavigation<any>();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload bills whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [])
  );

  const loadBills = async () => {
    try {
      const data = await api.bills.getAll();
      setBills(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  // Sort bills: Due > Upcoming > Paid
  const sortedBills = [...bills].sort((a, b) => {
    const statusOrder: { [key: string]: number } = { due: 1, upcoming: 2, paid: 3 };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  const upcomingBills = sortedBills.filter((b: any) => b.status === 'due' || b.status === 'upcoming');
  const billHistory = sortedBills.filter((b: any) => b.status === 'paid');

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-6 rounded-b-[32px]"
      >
        <View className="flex-row items-center gap-4 mb-2">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">
            Bills & Payments
          </Text>
        </View>
        <Text className="text-white/80 ml-10 text-sm">
          Manage your utility payments
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#027A4C" className="mt-10" />
        ) : (
          <>
            {/* Upcoming Bills */}
            {upcomingBills.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-900 mb-3 text-lg font-semibold">
                  Upcoming Bills
                </Text>
                <View className="space-y-3">
                  {upcomingBills.map((bill) => (
                    <View key={bill._id} className="bg-white rounded-2xl p-5 shadow-sm">
                      <View className="flex-row items-start justify-between mb-4">
                        <View>
                          <Text className="text-gray-900 mb-1 text-base font-semibold">
                            {bill.type}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {bill.month}
                          </Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-full ${bill.status === 'due' ? 'bg-[#F44336]' : 'bg-[#FF9800]'}`}
                        >
                          <Text className="text-white text-[11px] font-medium">
                            {bill.status === 'due' ? 'Due' : 'Upcoming'}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <Text className="text-gray-600 text-sm">
                          Amount
                        </Text>
                        <Text className="text-gray-900 text-lg font-semibold">
                          PKR {bill.amount.toLocaleString()}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-gray-600 text-xs">
                          Due Date: {bill.dueDate}
                        </Text>
                      </View>

                      <TouchableOpacity
                        className="w-full py-3 rounded-xl shadow-sm"
                        onPress={() => navigation.navigate('BillDetails', { bill })}
                      >
                        <LinearGradient
                          colors={['#003E2F', '#027A4C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className="w-full py-3 rounded-xl items-center"
                        >
                          <Text className="text-white text-base font-medium">Pay Now</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bills History */}
            <View>
              <Text className="text-gray-900 mb-3 text-lg font-semibold">
                Payment History
              </Text>
              {billHistory.length === 0 ? (
                <Text className="text-gray-500 text-center py-4">No payment history.</Text>
              ) : (
                <View className="space-y-3">
                  {billHistory.map((bill) => (
                    <View key={bill._id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-gray-900 mb-1 text-base font-semibold">
                            {bill.type}
                          </Text>
                          <Text className="text-gray-500 mb-1 text-xs">
                            Ref No: {bill.refNo}
                          </Text>
                          <Text className="text-gray-400 text-[11px]">
                            {bill.method || 'Online'} • {new Date(bill.paidDate || bill.updatedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-gray-900 mb-2 text-base font-semibold">
                            PKR {bill.amount.toLocaleString()}
                          </Text>
                          <TouchableOpacity className="flex-row items-center gap-1">
                            <Download size={14} color="#027A4C" strokeWidth={2} />
                            <Text className="text-[#027A4C] text-xs font-medium">
                              Receipt
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
