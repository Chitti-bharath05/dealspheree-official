import 'expo-dev-client';
import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationHistoryProvider } from './src/context/NavigationHistoryContext';
import ErrorBoundary from './ErrorBoundary';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';

WebBrowser.maybeCompleteAuthSession();

// Configure foreground notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Create a client for React Query
const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (__DEV__) return; // Skip in development
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.error('Error fetching update:', error);
      }
    }
    onFetchUpdateAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <View style={styles.container}>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <AuthProvider>
                <DataProvider>
                  <StatusBar style="light" />
                  <AppNavigator />
                </DataProvider>
              </AuthProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29', // Matching the app's theme
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
});