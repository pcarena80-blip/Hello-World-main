import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { ArrowLeft, CheckCircle, Clock, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { api } from '../services/api';

export default function ComplaintDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { complaint } = route.params || {};
  if (!complaint) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FF9800', label: 'Open' };
      case 'in-progress':
        return { bg: '#2196F3', label: 'In Progress' };
      case 'resolved':
        return { bg: '#4CAF50', label: 'Resolved' };
      case 'rejected':
        return { bg: '#9E9E9E', label: 'Cancelled' };
      default:
        return { bg: '#9E9E9E', label: status };
    }
  };

  const statusConfig = getStatusConfig(complaint.status);

  // Helper to determine active state in timeline
  const isAfter = (currentStatus: string, stepStatus: string) => {
    const order = ['pending', 'in-progress', 'resolved', 'rejected'];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepStatus);
    return currentIdx >= stepIdx;
  };

  const timeline = [
    {
      status: 'Submitted',
      date: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '',
      active: true
    },
    {
      status: 'In Progress',
      date: isAfter(complaint.status, 'in-progress') && complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : null,
      active: isAfter(complaint.status, 'in-progress')
    },
    {
      status: 'Resolved',
      date: complaint.status === 'resolved' && complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : null,
      active: complaint.status === 'resolved'
    },
  ];

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
        <Text className="text-white text-2xl font-semibold">
          Complaint Details
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: statusConfig.bg }}
            >
              <Text className="text-white text-xs font-medium">
                {statusConfig.label}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs">
              Ticket {complaint.id}
            </Text>
          </View>

          <Text className="text-gray-900 mb-2 text-lg font-semibold">
            {complaint.title || complaint.subject}
          </Text>
          <Text className="text-gray-500 mb-4 text-xs">
            {complaint.category} • Submitted {complaint.date}
          </Text>

          <View className="p-3 rounded-lg bg-gray-50 mb-4">
            <Text className="text-gray-700 text-sm">
              {complaint.description}
            </Text>
          </View>

          {complaint.image && (
            <View className="rounded-xl overflow-hidden mb-4 border border-gray-100">
              <Image
                source={{ uri: api.getImageUrl(complaint.image) }}
                style={{ width: '100%', height: 200 }}
                resizeMode="cover"
              />
            </View>
          )}

        </View>

        {/* Status Timeline */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-gray-900 mb-4 text-base font-semibold">
            Status Timeline
          </Text>
          <View className="space-y-4">
            {timeline.map((item, index) => (
              <View key={index} className="flex-row items-start gap-4">
                <View className="items-center">
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${item.active ? 'bg-[#027A4C]' : 'bg-gray-200'
                      }`}
                  >
                    {item.active ? (
                      <CheckCircle size={20} color="white" strokeWidth={2} />
                    ) : (
                      <Clock size={20} color="#9CA3AF" strokeWidth={1.5} />
                    )}
                  </View>
                  {index < timeline.length - 1 && (
                    <View className={`w-0.5 h-10 ${item.active ? 'bg-[#027A4C]' : 'bg-gray-200'}`} />
                  )}
                </View>
                <View className="flex-1 pt-1">
                  <Text className={`${item.active ? 'text-gray-900' : 'text-gray-400'} text-sm font-medium`}>
                    {item.status}
                  </Text>
                  {item.date && (
                    <Text className="text-gray-400 text-xs">
                      {item.date}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
