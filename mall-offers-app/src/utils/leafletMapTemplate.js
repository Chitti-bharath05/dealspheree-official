/**
 * Generates a self-contained Leaflet HTML string for use in a native WebView.
 * All dependencies loaded from CDN. Stores are injected via JSON.
 */
export const generateLeafletHTML = (stores = []) => {
    const storesJson = JSON.stringify(
        stores.filter(s => s?.approved).map(s => ({
            id: s._id || s.id,
            name: s.storeName,
            category: s.category || '',
            area: s.area || '',
            city: s.city || '',
            address: [s.houseNo, s.street, s.area, s.city, s.pincode].filter(Boolean).join(', ')
        }))
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<title>Store Map</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a150d; overflow: hidden; }
  #map { width: 100vw; height: 100vh; }
  #info { position: fixed; bottom: 80px; left: 12px; right: 12px; background: rgba(26,21,13,0.96); border: 1px solid rgba(212,175,55,0.4); border-radius: 16px; padding: 14px 16px; display: none; z-index: 1000; }
  #info-name { color: #fff; font-size: 16px; font-weight: 800; }
  #info-addr { color: #8E8E93; font-size: 13px; margin-top: 3px; }
  #info-dist { color: #4ECDC4; font-size: 14px; font-weight: 700; margin-top: 6px; display: none; }
  #info-close { position: absolute; top: 10px; right: 12px; background: rgba(255,255,255,0.08); border: none; border-radius: 50%; width: 30px; height: 30px; color: #fff; font-size: 16px; cursor: pointer; }
  #myloc-btn { position: fixed; bottom: 16px; right: 16px; background: #F5C518; border: none; border-radius: 22px; padding: 12px 20px; color: #000; font-size: 14px; font-weight: 900; cursor: pointer; z-index: 1000; box-shadow: 0 4px 12px rgba(212,175,55,0.4); }
  #badge { position: fixed; bottom: 16px; left: 16px; background: rgba(26,21,13,0.88); border: 1px solid rgba(212,175,55,0.2); border-radius: 10px; padding: 7px 12px; color: #F5C518; font-size: 11px; font-weight: 700; z-index: 1000; }
  #status { position: fixed; top: 12px; left: 12px; right: 12px; background: rgba(26,21,13,0.92); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; padding: 10px 14px; color: #F5C518; font-size: 13px; font-weight: 600; z-index: 1000; text-align: center; display: none; }
  .leaflet-popup-content-wrapper { background: #1a150d; border: 1px solid rgba(212,175,55,0.4); border-radius: 12px; color: #fff; }
  .leaflet-popup-tip { background: #1a150d; }
</style>
</head>
<body>
<div id="map"></div>
<div id="status"></div>
<div id="info">
  <div id="info-name">Store Name</div>
  <div id="info-addr"></div>
  <div id="info-dist"></div>
  <button id="info-close" onclick="closePanel()">✕</button>
</div>
<button id="myloc-btn" onclick="goToMyLocation()">⊕  My Location</button>
<div id="badge">0 stores loaded</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const STORES_DATA = ${storesJson};

const map = L.map('map', { center: [20.5937, 78.9629], zoom: 5, zoomControl: true });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors', maxZoom: 19
}).addTo(map);

let userMarker = null, userLatLng = null, routeLine = null;
let geocodedCount = 0, selectedStoreData = null;

const userIcon = L.divIcon({
  html: '<div style="width:36px;height:36px;border-radius:50%;background:#4ECDC4;border:3px solid #fff;display:flex;align-items:center;justify-content:center;"><div style="width:12px;height:12px;border-radius:50%;background:#fff;"></div></div>',
  className: '', iconSize:[36,36], iconAnchor:[18,18]
});
const storeIcon = L.divIcon({
  html: '<div style="width:34px;height:40px;"><svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 34 42\\'><path d=\\'M17 0 C8 0 0 8 0 17 C0 30 17 42 17 42 C17 42 34 30 34 17 C34 8 26 0 17 0Z\\' fill=\\'#F5C518\\' stroke=\\'#fff\\' stroke-width=\\'2\\'/><circle cx=\\'17\\' cy=\\'17\\' r=\\'8\\' fill=\\'#fff\\'/></svg></div>',
  className: '', iconSize:[34,40], iconAnchor:[17,40], popupAnchor:[0,-42]
});
const selectedIcon = L.divIcon({
  html: '<div style="width:34px;height:40px;"><svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 34 42\\'><path d=\\'M17 0 C8 0 0 8 0 17 C0 30 17 42 17 42 C17 42 34 30 34 17 C34 8 26 0 17 0Z\\' fill=\\'#FF6B6B\\' stroke=\\'#fff\\' stroke-width=\\'2\\'/><circle cx=\\'17\\' cy=\\'17\\' r=\\'8\\' fill=\\'#fff\\'/></svg></div>',
  className: '', iconSize:[34,40], iconAnchor:[17,40], popupAnchor:[0,-42]
});

function showStatus(msg) {
  const s = document.getElementById('status');
  s.textContent = msg; s.style.display = 'block';
}
function hideStatus() { document.getElementById('status').style.display = 'none'; }

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

async function geocode(address) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?q='+encodeURIComponent(address)+'&format=json&limit=1', { headers:{'Accept-Language':'en'} });
    const d = await r.json();
    if(d&&d[0]) return {lat:parseFloat(d[0].lat),lng:parseFloat(d[0].lon)};
  } catch(e) {}
  return null;
}

async function fetchRoute(from, to) {
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/'+from.lng+','+from.lat+';'+to.lng+','+to.lat+'?overview=full&geometries=geojson';
    const r = await fetch(url);
    const d = await r.json();
    if(d.routes&&d.routes[0]) return d.routes[0].geometry.coordinates.map(([lng,lat])=>[lat,lng]);
  } catch(e) {}
  return null;
}

async function placeStoreMarkers() {
  showStatus('Loading store locations...');
  const badges = document.getElementById('badge');
  
  for(const store of STORES_DATA) {
    const c = await geocode(store.address);
    if(!c) continue;
    geocodedCount++;
    badges.textContent = geocodedCount + ' store' + (geocodedCount!==1?'s':'') + ' on map';
    
    const m = L.marker([c.lat, c.lng], {icon: storeIcon}).addTo(map);
    m.on('click', ()=>onStoreClick(store, c, m));
    m.bindTooltip(store.name, {direction:'top', offset:[0,-40]});
    store._coords = c;
    store._marker = m;
  }
  hideStatus();
  if(geocodedCount===0) showStatus('No stores could be located. Add full addresses to your stores.');
}

async function onStoreClick(store, coords, marker) {
  selectedStoreData = store;
  
  // Update panel
  document.getElementById('info').style.display = 'block';
  document.getElementById('info-name').textContent = store.name;
  document.getElementById('info-addr').textContent = [store.area, store.city].filter(Boolean).join(', ');
  
  if(userLatLng) {
    const dist = haversine(userLatLng.lat, userLatLng.lng, coords.lat, coords.lng);
    const distEl = document.getElementById('info-dist');
    distEl.textContent = '📍 '+dist.toFixed(2)+' km away';
    distEl.style.display = 'block';
    
    if(routeLine) map.removeLayer(routeLine);
    showStatus('Calculating route...');
    const route = await fetchRoute(userLatLng, coords);
    hideStatus();
    if(route) {
      routeLine = L.polyline(route, {color:'#F5C518',weight:5,opacity:0.85,dashArray:'8,5'}).addTo(map);
      const bounds = L.latLngBounds([...route.map(p=>p), [userLatLng.lat,userLatLng.lng], [coords.lat,coords.lng]]);
      map.fitBounds(bounds, {padding:[40,40]});
    }
  }
  
  marker.bindPopup('<b style="color:#F5C518">'+store.name+'</b><br/><span style="color:#aaa">'+[store.area,store.city].filter(Boolean).join(', ')+'</span>').openPopup();
}

function closePanel() {
  document.getElementById('info').style.display = 'none';
  if(routeLine) { map.removeLayer(routeLine); routeLine = null; }
}

function goToMyLocation() {
  if(userLatLng) { map.setView([userLatLng.lat, userLatLng.lng], 15); return; }
  showStatus('Getting your location...');
  navigator.geolocation.getCurrentPosition(pos=>{
    userLatLng = {lat:pos.coords.latitude, lng:pos.coords.longitude};
    map.setView([userLatLng.lat,userLatLng.lng],15);
    if(userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([userLatLng.lat,userLatLng.lng],{icon:userIcon}).addTo(map).bindTooltip('You',{permanent:true,direction:'top'}).openTooltip();
    hideStatus();
  }, ()=>{ showStatus('Location access denied.'); setTimeout(hideStatus,3000); }, {enableHighAccuracy:true});
}

// Auto-locate on load
window.onload = () => {
  placeStoreMarkers();
  if(navigator.geolocation) {
    showStatus('Getting your location...');
    navigator.geolocation.getCurrentPosition(pos=>{
      userLatLng = {lat:pos.coords.latitude, lng:pos.coords.longitude};
      map.setView([userLatLng.lat,userLatLng.lng],14);
      userMarker = L.marker([userLatLng.lat,userLatLng.lng],{icon:userIcon,zIndexOffset:1000}).addTo(map).bindTooltip('You',{permanent:true,direction:'top'}).openTooltip();
      hideStatus();
    }, ()=>{ hideStatus(); }, {enableHighAccuracy:true,timeout:10000});
  }
};
</script>
</body>
</html>`;
};
