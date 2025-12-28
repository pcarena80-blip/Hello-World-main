import api from './api';
import { Alert, Linking } from 'react-native';

/**
 * Initialize payment for a bill
 * @param {string} billId - Bill ID to pay
 * @param {number} amount - Amount to pay in PKR
 * @returns {Promise<Object>} Payment response with orderId and paymentUrl
 */
export const initiatePayment = async (billId: string, amount: number) => {
    try {
        console.log('Initiating payment:', { billId, amount });

        const response = await api.post('/payment/create', {
            billId,
            amount
        });

        const { orderId, paymentUrl } = response.data;

        return { orderId, paymentUrl };
    } catch (error: any) {
        console.error('Payment initiation failed:', error);
        throw new Error(error.response?.data?.message || 'Failed to initiate payment');
    }
};

/**
 * Open payment URL in browser
 * @param {string} paymentUrl - URL to open
 */
export const openPaymentGateway = async (paymentUrl: string) => {
    try {
        const supported = await Linking.canOpenURL(paymentUrl);

        if (supported) {
            await Linking.openURL(paymentUrl);
        } else {
            Alert.alert('Error', 'Cannot open payment gateway');
        }
    } catch (error) {
        console.error('Error opening payment URL:', error);
        Alert.alert('Error', 'Failed to open payment gateway');
    }
};

/**
 * Check payment status
 * @param {string} orderId - Order ID to check
 * @returns {Promise<Object>} Payment status
 */
export const checkPaymentStatus = async (orderId: string) => {
    try {
        const response = await api.get(`/payment/status/${orderId}`);
        return response.data.transaction;
    } catch (error: any) {
        console.error('Status check failed:', error);
        throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
};

/**
 * Get user's payment history
 * @param {string} status - Filter by status (optional)
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} List of transactions
 */
export const getPaymentHistory = async (status?: string, limit: number = 20) => {
    try {
        const params: any = { limit };
        if (status) params.status = status;

        const response = await api.get('/payment/history', { params });
        return response.data.transactions;
    } catch (error: any) {
        console.error('History fetch failed:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
};

/**
 * Start payment flow for a bill
 * This is the main function to call from UI
 * @param {string} billId - Bill ID
 * @param {number} amount - Amount in PKR
 * @param {Function} onSuccess - Callback on successful payment initiation
 * @param {Function} onError - Callback on error
 */
export const startPaymentFlow = async (
    billId: string,
    amount: number,
    onSuccess?: (orderId: string) => void,
    onError?: (error: string) => void
) => {
    try {
        // Step 1: Create payment transaction
        const { orderId, paymentUrl } = await initiatePayment(billId, amount);

        // Step 2: Open payment gateway
        await openPaymentGateway(paymentUrl);

        // Step 3: Call success callback with orderId
        if (onSuccess) {
            onSuccess(orderId);
        }

        return orderId;
    } catch (error: any) {
        const errorMessage = error.message || 'Payment failed';

        if (onError) {
            onError(errorMessage);
        } else {
            Alert.alert('Payment Error', errorMessage);
        }

        throw error;
    }
};

/**
 * Poll for payment status
 * @param {string} orderId - Order ID to check
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} interval - Interval between attempts in ms
 * @returns {Promise<Object>} Final transaction status
 */
export const pollPaymentStatus = async (
    orderId: string,
    maxAttempts: number = 30,
    interval: number = 2000
): Promise<any> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
            attempts++;

            try {
                const transaction = await checkPaymentStatus(orderId);

                // If payment completed (success or failed), stop polling
                if (transaction.status === 'success' || transaction.status === 'failed' || transaction.status === 'cancelled') {
                    clearInterval(poll);
                    resolve(transaction);
                }

                // If max attempts reached, stop polling
                if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    reject(new Error('Payment status check timeout'));
                }
            } catch (error) {
                if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    reject(error);
                }
            }
        }, interval);
    });
};

export default {
    initiatePayment,
    openPaymentGateway,
    checkPaymentStatus,
    getPaymentHistory,
    startPaymentFlow,
    pollPaymentStatus
};
