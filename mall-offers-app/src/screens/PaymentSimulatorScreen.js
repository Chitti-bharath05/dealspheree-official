import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';

const PaymentSimulatorScreen = ({ route, navigation }) => {
    const { orderData } = route.params;
    const { placeOrder } = useData();
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'

    useEffect(() => {
        // Simulate a payment delay
        const timer = setTimeout(() => {
            // 90% success rate simulation
            const isSuccess = Math.random() > 0.1;
            if (isSuccess) {
                handleSuccess();
            } else {
                setStatus('failed');
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleSuccess = async () => {
        try {
            await placeOrder({ ...orderData, status: 'completed' });
            setStatus('success');
        } catch (error) {
            console.error('Order placement after payment failed:', error);
            setStatus('failed');
        }
    };

    const handleFinish = () => {
        if (status === 'success') {
            navigation.navigate('Home');
            Alert.alert('Order Confirmed', 'Your order has been placed successfully! 🎉');
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {status === 'processing' && (
                        <>
                            <ActivityIndicator size="large" color="#FF6B6B" />
                            <Text style={styles.statusTitle}>Processing Payment</Text>
                            <Text style={styles.statusSub}>Securely connecting to the bank...</Text>
                            <View style={styles.amountCard}>
                                <Text style={styles.amountLabel}>Total Amount</Text>
                                <Text style={styles.amountValue}>₹{orderData.totalAmount.toLocaleString()}</Text>
                            </View>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <View style={styles.iconCircleSuccess}>
                                <Ionicons name="checkmark-circle" size={80} color="#4ECDC4" />
                            </View>
                            <Text style={styles.statusTitle}>Payment Successful!</Text>
                            <Text style={styles.statusSub}>Thank you for your purchase.</Text>
                            <TouchableOpacity style={styles.button} onPress={handleFinish}>
                                <LinearGradient
                                    colors={['#4ECDC4', '#44B39D']}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>Continue</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <View style={styles.iconCircleFailed}>
                                <Ionicons name="close-circle" size={80} color="#FF6B6B" />
                            </View>
                            <Text style={styles.statusTitle}>Payment Failed</Text>
                            <Text style={styles.statusSub}>Something went wrong. Please try again.</Text>
                            <TouchableOpacity style={styles.button} onPress={handleFinish}>
                                <LinearGradient
                                    colors={['#FF6B6B', '#FF8E53']}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>Back to Cart</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
        width: '85%',
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        marginTop: 20,
    },
    statusSub: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    amountCard: {
        marginTop: 30,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        alignItems: 'center',
    },
    amountLabel: {
        color: '#A0A0B0',
        fontSize: 12,
        fontWeight: '600',
    },
    amountValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 4,
    },
    iconCircleSuccess: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleFailed: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        marginTop: 30,
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default PaymentSimulatorScreen;
