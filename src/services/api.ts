
const BASE_URL = '/api';

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            // Throwing error to stop execution, though page will reload
            throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'API Error');
    }
    return data;
};

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const api = {
    auth: {
        login: async (email: any, password: any) => {
            try {
                const response = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/'; // Redirect to welcome/login
                        return;
                    }
                    throw new Error(data.message || 'Login failed');
                }
                return data;
            } catch (error) {
                throw error;
            }
        },
        signup: async (userData: any) => {
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
        logout: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        updateProfile: async (profileData: any) => {
            const response = await fetch(`${BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(profileData)
            });
            return handleResponse(response);
        },
        getProfile: async () => {
            const response = await fetch(`${BASE_URL}/auth/profile`, {
                method: 'GET',
                headers: getHeaders()
            });
            return handleResponse(response);
        },
        updateCommunityRead: async () => {
            const response = await fetch(`${BASE_URL}/auth/read-community`, {
                method: 'PUT',
                headers: getHeaders()
            });
            return handleResponse(response);
        }
    },
    bills: {
        getAll: async () => {
            const response = await fetch(`${BASE_URL}/bills`, { headers: getHeaders() });
            return handleResponse(response);
        },
        pay: async (id: any, paymentDetails: any) => {
            const response = await fetch(`${BASE_URL}/bills/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(paymentDetails)
            });
            return handleResponse(response);
        }
    },
    complaints: {
        getAll: async () => {
            const response = await fetch(`${BASE_URL}/complaints`, { headers: getHeaders() });
            return handleResponse(response);
        },
        create: async (complaintData: any) => {
            const isFormData = complaintData instanceof FormData;
            const headers: any = getHeaders();

            if (isFormData) {
                delete headers['Content-Type'];
            }

            const response = await fetch(`${BASE_URL}/complaints`, {
                method: 'POST',
                headers: headers,
                body: isFormData ? complaintData : JSON.stringify(complaintData)
            });
            return handleResponse(response);
        }
    },
    chat: {
        getMessages: async (userId: string) => {
            const response = await fetch(`${BASE_URL}/chat/${userId}`, { headers: getHeaders() });
            return handleResponse(response);
        },
        sendMessage: async (messageData: any) => {
            const token = localStorage.getItem('token');
            const headers: any = {
                'Authorization': token ? `Bearer ${token}` : '',
            };

            let body = messageData;
            if (!(messageData instanceof FormData)) {
                const formData = new FormData();
                if (messageData && typeof messageData === 'object') {
                    Object.keys(messageData).forEach(key => {
                        formData.append(key, messageData[key]);
                    });
                }
                body = formData;
            }

            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (!response.ok) {
                const text = await response.text();
                // Check for 401
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                    return;
                }

                console.error('Send Message Error:', response.status, text);
                try {
                    const data = JSON.parse(text);
                    throw new Error(data.message || `Error ${response.status}: ${text}`);
                } catch (e: any) {
                    throw new Error(`Error ${response.status}: ${text}`);
                }
            }

            const data = await response.json();
            return data;
        },
        getInbox: async () => {
            const response = await fetch(`${BASE_URL}/chat/inbox`, { headers: getHeaders() });
            return handleResponse(response);
        }
    },
    payment: {
        initiate: async (paymentData: any) => {
            const response = await fetch(`${BASE_URL}/payment/initiate`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return handleResponse(response);
        }
    },
    profile: {
        get: async () => {
            const response = await fetch(`${BASE_URL}/profile`, { headers: getHeaders() });
            return handleResponse(response);
        },
        update: async (profileData: any) => {
            const response = await fetch(`${BASE_URL}/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update profile');
            return data;
        }
    }
};
