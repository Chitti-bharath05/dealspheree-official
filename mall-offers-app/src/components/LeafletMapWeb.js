import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  body { margin: 0; padding: 0; background: #000; }
  #map { height: 100vh; width: 100vw; }
  .leaflet-popup-content-wrapper { background: rgba(26,21,13,0.97); color: #fff; border: 1px solid rgba(212,175,55,0.4); border-radius: 12px; }
  .leaflet-popup-tip { background: rgba(26,21,13,0.97); }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map', { zoomControl: false }).setView([17.385, 78.486], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

var markers = [];
var userMarker = null;

var storeIcon = L.divIcon({
    html: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
  <path d="M20 0 C9 0 0 9 0 20 C0 35 20 50 20 50 C20 50 40 35 40 20 C40 9 31 0 20 0Z" fill="#F5C518" stroke="#fff" stroke-width="2"/>
  <circle cx="20" cy="20" r="9" fill="#fff"/>
</svg>\`,
    className: '', iconSize: [40, 50], iconAnchor: [20, 50], popupAnchor: [0, -40]
});

var userIcon = L.divIcon({
    html: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <circle cx="20" cy="20" r="18" fill="#4ECDC4" stroke="#fff" stroke-width="3"/>
  <circle cx="20" cy="20" r="8" fill="#fff"/>
</svg>\`,
    className: '', iconSize: [40, 40], iconAnchor: [20, 20]
});

window.addEventListener('message', function(e) {
  try {
    var data = JSON.parse(e.data);
    
    if (data.type === 'USER_LOCATION') {
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([data.lat, data.lng], { icon: userIcon }).addTo(map).bindPopup('<b style="color:#4ECDC4">You are here</b>');
      map.setView([data.lat, data.lng], 12);
    }
    
    if (data.type === 'DEFAULT_LOCATION') {
      map.setView([17.385, 78.486], 12);
    }

    if (data.type === 'STORES') {
      markers.forEach(function(m) { map.removeLayer(m); });
      markers = [];
      data.stores.forEach(function(store) {
        if (store.lat && store.lng) {
          var m = L.marker([store.lat, store.lng], { icon: storeIcon })
                   .addTo(map)
                   .bindPopup('<b style="color:#F5C518;font-size:14px;">' + store.name + '</b><br/><span style="color:#aaa;font-size:12px;">' + (store.location||'') + '</span>');
          markers.push(m);
        }
      });
    }
  } catch(err) {}
});
</script>
</body>
</html>`;

export default function LeafletMapWeb({ stores = [] }) {
    const iframeRef = useRef(null);
    const [isLocating, setIsLocating] = useState(true);
    const [locError, setLocError] = useState(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    const approvedStores = stores.filter(s => s?.approved);

    const sendData = (type, payload) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ type, ...payload }), '*');
        }
    };

    const postStores = () => {
        const mappedStores = approvedStores.filter(s => s.lat && s.lng).map(s => ({
            lat: s.lat, lng: s.lng, name: s.storeName, location: s.location
        }));
        sendData('STORES', { stores: mappedStores });
    };

    const handleGetLocation = () => {
        setIsLocating(true);
        setLocError(null);
        
        const fallbackTimeout = setTimeout(() => {
            setLocError('Could not get location. Please enable location permissions.');
            sendData('DEFAULT_LOCATION', {});
            postStores();
            setIsLocating(false);
        }, 10000);

        if (!navigator.geolocation) {
            clearTimeout(fallbackTimeout);
            setLocError('Could not get location. Please enable location permissions.');
            sendData('DEFAULT_LOCATION', {});
            postStores();
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(fallbackTimeout);
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                sendData('USER_LOCATION', loc);
                postStores();
                setIsLocating(false);
            },
            (err) => {
                clearTimeout(fallbackTimeout);
                setLocError('Could not get location. Please enable location permissions.');
                sendData('DEFAULT_LOCATION', {});
                postStores();
                setIsLocating(false);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
        );
    };

    useEffect(() => {
        if (iframeLoaded) {
            handleGetLocation();
        }
    }, [iframeLoaded]);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
    };

    return (
        <View style={styles.container}>
            <iframe
                ref={iframeRef}
                srcDoc={MAP_HTML}
                onLoad={handleIframeLoad}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Map"
                sandbox="allow-scripts allow-same-origin"
            />

            {isLocating && (
                <View style={styles.overlay}>
                    <ActivityIndicator color="#F5C518" size="large" />
                    <Text style={styles.overlayText}>Getting your location...</Text>
                </View>
            )}

            {locError && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠ {locError}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation}>
                <Text style={styles.locationBtnText}>⊕  My Location</Text>
            </TouchableOpacity>

            <View style={styles.badge}>
                <Text style={styles.badgeText}>
                    {approvedStores.filter(s => s.lat && s.lng).length} / {approvedStores.length} stores mapped
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    overlayText: { color: '#F5C518', marginTop: 16, fontSize: 16, fontWeight: '700' },
    errorBanner: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: 12, padding: 10, zIndex: 500, borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)' },
    errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', fontWeight: '600' },
    locationBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: '#F5C518', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, zIndex: 500, shadowColor: '#F5C518', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
    locationBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },
    badge: { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(26,21,13,0.85)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, zIndex: 500, borderWidth: 1, borderColor: 'rgba(245,197,24,0.2)' },
    badgeText: { color: '#F5C518', fontSize: 11, fontWeight: '700' },
});
