import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import TopHeader from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

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
import StoreOffersScreen from '../screens/StoreOffersScreen';

const Stack = createNativeStackNavigator();

const screenOptions = { 
    headerShown: true,
    header: () => <TopHeader />
};

const authScreenOptions = { 
    headerShown: false 
};

// Customer Home Stack
const CustomerStack = () => (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Profile">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Profile" component={ProfileStack} />
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
        <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
);

// Removing CustomerTabs and replacing with Stack in main navigator below.

// Store Owner Stack
const StoreOwnerStack = () => (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Profile">
        <Stack.Screen name="Dashboard" component={StoreOwnerDashboardScreen} />
        <Stack.Screen name="StoreOffers" component={StoreOffersScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Profile" component={ProfileStack} />
        <Stack.Screen name="Home" component={CustomerStack} />
    </Stack.Navigator>
);

// Admin Stack
const AdminStack = () => (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Profile">
        <Stack.Screen name="Dashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Profile" component={ProfileStack} />
        <Stack.Screen name="Home" component={CustomerStack} />
    </Stack.Navigator>
);


// Auth Stack
const AuthStack = () => (
    <Stack.Navigator screenOptions={authScreenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { user, isLoading, setPendingDeepLink } = useAuth();

    useEffect(() => {
        const handleDeepLink = (event) => {
            const data = Linking.parse(event.url);
            if (data.path && data.path.includes('offer/') && !user) {
                const offerId = data.path.split('offer/')[1]?.split('?')[0];
                if (offerId) {
                    console.log('Deep link detected while logged out. Saving offerId:', offerId);
                    setPendingDeepLink(offerId);
                }
            }
        };

        const checkInitialUrl = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl && !user) {
                handleDeepLink({ url: initialUrl });
            }
        };

        checkInitialUrl();
        const subscription = Linking.addEventListener('url', handleDeepLink);
        
        return () => {
            if (subscription) subscription.remove();
        };
    }, [user, setPendingDeepLink]);


    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color="#F5C518" size="large" />
            </View>
        );
    }

    const getMainScreens = () => {
        if (!user) return <Stack.Screen name="Auth" component={AuthStack} />;
        switch (user.role) {
            case 'store_owner':
                return <Stack.Screen name="StoreOwnerStack" component={StoreOwnerStack} />;
            case 'admin':
                return <Stack.Screen name="AdminStack" component={AdminStack} />;
            default:
                return <Stack.Screen name="CustomerStack" component={CustomerStack} />;
        }
    };

    const linking = {
        prefixes: ['https://dealspheree.in', 'dealspheree://'],
        config: {
            screens: {
                Auth: {
                    screens: {
                        Login: 'login',
                        Register: 'register',
                        ForgotPassword: 'forgot-password',
                        ResetPassword: 'reset-password',
                    },
                },
                CustomerStack: {
                    path: '',
                    screens: {
                        Home: '',
                        Map: 'map',
                        OfferDetails: 'offer/:offerId',
                        Favorites: 'favorites',
                        Deals: 'deals',
                        Profile: {
                            path: 'profile',
                            screens: {
                                ProfileMain: '',
                                Settings: 'settings',
                                ProfileInfo: 'info',
                                ChangePassword: 'change-password',
                                Legal: 'legal',
                                HelpSupport: 'support',
                            }
                        }
                    },
                },
                StoreOwnerStack: {
                    path: 'store',
                    screens: {
                        Dashboard: '',
                        StoreOffers: ':storeId/offers',
                        Map: 'map',
                        Profile: {
                            path: 'profile',
                            screens: {
                                ProfileMain: '',
                                Settings: 'settings',
                                ProfileInfo: 'info',
                                ChangePassword: 'change-password',
                                Legal: 'legal',
                                HelpSupport: 'support',
                            }
                        }
                    },
                },
                AdminStack: {
                    path: 'admin',
                    screens: {
                        Dashboard: '',
                        Map: 'map',
                        Profile: {
                            path: 'profile',
                            screens: {
                                ProfileMain: '',
                                Settings: 'settings',
                                ProfileInfo: 'info',
                                ChangePassword: 'change-password',
                                Legal: 'legal',
                                HelpSupport: 'support',
                            }
                        }
                    },
                },
            },
        },
    };

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={authScreenOptions} key={user ? 'app-root' : 'auth-root'}>
                {getMainScreens()}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#111111',
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        borderTopWidth: 1,
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
    loading: { flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' },
});

export default AppNavigator;
