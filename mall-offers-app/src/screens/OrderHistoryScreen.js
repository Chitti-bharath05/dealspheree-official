import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const OrderHistoryScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { orders, isLoading } = useData();

    // The DataContext already filters orders by the current user
    const userOrders = orders || [];

    const renderOrderItem = ({ item }) => {
        const date = new Date(item.createdAt || item.date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderDate}>{date}</Text>
                        <Text style={styles.orderId}>ID: {(item._id || item.id).slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
                        <Text style={[styles.statusText, item.status === 'completed' ? styles.statusTextCompleted : styles.statusTextPending]}>
                            {item.status?.toUpperCase() || 'PENDING'}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {item.items?.map((orderItem, index) => (
                    <View key={index} style={styles.itemRow}>
                        <View style={styles.itemIconCircle}>
                            <Ionicons name="pricetag-outline" size={16} color="#FF8E53" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                                {orderItem.title || orderItem.offerId?.title || 'Special Offer'}
                            </Text>
                            <Text style={styles.itemSub}>Qty: {orderItem.quantity || 1} • ₹{(orderItem.price || 0).toLocaleString()}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalPrice}>₹{(item.totalAmount || 0).toLocaleString()}</Text>
                </View>
                
                <TouchableOpacity style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>View Full Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order History</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading ? (
                    <View style={styles.centerContent}>
                        <Text style={styles.infoText}>Loading orders...</Text>
                    </View>
                ) : userOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="receipt-outline" size={60} color="#4A4A5A" />
                        </View>
                        <Text style={styles.emptyText}>No orders yet</Text>
                        <Text style={styles.emptySubtext}>Your purchase history will appear here</Text>
                        <TouchableOpacity
                            style={styles.browseBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <LinearGradient
                                colors={['#FF6B6B', '#FF8E53']}
                                style={styles.browseGradient}
                            >
                                <Text style={styles.browseBtnText}>Start Shopping</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={userOrders}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item._id || item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={Platform.OS !== 'web'}
                    />
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    orderCard: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderDate: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    orderId: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusCompleted: {
        backgroundColor: 'rgba(78, 205, 196, 0.15)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 142, 83, 0.15)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    statusTextCompleted: {
        color: '#4ECDC4',
    },
    statusTextPending: {
        color: '#FF8E53',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 142, 83, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    itemTitle: {
        color: '#E0E0E0',
        fontSize: 14,
        fontWeight: '600',
    },
    itemSub: {
        color: '#8E8E93',
        fontSize: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: '#A0A0B0',
        fontSize: 14,
    },
    totalPrice: {
        color: '#4ECDC4',
        fontSize: 18,
        fontWeight: '800',
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        gap: 4,
    },
    detailsBtnText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        color: '#8E8E93',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    emptySubtext: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    browseBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    browseGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    browseBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default OrderHistoryScreen;
