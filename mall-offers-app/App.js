import 'expo-dev-client';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './ErrorBoundary';
import * as WebBrowser from 'expo-web-browser';
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
                  {/* Clean, Full-Width Layout Inspired by Amazon (Responsive) */}
                  <View style={styles.appWrapper}>
                    <AppNavigator />
                  </View>
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
    backgroundColor: '#0D0D0D', // Premium Near-Black
  },
  appWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1440 : undefined, // Amazon-style max width on web
    alignSelf: 'center',
    backgroundColor: '#0D0D0D',
  },
});