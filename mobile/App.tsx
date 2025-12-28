import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';

// import './global.css'; // Removed for NativeWind v2

import WelcomeScreen from './src/components/WelcomeScreen';
import LoginScreen from './src/components/LoginScreen';
import SignupScreen from './src/components/SignupScreen';
import BottomNav from './src/components/BottomNav';
import BillsScreen from './src/components/BillsScreen';
import BillDetails from './src/components/BillDetails';
import NewComplaint from './src/components/NewComplaint';
import EditProfileScreen from './src/components/EditProfileScreen';
import CommunityChat from './src/components/CommunityChat';
import ComplaintDetails from './src/components/ComplaintDetails';
import NoticeDetails from './src/components/NoticeDetails';
import PrivateChatDetail from './src/components/PrivateChatDetail';
import NotificationsScreen from './src/components/NotificationsScreen';
import ForgotPasswordScreen from './src/components/ForgotPasswordScreen';
import ChangePasswordScreen from './src/components/ChangePasswordScreen';
import UserProfileScreen from './src/components/UserProfileScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, loading } = useAuth();

    // Only show loading during initial auth check
    // Prefetching happens in background without blocking UI
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#027A4C" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    {/* Main App Flow wrapped in Bottom Nav */}
                    <Stack.Screen name="Home" component={BottomNav} />

                    {/* Screens not in Bottom Nav but accessible from Home */}
                    <Stack.Screen name="Bills" component={BillsScreen} />
                    <Stack.Screen name="BillDetails" component={BillDetails} />
                    <Stack.Screen name="NewComplaint" component={NewComplaint} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="CommunityChatDetail" component={CommunityChat} />
                    <Stack.Screen name="ComplaintDetails" component={ComplaintDetails} />
                    <Stack.Screen name="NoticeDetails" component={NoticeDetails} />
                    <Stack.Screen name="PrivateChatDetail" component={PrivateChatDetail} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
