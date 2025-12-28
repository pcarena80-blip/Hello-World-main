
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Render URL
// Production Render URL
const BASE_URL = 'https://urbanease-backend-suham.onrender.com/api';
// Local Development URL
// const BASE_URL = 'http://192.168.18.131:5000/api';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

// Helper function for better error handling
const handleApiError = (error, endpoint) => {
    console.error(`❌ API Error [${endpoint}]:`, error);

    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
    }

    if (error.message.includes('timeout')) {
        throw new Error('Request timeout. Server is taking too long to respond.');
    }

    throw error;
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
        },
        forgotPassword: async (email) => {
            try {
                const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
                return data;
            } catch (error) {
                throw error;
            }
        },
        resetPassword: async (email, otp, newPassword) => {
            try {
                const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp, newPassword }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to reset password');
                return data;
            } catch (error) {
                throw error;
            }
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
            try {
                console.log('🎫 Fetching complaints from:', `${BASE_URL}/complaints`);
                const response = await fetch(`${BASE_URL}/complaints`, { headers: await getHeaders() });
                const data = await response.json();
                console.log('🎫 Complaints response:', { status: response.status, count: data?.length });
                if (!response.ok) {
                    console.error('❌ Complaints fetch failed:', data);
                    throw new Error(data.message || 'Failed to fetch complaints');
                }
                return data;
            } catch (error) {
                handleApiError(error, 'complaints.getAll');
            }
        },
        create: async (complaintData) => {
            const token = await AsyncStorage.getItem('token');
            const headers = {
                'Authorization': token ? `Bearer ${token}` : '',
            };

            // Remove Content-Type header if sending FormData (let browser/network handle boundary)
            if (!(complaintData instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${BASE_URL}/complaints`, {
                method: 'POST',
                headers: headers,
                body: complaintData instanceof FormData ? complaintData : JSON.stringify(complaintData)
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
        getInbox: async () => {
            const response = await fetch(`${BASE_URL}/chat/inbox`, { headers: await getHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch inbox');
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
        },
        deleteMessage: async (messageId) => {
            try {
                console.log('🗑️ Deleting message:', messageId);
                const response = await fetch(`${BASE_URL}/chat/${messageId}`, {
                    method: 'DELETE',
                    headers: await getHeaders()
                });
                const data = await response.json();
                console.log('🗑️ Delete response:', { status: response.status });
                if (!response.ok) {
                    console.error('❌ Delete failed:', data);
                    throw new Error(data.message || 'Failed to delete message');
                }
                return data;
            } catch (error) {
                handleApiError(error, 'chat.deleteMessage');
            }
        }
    },
    notices: {
        getAll: async () => {
            try {
                console.log('📋 Fetching notices from:', `${BASE_URL}/notices`);
                const response = await fetch(`${BASE_URL}/notices`, { headers: await getHeaders() });
                const data = await response.json();
                console.log('📋 Notices response:', { status: response.status, count: data?.length });
                if (!response.ok) {
                    console.error('❌ Notices fetch failed:', data);
                    throw new Error(data.message || 'Failed to fetch notices');
                }
                return data;
            } catch (error) {
                handleApiError(error, 'notices.getAll');
            }
        }
    },
    profile: {
        get: async () => {
            try {
                console.log('👤 Fetching profile from:', `${BASE_URL}/profile`);
                const token = await AsyncStorage.getItem('token');
                console.log('👤 Token exists:', !!token);
                const response = await fetch(`${BASE_URL}/profile`, { headers: await getHeaders() });
                const data = await response.json();
                console.log('👤 Profile response:', { status: response.status, hasData: !!data });
                if (!response.ok) {
                    console.error('❌ Profile fetch failed:', data);
                    throw new Error(data.message || 'Failed to fetch profile');
                }
                return data;
            } catch (error) {
                handleApiError(error, 'profile.get');
            }
        },
        getById: async (id) => {
            const response = await fetch(`${BASE_URL}/profile/${id}`, { headers: await getHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch user profile');
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
    },
    // Helper for image URLs
    getImageUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Clean path to ensure no double slashes if path starts with /
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        // This base URL should match where your static files are served from
        // For render, it might be the same as BASE_URL's root.
        // If BASE_URL is .../api, we want the root.
        const rootUrl = BASE_URL.replace('/api', '');
        return `${rootUrl}/${cleanPath}`;
    }
};
