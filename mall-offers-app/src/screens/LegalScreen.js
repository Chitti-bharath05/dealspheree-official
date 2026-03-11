import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function LegalScreen({ route, navigation }) {
    const { title = 'Legal', content = '' } = route?.params || {};
    const { t } = useLanguage();

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{title}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={s.contentCard}>
                        <Text style={s.legalTxt}>
                            {t('legal_updated')}{'\n\n'}
                            {t('legal_welcome').replace('{type}', title.toLowerCase())}{'\n\n'}
                            {content || `[Section 1: Data Usage]\nWe value your privacy and only collect data necessary to provide you with exclusive mall offers...\n\n[Section 2: User Conduct]\nUsers are expected to use the platform respectfully and not engage in any fraudulent activity...\n\n[Section 3: Liability]\nSizzling Valoris is not responsible for the quality of goods purchased from third-party boutiques...`}
                        </Text>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    scroll: { paddingHorizontal: 24, paddingBottom: 50 },
    contentCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    legalTxt: { color: '#8E8E93', fontSize: 15, lineHeight: 26 },
});
