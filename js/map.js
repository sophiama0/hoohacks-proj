/**
 * map.js — live friend map logic
 * Depends on: Leaflet, utils.js
 */

const FRIENDS = [
  {id:'alex',  name:'Alex Chen',       ini:'AC', color:'#ef4444', lat:38.0538, lng:-78.4865, gait:73, loc:"Near O'Neills Pub",    batt:24},
  {id:'jordan',name:'Jordan Kim',      ini:'JK', color:'#f59e0b', lat:38.0528, lng:-78.4858, gait:87, loc:'Walking on Wertland St',batt:61},
  {id:'maya',  name:'Maya Rodriguez',  ini:'MR', color:'#10b981', lat:38.0542, lng:-78.4878, gait:15, loc:'At Boylan Heights',     batt:88},
  {id:'sam',   name:'Sam Taylor',      ini:'ST', color:'#3b82f6', lat:38.0545, lng:-78.4875, gait:41, loc:'Corner area',           batt:52},
];
const ME = {lat:38.0535, lng:-78.4870};
let map, markers = {};

function initMap(){
  map = L.map('map', {center:[ME.lat,ME.lng], zoom:16, zoomControl:false, attributionControl:false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {subdomains:'abcd', maxZoom:20}).addTo(map);

  // "You" marker
  L.marker([ME.lat,ME.lng], {icon: L.divIcon({
    html:`<div style="width:44px;height:44px;border-radius:50%;background:#355E3B;border:3px solid white;box-shadow:0 0 0 3px rgba(53,94,59,0.4),0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:white;font-family:Inter,sans-serif">S</div>`,
    className:'', iconSize:[44,44], iconAnchor:[22,22]
  })}).addTo(map).bindPopup('<b>Sophie (You)</b><br>Your location');

  L.circle([ME.lat,ME.lng], {radius:25, color:'#355E3B', fillColor:'#355E3B', fillOpacity:0.08, weight:1}).addTo(map);

  // Safe place marker
  L.marker([38.0520,-78.4892], {icon: L.divIcon({
    html:`<div style="width:36px;height:36px;border-radius:10px;background:#10b981;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px"></div>`,
    className:'', iconSize:[36,36], iconAnchor:[18,18]
  })}).addTo(map).bindPopup('<b> Safe Place</b><br>My Apartment, Rugby Road');

  FRIENDS.forEach(addMarker);
  renderChips();
  startSim();
  setTimeout(()=>toast('','Alex Chen — 73% alert','Tap their chip below to fly to their location'), 1000);
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
  markers[f.id] = L.marker([f.lat,f.lng], {icon}).addTo(map)
    .bindPopup(`<b>${f.name}</b><br>Gait: ${f.gait}%<br> ${f.loc}<br> ${f.batt}%`);
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

initMap();
