import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const CartScreen = ({ navigation }) => {
    const { cartItems, updateQuantity, removeFromCart, getTotalAmount, clearCart } = useCart();
    const { placeOrder } = useData();
    const { user } = useAuth();

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add some items to your cart');
            return;
        }

        const orderData = {
            userId: user.id || user._id,
            items: cartItems.map(item => ({
                offerId: item.offerId,
                title: item.title,
                price: item.price,
                quantity: item.quantity
            })),
            totalAmount: getTotalAmount(),
            date: new Date().toISOString(),
        };

        const proceed = () => {
            clearCart();
            navigation.navigate('PaymentSimulator', { orderData });
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Confirm Order: Total ₹${getTotalAmount().toLocaleString()}?`)) {
                proceed();
            }
        } else {
            Alert.alert(
                'Confirm Order',
                `Total Amount: ₹${getTotalAmount().toLocaleString()}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Place Order', onPress: proceed },
                ]
            );
        }
    };

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItem}>
            <View style={styles.cartItemLeft}>
                <View style={styles.itemIconContainer}>
                    <Ionicons name="pricetag" size={20} color="#FF8E53" />
                </View>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>₹{(item.price || 0).toLocaleString()}</Text>
                        <Text style={styles.itemOriginalPrice}>
                            ₹{(item.originalPrice || 0).toLocaleString()}
                        </Text>
                        <View style={styles.itemDiscountBadge}>
                            <Text style={styles.itemDiscountText}>{item.discount || 0}% off</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.cartItemRight}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => updateQuantity(item.offerId, item.quantity - 1)}
                    >
                        <Ionicons name="remove" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                    <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => updateQuantity(item.offerId, item.quantity + 1)}
                    >
                        <Ionicons name="add" size={16} color="#4ECDC4" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.itemSubtotal}>
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </Text>
                <TouchableOpacity
                    onPress={() => removeFromCart(item.offerId)}
                    style={styles.removeBtn}
                >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Cart</Text>
                    {cartItems.length > 0 && (
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>{cartItems.length} items</Text>
                        </View>
                    )}
                </View>

                {cartItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="cart-outline" size={60} color="#4A4A5A" />
                        </View>
                        <Text style={styles.emptyText}>Your cart is empty</Text>
                        <Text style={styles.emptySubtext}>
                            Browse offers and add items to get started
                        </Text>
                        <TouchableOpacity
                            style={styles.browseBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <LinearGradient
                                colors={['#FF6B6B', '#FF8E53']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.browseGradient}
                            >
                                <Text style={styles.browseBtnText}>Browse Offers</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={cartItems}
                            renderItem={renderCartItem}
                            keyExtractor={(item) => item.offerId}
                            contentContainerStyle={styles.cartList}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* Order Summary */}
                        <View style={styles.orderSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>
                                    ₹{getTotalAmount().toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Delivery</Text>
                                <Text style={[styles.summaryValue, { color: '#4ECDC4' }]}>FREE</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>
                                    ₹{getTotalAmount().toLocaleString()}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.checkoutBtn}
                                onPress={handlePlaceOrder}
                            >
                                <LinearGradient
                                    colors={['#FF6B6B', '#FF8E53']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.checkoutGradient}
                                >
                                    <Ionicons name="bag-check-outline" size={20} color="#fff" />
                                    <Text style={styles.checkoutText}>Place Order</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
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
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
    },
    itemCountBadge: {
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    itemCountText: {
        color: '#FF6B6B',
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
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
        marginTop: 8,
        marginBottom: 28,
    },
    browseBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    browseGradient: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    browseBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    cartList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cartItemLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: 12,
    },
    itemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,142,83,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    itemPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemPrice: {
        color: '#4ECDC4',
        fontSize: 14,
        fontWeight: '700',
    },
    itemOriginalPrice: {
        color: '#6E6E7E',
        fontSize: 11,
        textDecorationLine: 'line-through',
    },
    itemDiscountBadge: {
        backgroundColor: 'rgba(255,107,107,0.15)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    itemDiscountText: {
        color: '#FF6B6B',
        fontSize: 10,
        fontWeight: '700',
    },
    cartItemRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    quantityBtn: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        minWidth: 16,
        textAlign: 'center',
    },
    itemSubtotal: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    removeBtn: {
        padding: 4,
    },
    orderSummary: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        color: '#A0A0B0',
        fontSize: 14,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    totalLabel: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    totalValue: {
        color: '#4ECDC4',
        fontSize: 22,
        fontWeight: '900',
    },
    checkoutBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 16,
    },
    checkoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
    },
    checkoutText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default CartScreen;
