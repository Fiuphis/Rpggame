const CACHE='bd1-rpg-v34';
const ASSETS=['./','./index.html','./game.html','./lobby.js','./lobby.css','./select_plate.webp','./char_mage.webp','./char_knight.webp','./char_tank.webp','./char_assassin.webp','./panel_mage.webp','./panel_knight.webp','./panel_tank.webp','./panel_assassin.webp','./style.css','./app.js','./anim.js','./puppet.js','./rig/mage_body.png','./rig/cleric_body.png','./spr_mage.webp','./spr_knight.webp','./spr_tank.webp','./spr_assassin.webp','./spr_boss.webp','./game_clean.png','./question_panel.png','./icon_attack.png','./icon_coin.png','./manifest.webmanifest','./potion_hp.png','./potion_mana.png'];
// Tudo em cache (abre instantâneo, até offline). Em segundo plano o SW confere a rede (requisição condicional, barata);
// se algum arquivo mudou, atualiza o cache e avisa a página, que recarrega sozinha (menu) ou mostra o aviso (jogo).
const keyOf=u=>{const x=new URL(u);return x.origin+x.pathname};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>fetch(a,{cache:'reload'}).then(r=>r.ok&&c.put(keyOf(new URL(a,self.location)),r)).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function notify(){const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>c.postMessage({type:'updated'}))}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET'||!req.url.startsWith(self.location.origin))return;
  const key=keyOf(req.url);
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE), cached=await cache.match(key);
    const net=fetch(req.url,{cache:'no-cache'}).then(async r=>{
      if(r.ok){
        const sig=x=>x&&(x.headers.get('etag')||x.headers.get('last-modified')||x.headers.get('content-length'));
        const changed=cached&&sig(cached)&&sig(r)&&sig(cached)!==sig(r);
        await cache.put(key,r.clone());
        if(changed)notify();
      }
      return r;
    }).catch(()=>null);
    if(cached){e.waitUntil(net);return cached}
    return (await net)||Response.error();
  })());
});
