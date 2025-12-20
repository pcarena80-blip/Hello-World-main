import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const notices = [
  {
    id: 1,
    priority: 'high',
    title: 'Urgent: Water Supply Maintenance',
    description: 'Water supply will be temporarily suspended tomorrow from 9 AM to 2 PM for essential pipeline maintenance.',
    date: '2 hours ago'
  },
  {
    id: 2,
    priority: 'medium',
    title: 'Community Meeting This Friday',
    description: 'All residents are invited to attend the monthly community meeting at the clubhouse.',
    date: '1 day ago'
  },
  {
    id: 3,
    priority: 'low',
    title: 'Monthly Maintenance Fee Update',
    description: 'Please note the updated maintenance fee structure effective from next month.',
    date: '3 days ago'
  },
  {
    id: 4,
    priority: 'high',
    title: 'Security Alert: Gate Timings',
    description: 'Main gate timings have been updated. New closing time is 11 PM for security purposes.',
    date: '5 days ago'
  },
  {
    id: 5,
    priority: 'medium',
    title: 'Parking Policy Reminder',
    description: 'Residents are reminded to park only in designated areas to avoid inconvenience.',
    date: '1 week ago'
  },
];

export default function NoticesScreen() {
  const navigation = useNavigation<any>();

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#F44336', label: 'High Priority' };
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
        className="px-6 pt-12 pb-6 rounded-b-[32px]"
      >
        <View className="flex-row items-center gap-4 mb-2">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">
            Notice Board
          </Text>
        </View>
        <Text className="text-white/80 ml-10 text-sm">
          Stay updated with society announcements
        </Text>
      </LinearGradient>

      {/* Notices List */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {notices.map((notice) => {
          const config = getPriorityConfig(notice.priority);

          return (
            <TouchableOpacity
              key={notice.id}
              onPress={() => navigation.navigate('NoticeDetails', { notice })}
              className="bg-white rounded-2xl p-5 shadow-sm mb-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: config.bg }}
                >
                  <Text className="text-white text-[11px] font-medium">{config.label}</Text>
                </View>
                <Text className="text-gray-400 text-xs">
                  {notice.date}
                </Text>
              </View>

              <Text className="text-gray-900 mb-2 text-base font-semibold">
                {notice.title}
              </Text>
              <Text className="text-gray-600 text-sm" numberOfLines={2}>
                {notice.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
