import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import CartScreen from '../screens/CartScreen';
import StoreOwnerDashboardScreen from '../screens/StoreOwnerDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import PaymentSimulatorScreen from '../screens/PaymentSimulatorScreen';
import { useCart } from '../context/CartContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false };

// Customer Home Stack
const CustomerHomeStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
        <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
    </Stack.Navigator>
);

// Profile Stack (Unified for all roles)
const ProfileStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    </Stack.Navigator>
);

// Customer Tabs
const CustomerTabs = () => {
    const { getItemCount } = useCart();
    const count = getItemCount();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#FF6B6B',
                tabBarInactiveTintColor: '#6E6E7E',
                tabBarLabelStyle: styles.tabLabel,
                tabBarIcon: ({ color, size }) => {
                    const icons = { Home: 'home', Favorites: 'heart', Cart: 'cart', Profile: 'person' };
                    return (
                        <View>
                            <Ionicons name={icons[route.name] || 'home'} size={22} color={color} />
                            {route.name === 'Cart' && count > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>{count}</Text>
                                </View>
                            )}
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen name="Home" component={CustomerHomeStack} />
            <Tab.Screen name="Favorites" component={FavoritesScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

// Store Owner Tabs
const StoreOwnerTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#FF8E53',
            tabBarInactiveTintColor: '#6E6E7E',
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ color }) => {
                const icons = { Dashboard: 'grid', Browse: 'search', Profile: 'person' };
                return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
            },
        })}
    >
        <Tab.Screen name="Dashboard" component={StoreOwnerDashboardScreen} />
        <Tab.Screen name="Browse" component={CustomerHomeStack} />
        <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
);

// Admin Tabs
const AdminTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#A18CD1',
            tabBarInactiveTintColor: '#6E6E7E',
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ color }) => {
                const icons = { Dashboard: 'shield-checkmark', Users: 'people', Profile: 'person' };
                return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
            },
        })}
    >
        <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
        <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
);

// Auth Stack
const AuthStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const getMainScreens = () => {
        if (!user) return <Stack.Screen name="Auth" component={AuthStack} />;
        switch (user.role) {
            case 'store_owner':
                return <Stack.Screen name="StoreOwner" component={StoreOwnerTabs} />;
            case 'admin':
                return <Stack.Screen name="Admin" component={AdminTabs} />;
            default:
                return <Stack.Screen name="Customer" component={CustomerTabs} />;
        }
    };

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions} key={user ? 'app-root' : 'auth-root'}>
                {getMainScreens()}
                <Stack.Screen name="PaymentSimulator" component={PaymentSimulatorScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#0f0c29',
        borderTopColor: 'rgba(255,255,255,0.08)',
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 8,
        paddingTop: 6,
    },
    tabLabel: { fontSize: 11, fontWeight: '600' },
    cartBadge: {
        position: 'absolute', top: -5, right: -10,
        backgroundColor: '#FF6B6B', borderRadius: 9,
        minWidth: 18, height: 18,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    loading: { flex: 1, backgroundColor: '#0f0c29', alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: '#fff', fontSize: 16 },
});

export default AppNavigator;
