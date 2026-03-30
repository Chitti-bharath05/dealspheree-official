import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  body { margin: 0; padding: 0; background: #000; }
  #map { height: 100vh; width: 100vw; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
window.addEventListener('message', function(e) {
  try {
    var data = JSON.parse(e.data);
    if (data.lat && data.lng) {
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([data.lat, data.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        var storeIcon = L.divIcon({
            html: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
            <path d="M20 0 C9 0 0 9 0 20 C0 35 20 50 20 50 C20 50 40 35 40 20 C40 9 31 0 20 0Z" fill="#F5C518" stroke="#fff" stroke-width="2"/>
            <circle cx="20" cy="20" r="9" fill="#fff"/>
            </svg>\`,
            className: '', iconSize: [40, 50], iconAnchor: [20, 50]
        });

        L.marker([data.lat, data.lng], { icon: storeIcon }).addTo(map);
    }
  } catch(err) {}
});
</script>
</body>
</html>`;

export default function StoreLocationDisplay({ lat, lng }) {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!lat || !lng) return;
        
        const fetchAddress = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                const data = await res.json();
                if (data && data.display_name) {
                    setAddress(data.display_name);
                }
            } catch (err) {
                console.warn('Reverse geocode error', err);
            } finally {
                setLoading(false);
            }
        };

        // If we strictly need reverse geocode logic here later we can re-enable it.
        // fetchAddress();
    }, [lat, lng]);

    if (!lat || !lng) return null;

    if (Platform.OS !== 'web') {
        return (
            <View style={s.container}>
                <Text style={s.address}>📍 {loading ? 'Fetching address...' : (address || 'Location Saved')}</Text>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={s.mapWrapper}>
                <iframe
                    srcDoc={MAP_HTML}
                    style={{ width: '100%', height: 200, border: 'none', borderRadius: 12, display: 'block' }}
                    title="Store Location"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={(e) => {
                        e.target.contentWindow.postMessage(JSON.stringify({ lat, lng }), '*');
                    }}
                />
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { marginTop: 15, marginBottom: 10 },
    mapWrapper: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.3)',
        marginBottom: 10
    },
    addressWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245,197,24,0.1)',
        padding: 10,
        borderRadius: 8
    },
    addressText: { color: '#F5C518', fontSize: 13, fontWeight: '600', flex: 1 },
});
