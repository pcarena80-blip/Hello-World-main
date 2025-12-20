import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function NoticeDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { notice } = route.params || {};

  if (!notice) return null;

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

  const config = getPriorityConfig(notice.priority);

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
          Notice Details
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View
            className="self-start px-4 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: config.bg }}
          >
            <Text className="text-white text-xs font-medium">
              {config.label}
            </Text>
          </View>

          <Text className="text-gray-900 mb-4 text-xl font-semibold">
            {notice.title}
          </Text>

          <View className="flex-row items-center gap-2 mb-6 pb-6 border-b border-gray-100">
            <Calendar size={16} color="#6B7280" strokeWidth={1.5} />
            <Text className="text-gray-500 text-[13px]">
              Posted {notice.date}
            </Text>
          </View>

          <View>
            <Text className="text-gray-700 text-[15px] leading-relaxed mb-4">
              {notice.description}
            </Text>

            {notice.title === 'Urgent: Water Supply Maintenance' && (
              <Text className="text-gray-700 text-[15px] leading-relaxed">
                We apologize for any inconvenience this may cause. Please make necessary arrangements to store water in advance. Emergency water tankers will be available on standby if needed.
                {'\n\n'}
                For any queries, please contact the maintenance office.
                {'\n\n'}
                Thank you for your cooperation.
                {'\n'}
                - Management Team
              </Text>
            )}

            {notice.title === 'Community Meeting This Friday' && (
              <Text className="text-gray-700 text-[15px] leading-relaxed">
                The meeting will be held at 6:00 PM at the main clubhouse. Topics include upcoming maintenance projects, security updates, and community event planning.
                {'\n\n'}
                Your presence and participation are highly valued.
                {'\n\n'}
                - Community Committee
              </Text>
            )}

            {!notice.title.includes('Water Supply') && !notice.title.includes('Community Meeting') && (
              <Text className="text-gray-700 text-[15px] leading-relaxed">
                Additional details about this notice will be shared soon. Please stay tuned for further updates.
                {'\n\n'}
                For more information, please contact the administration office during working hours.
                {'\n\n'}
                - Administration
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
