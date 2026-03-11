import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function MapScreen({ navigation }) {
    const { t } = useLanguage();

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t('mall_map')}</Text>
                    <View style={{ width: 44 }} />
                </View>
                
                <View style={s.content}>
                    <View style={s.iconWrap}>
                        <Ionicons name="map-outline" size={80} color="#D4AF37" />
                    </View>
                    <Text style={s.title}>{t('map_coming_soon')}</Text>
                    <Text style={s.sub}>{t('map_coming_soon_sub')}</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    iconWrap: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(212,175,55,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    title: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    sub: { color: '#8E8E93', fontSize: 16, marginTop: 16, textAlign: 'center', lineHeight: 26, fontWeight: '500' }
});

