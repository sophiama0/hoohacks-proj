/**
 * map.js — live friend map logic
 * Depends on: Leaflet, utils.js
 */

const FRIENDS = [
  {id:'alex',  name:'Collin Chan',      ini:'CC', color:'#355E3B', lat:38.0538, lng:-78.4865, gait:73, loc:"Near Trinity Irish Pub",    batt:24},
  {id:'jordan',name:'Jordan Kim',      ini:'JK', color:'#355E3B', lat:38.0528, lng:-78.4858, gait:87, loc:'Walking on Wertland St',batt:61},
  {id:'maya',  name:'Maya Rodriguez',  ini:'MR', color:'#355E3B', lat:38.0542, lng:-78.4878, gait:15, loc:'At Boylan Heights',     batt:88},
  {id:'richard',   name:'Richard Do',      ini:'RD', color:'#355E3B', lat:38.0545, lng:-78.4875, gait:41, loc:'At Bodos Bagles',           batt:52},
];
const ME = {lat:38.0535, lng:-78.4870};
let map, markers = {};
let pinMode = false;
let pendingPin = null;
let friendSafeLayers = [];

function initMap(){
  map = L.map('map', {center:[ME.lat,ME.lng], zoom:16, zoomControl:false, attributionControl:false});
  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {maxZoom:20, attribution:''}).addTo(map);

  // "You" marker
  L.marker([ME.lat,ME.lng], {icon: L.divIcon({
    html:`<div style="width:44px;height:44px;border-radius:50%;background:#355E3B;border:3px solid white;box-shadow:0 0 0 3px rgba(53,94,59,0.4),0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:white;font-family:Inter,sans-serif">S</div>`,
    className:'', iconSize:[44,44], iconAnchor:[22,22]
  })}).addTo(map).bindPopup(`
    <div class="rp-card">
      <div class="rp-name">Sophie (You)</div>
      <div class="rp-loc">📍 Near Trinity Irish Pub</div>
      <div class="rp-row">
        <div class="rp-stat">
          <div class="rp-stat-label">Battery</div>
          <div class="rp-stat-val" style="color:#6fcf7c">87%</div>
        </div>
        <div class="rp-stat">
          <div class="rp-stat-label">Gait</div>
          <div class="rp-stat-val" style="color:#6fcf7c">8%</div>
        </div>
      </div>
    </div>
  `, {className: 'rp-popup', maxWidth: 220});

  L.circle([ME.lat,ME.lng], {radius:25, color:'#355E3B', fillColor:'#355E3B', fillOpacity:0.08, weight:1}).addTo(map);

  // Safe place marker
  L.marker([38.0520,-78.4892], {icon: L.divIcon({
    html:`<div style="width:36px;height:36px;border-radius:10px;background:#4caf6e;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
    className:'', iconSize:[36,36], iconAnchor:[18,18]
  })}).addTo(map).bindPopup(`
    <div class="rp-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">
        <div style="width:38px;height:38px;border-radius:10px;background:#4caf6e;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:white;flex-shrink:0;">S</div>
        <div>
          <div class="rp-name">Your Safe Spot</div>
          <div class="rp-loc" style="margin-top:2px;">Your Apartment</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:7px;background:rgba(76,175,110,0.12);border:1px solid rgba(76,175,110,0.35);border-radius:9px;padding:8px 11px;">
        <div style="width:7px;height:7px;border-radius:50%;background:#6fcf7c;flex-shrink:0;"></div>
        <span style="font-size:12px;font-weight:600;color:#6fcf7c;font-family:Inter,sans-serif;">Marked as safe</span>
      </div>
    </div>
  `, {className: 'rp-popup', maxWidth: 240});

  FRIENDS.forEach(addMarker);
  renderChips();
  startSim();

  map.on('click', function(e) {
    if (!pinMode) return;
    exitPinMode();
    pendingPin = {lat: e.latlng.lat, lng: e.latlng.lng};
    openModal('pin-name-modal');
  });
}

function addMarker(f){
  const c = gc(f.gait);
  const icon = L.divIcon({
    html:`<div style="position:relative;width:40px;height:40px">
      <div style="width:40px;height:40px;border-radius:50%;background:${f.color};border:2px solid white;box-shadow:0 0 0 3px ${c}55,0 4px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;font-family:Inter,sans-serif">${f.ini}</div>
      <div style="position:absolute;top:-4px;right:-4px;width:15px;height:15px;border-radius:50%;background:${c};border:2px solid #080810;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:700">${f.gait>80?'!':f.gait>60?'~':''}</div>
    </div>`,
    className:'', iconSize:[40,40], iconAnchor:[20,20]
  });
  if(markers[f.id]) map.removeLayer(markers[f.id]);
  const battColor = f.batt <= 20 ? '#ef4444' : f.batt <= 40 ? '#f59e0b' : '#6fcf7c';
  const battBars = Math.round(f.batt / 25); // 0–4 bars
  const battIcon = ['🔴','🪫','🔋','🔋','🔋'][battBars] || '🔋';
  markers[f.id] = L.marker([f.lat,f.lng], {icon}).addTo(map)
    .bindPopup(`
      <div class="rp-card">
        <div class="rp-name">${f.name}</div>
        <div class="rp-loc">📍 ${f.loc}</div>
        <div class="rp-row">
          <div class="rp-stat">
            <div class="rp-stat-label">Battery</div>
            <div class="rp-stat-val" style="color:${battColor}">${f.batt}%</div>
          </div>
          <div class="rp-stat">
            <div class="rp-stat-label">Gait</div>
            <div class="rp-stat-val" style="color:${gc(f.gait)}">${f.gait}%</div>
          </div>
        </div>
        <a class="rp-dir" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}" target="_blank">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Get Directions
        </a>
      </div>
    `, {className: 'rp-popup', maxWidth: 220});
}

function renderChips(){
  const c = document.getElementById('chips');
  c.innerHTML = '';
  [...FRIENDS].sort((a,b)=>b.gait-a.gait).forEach(f=>{
    const cls = f.gait>=80?'hi':f.gait>=60?'md':'';
    const col = gc(f.gait);
    const d = document.createElement('div');
    d.className = 'chip ' + cls;
    d.innerHTML = `<div class="av" style="background:${f.color}">${f.ini}<div class="av-dot" style="background:${col}"></div></div><div><div class="chip-name">${f.name.split(' ')[0]}</div><div class="chip-info">${f.gait}% · ${f.loc.split(' ').slice(0,2).join(' ')}</div></div>`;
    d.onclick = ()=>{ map.flyTo([f.lat,f.lng], 17, {duration:1}); markers[f.id].openPopup(); };
    c.appendChild(d);
  });
}

function centerMap(){ map.flyTo([ME.lat,ME.lng], 16, {duration:1}); toast('','Centered on you','Map moved to your location'); }

function startSim(){
  setInterval(()=>{
    FRIENDS.forEach(f=>{
      f.gait = Math.max(5, Math.min(99, Math.round(f.gait + (Math.random()-0.45)*4)));
      f.lat += (Math.random()-0.5)*0.0001;
      f.lng += (Math.random()-0.5)*0.0001;
      addMarker(f);
    });
    renderChips();
  }, 3000);
}

function toggleSidebar(){
  const open = document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('main').classList.toggle('pushed', open);
  document.getElementById('hamburger').classList.toggle('open', open);
  if(open) setTimeout(()=>map.invalidateSize(), 320);
}

// Tap the visible sliver of map to close sidebar
document.getElementById('main').addEventListener('click', ()=>{
  if(document.getElementById('sidebar').classList.contains('open')) toggleSidebar();
});

// Populate sidebar with user info from localStorage
(function(){
  const user = JSON.parse(localStorage.getItem('rally_user') || 'null');
  if(!user) return;
  const avEl   = document.getElementById('sidebar-av');
  const nameEl = document.getElementById('sidebar-uname');
  if(nameEl) nameEl.textContent = user.name || 'Your Profile';
  if(avEl){
    if(user.avatar){
      avEl.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      avEl.textContent = (user.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    }
  }
})();

function showFriendSafePins(friends) {
  hideFriendSafePins();
  friends.filter(f => f.joined && f.safeSpot).forEach(f => {
    const safeGreen = '#4caf6e';
    const icon = L.divIcon({
      html:`<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:32px;height:32px;border-radius:9px;background:${safeGreen};border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div style="font-size:9px;font-weight:700;color:white;background:rgba(0,0,0,0.72);border:1px solid ${safeGreen};border-radius:4px;padding:1px 5px;white-space:nowrap;">${f.initials}</div>
      </div>`,
      className:'', iconSize:[32,44], iconAnchor:[16,16]
    });
    const m = L.marker([f.safeSpot.lat, f.safeSpot.lng], {icon}).addTo(map)
      .bindPopup(`<div class="rp-card">
        <div class="rp-name">${f.name.split(' ')[0]}'s Safe Spot</div>
        <div class="rp-loc">${f.safeSpot.label}</div>
        <div style="background:rgba(53,94,59,0.15);border:1px solid rgba(53,94,59,0.35);border-radius:9px;padding:8px 10px;font-size:11px;color:#6fcf7c;font-family:Inter,sans-serif;">Marked as safe</div>
      </div>`, {className:'rp-popup', maxWidth:220});
    friendSafeLayers.push(m);
  });
}

function hideFriendSafePins() {
  friendSafeLayers.forEach(l => map.removeLayer(l));
  friendSafeLayers = [];
}

function enterPinMode() {
  pinMode = true;
  document.getElementById('pin-mode-banner').style.display = 'flex';
  map.getContainer().style.cursor = 'crosshair';
}

function exitPinMode() {
  pinMode = false;
  document.getElementById('pin-mode-banner').style.display = 'none';
  map.getContainer().style.cursor = '';
}

function addSafePin(lat, lng, label) {
  L.marker([lat, lng], {icon: L.divIcon({
    html:`<div style="width:36px;height:36px;border-radius:10px;background:#4caf6e;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
    className:'', iconSize:[36,36], iconAnchor:[18,18]
  })}).addTo(map).bindPopup(`
    <div class="rp-card">
      <div class="rp-name">Safe Place</div>
      <div class="rp-loc">${label}</div>
      <div style="background:rgba(53,94,59,0.15);border:1px solid rgba(53,94,59,0.35);border-radius:9px;padding:8px 10px;font-size:11px;color:#6fcf7c;font-family:Inter,sans-serif;">Marked as safe</div>
    </div>
  `, {className:'rp-popup', maxWidth:220}).openPopup();
}

function startCurrentLocPin() {
  pendingPin = {lat: ME.lat, lng: ME.lng};
  openModal('pin-name-modal');
}

function confirmPin() {
  const name = document.getElementById('pin-name-input').value.trim() || 'Safe Place';
  closeModal('pin-name-modal');
  document.getElementById('pin-name-input').value = '';
  if (!pendingPin) return;
  addSafePin(pendingPin.lat, pendingPin.lng, name);
  pendingPin = null;
  toast('', 'Safe place saved!', name + ' marked on your map');
}

function toggleSafeSearch() {
  const row = document.getElementById('safe-search-row');
  const visible = row.style.display !== 'none';
  row.style.display = visible ? 'none' : 'block';
  if (!visible) document.getElementById('safe-search-input').focus();
}

function searchAndPin() {
  const query = document.getElementById('safe-search-input').value.trim();
  if (!query) return;
  const center = map.getCenter();
  pendingPin = {lat: center.lat + (Math.random()-0.5)*0.004, lng: center.lng + (Math.random()-0.5)*0.004};
  document.getElementById('safe-search-input').value = '';
  document.getElementById('safe-search-row').style.display = 'none';
  closeModal('safe-modal');
  document.getElementById('pin-name-input').value = query;
  openModal('pin-name-modal');
}

initMap();
