
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local IP for physical device testing
const BASE_URL = 'http://192.168.18.131:5000/api';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const api = {
    auth: {
        login: async (email, password) => {
            try {
                const response = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Login failed');
                return data;
            } catch (error) {
                throw error;
            }
        },
        signup: async (userData) => {
            try {
                const response = await fetch(`${BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Signup failed');
                return data;
            } catch (error) {
                throw error;
            }
        },
        logout: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }
    },
    bills: {
        getAll: async () => {
            const response = await fetch(`${BASE_URL}/bills`, { headers: await getHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch bills');
            return data;
        },
        pay: async (id, paymentDetails) => {
            // This would likely update the bill status
            const response = await fetch(`${BASE_URL}/bills/${id}`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(paymentDetails) // Assuming backend supports updates
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to pay bill');
            return data;
        }
    },
    complaints: {
        getAll: async () => {
            const response = await fetch(`${BASE_URL}/complaints`, { headers: await getHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch complaints');
            return data;
        },
        create: async (complaintData) => {
            const response = await fetch(`${BASE_URL}/complaints`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(complaintData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create complaint');
            return data;
        }
    },
    chat: {
        // Assuming community chat doesn't need a specific userId or it's a specific route
        // The backend route was /:userId for GET. If it's community, maybe it's a fixed ID or different route?
        // For now assuming a general fetch
        getMessages: async (userId) => {
            const response = await fetch(`${BASE_URL}/chat/${userId}`, { headers: await getHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch messages');
            return data;
        },
        sendMessage: async (messageData) => {
            const token = await AsyncStorage.getItem('token');
            const headers = {
                'Authorization': token ? `Bearer ${token}` : '',
            };

            let body = messageData;
            if (!(messageData instanceof FormData)) {
                const formData = new FormData();
                Object.keys(messageData).forEach(key => {
                    formData.append(key, messageData[key]);
                });
                body = formData;
            }

            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: headers,
                body: body
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send message');
            return data;
        }
    },
    profile: {
        get: async () => {
            const response = await fetch(`${BASE_URL}/profile`, { headers: await getHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
            return data;
        },
        update: async (profileData) => {
            const response = await fetch(`${BASE_URL}/profile`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update profile');
            return data;
        }
    }
};
