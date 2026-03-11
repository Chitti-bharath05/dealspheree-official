import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appTranslations } from '../constants/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('user_language');
            if (savedLanguage && appTranslations && appTranslations[savedLanguage]) {
                setCurrentLanguage(savedLanguage);
            }
        } catch (error) {
            console.error('Failed to load language', error);
        }
    };

    const changeLanguage = async (langCode) => {
        try {
            if (appTranslations && appTranslations[langCode]) {
                setCurrentLanguage(langCode);
                await AsyncStorage.setItem('user_language', langCode);
            }
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    const t = (key) => {
        // Ultimate safety check for Hermes Property 'en' doesn't exist error
        if (!appTranslations) {
            console.error('CRITICAL: appTranslations is not loaded');
            return key;
        }

        const safeLang = (appTranslations[currentLanguage]) ? currentLanguage : 'en';
        const langPack = appTranslations[safeLang] || appTranslations['en'] || {};
        
        return langPack[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
