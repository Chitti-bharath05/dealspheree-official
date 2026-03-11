import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import StoreOwnerDashboardScreen from '../screens/StoreOwnerDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileInfoScreen from '../screens/ProfileInfoScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import LegalScreen from '../screens/LegalScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import MapScreen from '../screens/MapScreen';
import OffersScreen from '../screens/OffersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false };

// Customer Home Stack
const CustomerHomeStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
        <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Deals" component={OffersScreen} />
    </Stack.Navigator>
);

// Profile Stack (Unified for all roles)
const ProfileStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ProfileInfo" component={ProfileInfoScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Deals" component={OffersScreen} />
    </Stack.Navigator>
);

// Customer Tabs
const CustomerTabs = () => {
    const { t } = useLanguage();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#FFD700', // Luxury Gold
                tabBarInactiveTintColor: '#8E8E93',
                tabBarLabelStyle: styles.tabLabel,
                tabBarIcon: ({ color, size, focused }) => {
                    const icons = { 
                        Home: focused ? 'home' : 'home-outline', 
                        Deals: focused ? 'pricetag' : 'pricetag-outline', 
                        Map: focused ? 'map' : 'map-outline', 
                        Profile: focused ? 'person' : 'person-outline' 
                    };
                    return <Ionicons name={icons[route.name] || 'home'} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={CustomerHomeStack} options={{ tabBarLabel: t('home') }} />
            <Tab.Screen name="Deals" component={OffersScreen} options={{ tabBarLabel: t('deals') }} />
            <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: t('map') }} />
            <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: t('profile') }} />
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
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#1a150d', // Dark Coffee
        borderTopColor: 'rgba(212, 175, 55, 0.2)', // Subtle Gold border
        borderTopWidth: 1,
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
    },
    tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
    loading: { flex: 1, backgroundColor: '#1a150d', alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: '#D4AF37', fontSize: 16 },
});

export default AppNavigator;
