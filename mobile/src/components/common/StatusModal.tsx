import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StatusModalProps {
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
}

export default function StatusModal({ visible, type, title, message, onClose }: StatusModalProps) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 bg-black/50 justify-center items-center p-6">
                    <TouchableWithoutFeedback>
                        <View className="bg-white w-full max-w-[300px] rounded-3xl p-6 items-center shadow-xl">
                            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {type === 'success' ? (
                                    <CheckCircle size={32} color="#027A4C" strokeWidth={2} />
                                ) : (
                                    <XCircle size={32} color="#EF4444" strokeWidth={2} />
                                )}
                            </View>

                            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                                {title}
                            </Text>

                            <Text className="text-gray-500 text-center mb-6 leading-5">
                                {message}
                            </Text>

                            <TouchableOpacity onPress={onClose} className="w-full">
                                <LinearGradient
                                    colors={type === 'success' ? ['#003E2F', '#027A4C'] : ['#EF4444', '#DC2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-3.5 rounded-xl items-center justify-center shadow-md bg-[#027A4C]"
                                >
                                    <Text className="text-white font-semibold text-base">
                                        {type === 'success' ? 'Continue' : 'Try Again'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
