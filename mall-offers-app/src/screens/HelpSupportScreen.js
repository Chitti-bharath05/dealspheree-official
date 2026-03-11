import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../context/LanguageContext';

export default function HelpSupportScreen({ navigation }) {
    const { t } = useLanguage();

    const FaqItem = ({ question, answer }) => {
        const [open, setOpen] = React.useState(false);
        return (
            <TouchableOpacity style={s.faq} onPress={() => setOpen(!open)}>
                <View style={s.faqHeader}>
                    <Text style={s.question}>{question}</Text>
                    <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#D4AF37" />
                </View>
                {open && <Text style={s.answer}>{answer}</Text>}
            </TouchableOpacity>
        );
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t('support')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <Text style={s.sectionTitle}>{t('faq')}</Text>
                    <View style={s.section}>
                        <FaqItem 
                            question={t('faq_q1')} 
                            answer={t('faq_a1')} 
                        />
                        <FaqItem 
                            question={t('faq_q2')} 
                            answer={t('faq_a2')} 
                        />
                        <FaqItem 
                            question={t('faq_q3')} 
                            answer={t('faq_a3')} 
                        />
                    </View>

                    <Text style={s.sectionTitle}>{t('get_in_touch')}</Text>
                    <View style={s.section}>
                        <TouchableOpacity style={s.contactItem}>
                            <Ionicons name="mail" size={20} color="#D4AF37" />
                            <Text style={s.contactTxt}>Email: support@valories.com</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.contactItem}>
                            <Ionicons name="chatbubbles" size={20} color="#D4AF37" />
                            <Text style={s.contactTxt}>{t('live_chat')}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={s.sectionTitle}>{t('feedback')}</Text>
                    <View style={s.feedbackBox}>
                        <TextInput 
                            placeholder={t('feedback_placeholder')} 
                            placeholderTextColor="#555" 
                            multiline 
                            style={s.feedbackInput} 
                        />
                        <TouchableOpacity 
                            style={s.submitBtn} 
                            onPress={() => Alert.alert(t('thank_you'), t('feedback_submitted'))}
                        >
                            <Text style={s.submitBtnTxt}>{t('submit_feedback')}</Text>
                        </TouchableOpacity>
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
    sectionTitle: { color: '#D4AF37', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: 30, marginBottom: 15, marginLeft: 10 },
    section: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    faq: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    question: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, paddingRight: 10 },
    answer: { color: '#8E8E93', fontSize: 14, marginTop: 10, lineHeight: 20 },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    contactTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
    feedbackBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    feedbackInput: { height: 120, textAlignVertical: 'top', color: '#fff', fontSize: 15 },
    submitBtn: { backgroundColor: '#D4AF37', borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 15 },
    submitBtnTxt: { color: '#000', fontWeight: '800', fontSize: 15 },
});
