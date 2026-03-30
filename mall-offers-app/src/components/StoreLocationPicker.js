import React, { useState, useRef, useEffect } from 'react'; // ✅ FIXED: added useEffect
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StoreLocationPicker({ value, onLocationSelect, locationText, onLocationTextChange }) {
    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markerRef = useRef(null);
    const [detecting, setDetecting] = useState(false);
    const [searching, setSearching] = useState(false);

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data?.display_name) {
                const parts = data.display_name.split(',').slice(0, 4);
                return parts.join(',').trim();
            }
        } catch (e) { }
        return '';
    };

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const initMap = () => {
            if (!mapRef.current || leafletMap.current) return;
            const L = window.L;
            const initialLat = value?.lat || 17.385;
            const initialLng = value?.lng || 78.486;

            const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(map);

            if (value?.lat && value?.lng) {
                markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
            }

            map.on('click', async (e) => {
                const lat = parseFloat(e.latlng.lat.toFixed(6));
                const lng = parseFloat(e.latlng.lng.toFixed(6));
                if (markerRef.current) map.removeLayer(markerRef.current);
                markerRef.current = L.marker([lat, lng]).addTo(map);

                if (onLocationSelect) onLocationSelect({ lat, lng, address: '' });
                const addr = await reverseGeocode(lat, lng);
                if (onLocationSelect) onLocationSelect({ lat, lng, address: addr });
                if (onLocationTextChange && addr) onLocationTextChange(addr);
            });

            leafletMap.current = map;
        };

        if (window.L) {
            initMap();
        } else {
            if (!document.getElementById('leaflet-js')) {
                const script = document.createElement('script');
                script.id = 'leaflet-js';
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.onload = initMap;
                document.head.appendChild(script);
            } else {
                // script tag exists but may still be loading
                const interval = setInterval(() => {
                    if (window.L) {
                        clearInterval(interval);
                        initMap();
                    }
                }, 100);
            }
        }

        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        };
    }, []);

    // Update map marker when value changes externally (e.g. editing existing store)
    useEffect(() => {
        if (leafletMap.current && window.L && value?.lat && value?.lng) {
            leafletMap.current.setView([value.lat, value.lng], 15);
            if (markerRef.current) leafletMap.current.removeLayer(markerRef.current);
            markerRef.current = window.L.marker([value.lat, value.lng]).addTo(leafletMap.current);
        }
    }, [value?.lat, value?.lng]);

    const handleAutoDetect = () => {
        if (!navigator?.geolocation) {
            Alert.alert('Error', 'Geolocation is not supported by your browser');
            return;
        }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = parseFloat(pos.coords.latitude.toFixed(6));
                const lng = parseFloat(pos.coords.longitude.toFixed(6));

                if (onLocationSelect) onLocationSelect({ lat, lng, address: '' });
                const addr = await reverseGeocode(lat, lng);
                if (onLocationSelect) onLocationSelect({ lat, lng, address: addr });
                if (onLocationTextChange && addr) onLocationTextChange(addr);

                if (leafletMap.current && window.L) {
                    leafletMap.current.setView([lat, lng], 15);
                    if (markerRef.current) leafletMap.current.removeLayer(markerRef.current);
                    markerRef.current = window.L.marker([lat, lng]).addTo(leafletMap.current);
                }
                setDetecting(false);
            },
            (err) => {
                setDetecting(false);
                let msg = 'Could not fetch location.';
                if (err.code === 1) msg = 'Location permission denied. Please allow location access.';
                else if (err.code === 2) msg = 'Location unavailable. Try again.';
                else if (err.code === 3) msg = 'Location request timed out.';

                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('Error', msg);
                }
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleSearch = async () => {
        if (!locationText || !locationText.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data && data[0]) {
                const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
                const lng = parseFloat(parseFloat(data[0].lon).toFixed(6));
                const addr = data[0].display_name.split(',').slice(0, 4).join(',').trim();

                if (onLocationSelect) onLocationSelect({ lat, lng, address: addr });
                if (onLocationTextChange) onLocationTextChange(addr);

                if (leafletMap.current && window.L) {
                    leafletMap.current.setView([lat, lng], 15);
                    if (markerRef.current) leafletMap.current.removeLayer(markerRef.current);
                    markerRef.current = window.L.marker([lat, lng]).addTo(leafletMap.current);
                }
            } else {
                if (Platform.OS === 'web') {
                    window.alert('Location not found. Try a different search term.');
                } else {
                    Alert.alert('Not Found', 'Location not found. Try a different search term.');
                }
            }
        } catch (e) {
            console.error('Search error:', e);
        }
        setSearching(false);
    };

    // ✅ FIXED: Mobile fallback now shows manual text input instead of just a message
    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.titleRow}>
                        <View style={styles.accentBar} />
                        <Text style={styles.sectionTitle}>Store Location</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detectBtn}
                        onPress={handleAutoDetect}
                        disabled={detecting}
                        activeOpacity={0.8}
                    >
                        {detecting ? (
                            <ActivityIndicator color="#000" size="small" style={{ width: 80 }} />
                        ) : (
                            <>
                                <Ionicons name="locate" size={14} color="#000" style={{ marginRight: 5 }} />
                                <Text style={styles.detectBtnText}>Auto Detect</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.searchInput}
                        value={locationText}
                        onChangeText={onLocationTextChange}
                        placeholder="Enter location manually or auto-detect..."
                        placeholderTextColor="#555"
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={handleSearch}
                        disabled={searching}
                        activeOpacity={0.8}
                    >
                        {searching ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <Text style={styles.searchBtnText}>Search</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {locationText ? (
                    <View style={styles.addressBox}>
                        <Ionicons name="location" size={14} color="#F5C518" />
                        <Text style={styles.addressText}>{locationText}</Text>
                    </View>
                ) : null}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Section Header Row with Auto Detect button */}
            <View style={styles.headerRow}>
                <View style={styles.titleRow}>
                    <View style={styles.accentBar} />
                    <Text style={styles.sectionTitle}>Store Location</Text>
                </View>
                <TouchableOpacity
                    style={styles.detectBtn}
                    onPress={handleAutoDetect}
                    disabled={detecting}
                    activeOpacity={0.8}
                >
                    {detecting ? (
                        <ActivityIndicator color="#000" size="small" style={{ width: 80 }} />
                    ) : (
                        <>
                            <Ionicons name="locate" size={14} color="#000" style={{ marginRight: 5 }} />
                            <Text style={styles.detectBtnText}>Auto Detect</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    value={locationText}
                    onChangeText={onLocationTextChange}
                    placeholder="Enter location manually or auto-detect..."
                    placeholderTextColor="#555"
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={handleSearch}
                    disabled={searching}
                    activeOpacity={0.8}
                >
                    {searching ? (
                        <ActivityIndicator color="#000" size="small" />
                    ) : (
                        <Text style={styles.searchBtnText}>Search</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Leaflet map via injected DOM div */}
            <View style={styles.mapWrap}>
                <div
                    ref={mapRef}
                    style={{ width: '100%', height: 300, backgroundColor: '#222' }}
                />
            </View>
            <Text style={styles.mapHint}>Tap on the map to pin your store location</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    accentBar: { width: 4, height: 20, backgroundColor: '#F5C518', borderRadius: 2 },
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
    detectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5C518',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    detectBtnText: { color: '#000', fontWeight: '800', fontSize: 12 },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: 'rgba(245,197,24,0.08)',
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.2)',
    },
    addressText: { color: '#F5C518', fontSize: 13, flex: 1, lineHeight: 18 },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    searchInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        color: '#fff',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    searchBtn: {
        backgroundColor: '#F5C518',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 70,
    },
    searchBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
    mapWrap: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.2)',
    },
    mapHint: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 6 },
});