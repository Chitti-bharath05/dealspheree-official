import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const TopHeader = ({ title }) => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [locationName, setLocationName] = useState('Detecting...');
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = () => {
        if (Platform.OS === 'web') {
            setLoadingLocation(true);
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&email=support@dealspheree.in`);
                        if (!response.ok) throw new Error('Nominatim request failed: ' + response.statusText);
                        const data = await response.json();
                        
                        let city = 'Unknown';
                        if (data && data.address) {
                            console.log('Detected Address components:', data.address);
                            city = data.address.city || 
                                   data.address.town || 
                                   data.address.village || 
                                   data.address.suburb || 
                                   data.address.county ||
                                   data.address.state_district ||
                                   data.address.state || 
                                   data.address.country ||
                                   'Unknown';
                        }
                        setLocationName(city);
                    } catch (error) {
                        console.error('Reverse Geocode Error:', error);
                        setLocationName('Location Error');
                    } finally {
                        setLoadingLocation(false);
                    }
                }, (error) => {
                    console.error('Geolocation Error:', error);
                    setLocationName('Location');
                    setLoadingLocation(false);
                });
            } else {
                setLocationName('Location');
                setLoadingLocation(false);
            }
        } else {
            setLocationName('Mobile View');
        }
    };

    const getAppTitle = () => {
        if (user?.role === 'admin') return "Dealspheree Admin";
        if (user?.role === 'store_owner') return "Dealspheree Store";
        return "Dealspheree";
    };

    return (
        <View style={s.header}>
            <View style={s.leftContent}>
                {navigation.canGoBack() && (
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#F5C518" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={s.logoText}>{getAppTitle()}</Text>
                </TouchableOpacity>
            </View>

            <View style={s.rightContent}>
                <TouchableOpacity style={s.iconGroup} onPress={fetchLocation}>
                    <Ionicons name="location-outline" size={22} color="#F5C518" />
                    <Text style={s.iconLabel} numberOfLines={1}>{locationName}</Text>
                    {loadingLocation && <ActivityIndicator size="small" color="#F5C518" style={{ marginLeft: 5 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Map')}>
                    <Ionicons name="map-outline" size={24} color={route.name === 'Map' ? "#F5C518" : "#fff"} />
                </TouchableOpacity>

                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Profile')}>
                    <View style={s.avatarWrapper}>
                        {user?.profileImage ? (
                            <Image 
                                source={{ uri: user.profileImage }} 
                                style={s.avatarImg}
                            />
                        ) : (
                            <Ionicons name="person-outline" size={22} color={route.name.includes('Profile') ? "#F5C518" : "#fff"} />
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    header: {
        height: 70,
        backgroundColor: '#121212',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        zIndex: 1000,
        ...Platform.select({
            web: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100%',
                maxWidth: 1440,
                alignSelf: 'center',
            }
        })
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        marginRight: 4,
    },
    logoText: {
        color: '#F5C518',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        maxWidth: 150,
    },
    iconLabel: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 6,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#F5C518',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: 36,
        height: 36,
        borderRadius: 18,
    }
});

export default TopHeader;
