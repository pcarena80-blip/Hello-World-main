import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function ComplaintsScreen() {
  const navigation = useNavigation<any>();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useFocusEffect(
    useCallback(() => {
      loadComplaints();
    }, [])
  );

  const loadComplaints = async () => {
    try {
      console.log('🎫 ComplaintsScreen: Loading complaints...');
      setLoading(true);
      const data = await api.complaints.getAll();
      console.log('🎫 ComplaintsScreen: Received', data?.length, 'complaints');
      setComplaints(data || []);
    } catch (error: any) {
      console.error('🎫 ComplaintsScreen: Error loading complaints:', error);
      Alert.alert(
        'Cannot Load Complaints',
        error.message || 'Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => loadComplaints() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      setComplaints([]); // Show empty state
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    open: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    cancelled: complaints.filter(c => c.status === 'rejected').length
  };

  const filteredComplaints = complaints.filter(c => c.status === activeFilter);

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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#F44336', label: 'High' };
      case 'medium':
        return { bg: '#FF9800', label: 'Medium' };
      default:
        return { bg: '#9E9E9E', label: 'Low' };
    }
  };

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-8 rounded-b-[32px]"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="white" strokeWidth={1.5} />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-semibold">
              Complaints
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        {/* Stats Grid */}
        <View className="flex-row justify-between gap-2">
          <TouchableOpacity
            onPress={() => setActiveFilter('pending')}
            className={`flex-1 rounded-xl p-3 items-center ${activeFilter === 'pending' ? 'bg-white/20 border border-white/50' : 'bg-white/10'
              }`}
          >
            <Text className="text-white mb-1 text-xl font-semibold">
              {stats.open}
            </Text>
            <Text className="text-white/80 text-[11px]">
              Open
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveFilter('in-progress')}
            className={`flex-1 rounded-xl p-3 items-center ${activeFilter === 'in-progress' ? 'bg-white/20 border border-white/50' : 'bg-white/10'
              }`}
          >
            <Text className="text-white mb-1 text-xl font-semibold">
              {stats.inProgress}
            </Text>
            <Text className="text-white/80 text-[11px]">
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveFilter('resolved')}
            className={`flex-1 rounded-xl p-3 items-center ${activeFilter === 'resolved' ? 'bg-white/20 border border-white/50' : 'bg-white/10'
              }`}
          >
            <Text className="text-white mb-1 text-xl font-semibold">
              {stats.resolved}
            </Text>
            <Text className="text-white/80 text-[11px]">
              Resolved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveFilter('rejected')}
            className={`flex-1 rounded-xl p-3 items-center ${activeFilter === 'rejected' ? 'bg-white/20 border border-white/50' : 'bg-white/10'
              }`}
          >
            <Text className="text-white mb-1 text-xl font-semibold">
              {stats.cancelled}
            </Text>
            <Text className="text-white/80 text-[11px]">
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* New Complaint Button */}
      <View className="px-6 -mt-6 mb-4 z-10">
        <TouchableOpacity
          onPress={() => navigation.navigate('NewComplaint')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#003E2F', '#027A4C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full py-3.5 rounded-xl shadow-md flex-row items-center justify-center gap-2"
          >
            <Plus size={20} color="white" strokeWidth={2} />
            <Text className="text-white text-base font-medium">New Complaint</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pb-24 space-y-3" contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredComplaints.length === 0 ? (
          <Text className="text-center py-10 text-gray-500">
            No complaints found in this category.
          </Text>
        ) : (
          filteredComplaints.map((complaint) => {
            const priorityConfig = getPriorityConfig(complaint.priority);

            return (
              <TouchableOpacity
                key={complaint.id}
                onPress={() => navigation.navigate('ComplaintDetails', { complaint })}
                className="bg-white rounded-2xl p-4 shadow-sm mb-3"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: priorityConfig.bg }}
                    >
                      <Text className="text-white text-[10px] font-medium">{priorityConfig.label}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-[11px]">
                    {complaint.date}
                  </Text>
                </View>

                <Text className="text-gray-900 mb-1 text-base font-semibold">
                  {complaint.title || complaint.subject}
                </Text>
                <Text className="text-gray-500 mb-2 text-xs">
                  {complaint.category} • Ticket {complaint._id.slice(-6).toUpperCase()}
                </Text>

                {complaint.description && (
                  <Text className="text-gray-600 mb-2 text-sm" numberOfLines={2}>
                    {complaint.description}
                  </Text>
                )}

                {complaint.image && (
                  <View className="mt-2 mb-2 rounded-lg overflow-hidden h-40 bg-gray-100">
                    <Image
                      source={{ uri: api.getImageUrl(complaint.image) }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {complaint.response && (
                  <View className="mt-3 p-2.5 rounded-lg bg-[#E3F2FD]">
                    <Text className="text-[#2196F3] text-xs">
                      {complaint.response}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
