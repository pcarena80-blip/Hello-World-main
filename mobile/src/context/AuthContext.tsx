import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { api } from '../services/api';

interface AuthContextType {
    user: any;
    loading: boolean;
    prefetching: boolean;
    login: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: any) => Promise<void>;
    isAuthenticated: boolean;
    refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [prefetching, setPrefetching] = useState(false);

    useEffect(() => {
        loadStorageData();

        // Listen for app state changes to refresh data when app comes to foreground
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && user) {
                // App became active, refresh data in background
                prefetchAppData();
            }
        });

        return () => {
            subscription?.remove();
        };
    }, [user]);

    const loadStorageData = async () => {
        try {
            const authDataSerialized = await AsyncStorage.getItem('user');
            if (authDataSerialized) {
                const _authData = JSON.parse(authDataSerialized);
                setUser(_authData);
                // Prefetch data in background after loading user
                prefetchAppData();
            }
        } catch (error) {
            console.error('Auth loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const prefetchAppData = async () => {
        setPrefetching(true);
        try {
            console.log('Prefetching app data...');
            // Fetch all critical data in parallel
            const promises = [
                api.notices.getAll().catch(err => { console.log('Notices fetch failed:', err); return []; }),
                api.bills.getAll().catch(err => { console.log('Bills fetch failed:', err); return []; }),
                api.complaints.getAll().catch(err => { console.log('Complaints fetch failed:', err); return []; }),
                api.chat.getMessages('community').catch(err => { console.log('Community chat fetch failed:', err); return []; }),
                api.chat.getInbox().catch(err => { console.log('Inbox fetch failed:', err); return []; }),
            ];

            const [notices, bills, complaints, communityMessages, inbox] = await Promise.all(promises);

            // Cache data in AsyncStorage for instant load next time
            await AsyncStorage.setItem('cachedNotices', JSON.stringify(notices));
            await AsyncStorage.setItem('cachedBills', JSON.stringify(bills));
            await AsyncStorage.setItem('cachedComplaints', JSON.stringify(complaints));
            await AsyncStorage.setItem('cachedCommunityMessages', JSON.stringify(communityMessages));
            await AsyncStorage.setItem('cachedInbox', JSON.stringify(inbox));

            console.log('Data prefetch complete!');
        } catch (error) {
            console.error('Prefetch error:', error);
        } finally {
            setPrefetching(false);
        }
    };

    const login = async (data: any) => {
        setUser(data);
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data));

        // Prefetch data immediately after login
        await prefetchAppData();
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // Clear cached data
        await AsyncStorage.removeItem('cachedNotices');
        await AsyncStorage.removeItem('cachedBills');
        await AsyncStorage.removeItem('cachedComplaints');
        await AsyncStorage.removeItem('cachedCommunityMessages');
        await AsyncStorage.removeItem('cachedInbox');
    };

    const updateUser = async (data: any) => {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const refreshData = async () => {
        await prefetchAppData();
    };

    return (
        <AuthContext.Provider value={{ user, loading, prefetching, login, logout, updateUser, isAuthenticated: !!user, refreshData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
