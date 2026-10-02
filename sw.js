const CACHE='bd1-rpg-v26';
const ASSETS=['./','./index.html','./game.html','./lobby.js','./lobby.css','./select_plate.webp','./char_mage.webp','./char_knight.webp','./char_tank.webp','./char_assassin.webp','./panel_mage.webp','./panel_knight.webp','./panel_tank.webp','./panel_assassin.webp','./style.css','./app.js','./game_clean.png','./question_panel.png','./icon_attack.png','./icon_coin.png','./manifest.webmanifest','./potion_hp.png','./potion_mana.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// rede primeiro (sempre pega a versão nova quando online); cache só como reserva offline
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))});
