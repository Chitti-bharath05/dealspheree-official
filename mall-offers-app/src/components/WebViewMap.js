import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { generateLeafletHTML } from '../utils/leafletMapTemplate';

// Dynamically import WebView to avoid crashing on web
let WebView = null;
try {
    WebView = require('react-native-webview').WebView;
} catch (e) {
    WebView = null;
}

export default function WebViewMap({ stores = [] }) {
    if (!WebView) {
        return (
            <View style={styles.fallback}>
                <Text style={styles.fallbackText}>Map not available on this platform.</Text>
            </View>
        );
    }

    const html = generateLeafletHTML(stores);

    return (
        <WebView
            key={stores.length} // re-render when stores change
            source={{ html }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onError={(e) => console.log('WebView error:', e.nativeEvent)}
        />
    );
}

const styles = StyleSheet.create({
    fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a150d' },
    fallbackText: { color: '#D4AF37', fontSize: 16 },
});
