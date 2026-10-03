const CACHE='bd1-rpg-v41';
const ASSETS=['./','./index.html','./game.html','./lobby.js','./lobby.css','./select_plate.webp','./char_mage.webp','./char_knight.webp','./char_tank.webp','./char_assassin.webp','./panel_mage.webp','./panel_knight.webp','./panel_tank.webp','./panel_assassin.webp','./style.css','./app.js','./anim.js','./mage.js','./mage2/e_0_0.png','./mage2/e_0_1.png','./mage2/e_0_11.png','./mage2/e_0_12.png','./mage2/e_0_13.png','./mage2/e_0_15.png','./mage2/e_0_16.png','./mage2/e_0_2.png','./mage2/e_0_20.png','./mage2/e_0_21.png','./mage2/e_0_22.png','./mage2/e_0_25.png','./mage2/e_0_29.png','./mage2/e_0_3.png','./mage2/e_0_4.png','./mage2/e_0_5.png','./mage2/e_0_6.png','./mage2/e_0_8.png','./mage2/e_1_0.png','./mage2/e_1_1.png','./mage2/e_1_12.png','./mage2/e_1_13.png','./mage2/e_1_16.png','./mage2/e_1_18.png','./mage2/e_1_2.png','./mage2/e_1_23.png','./mage2/e_1_26.png','./mage2/e_1_27.png','./mage2/e_1_3.png','./mage2/e_1_30.png','./mage2/e_1_32.png','./mage2/e_1_34.png','./mage2/e_1_38.png','./mage2/e_1_39.png','./mage2/e_1_4.png','./mage2/e_1_41.png','./mage2/e_1_42.png','./mage2/e_1_44.png','./mage2/e_1_46.png','./mage2/e_1_6.png','./mage2/e_1_9.png','./mage2/e_3_0.png','./mage2/e_3_1.png','./mage2/e_3_10.png','./mage2/e_3_11.png','./mage2/e_3_13.png','./mage2/e_3_14.png','./mage2/e_3_2.png','./mage2/e_3_3.png','./mage2/e_3_4.png','./mage2/e_3_5.png','./mage2/e_3_7.png','./mage2/e_3_8.png','./mage2/e_3_9.png','./mage2/e_4_0.png','./mage2/e_4_11.png','./mage2/e_4_13.png','./mage2/e_4_15.png','./mage2/e_4_18.png','./mage2/e_4_27.png','./mage2/e_4_28.png','./mage2/e_4_3.png','./mage2/e_4_35.png','./mage2/e_4_36.png','./mage2/e_4_41.png','./mage2/e_4_43.png','./mage2/e_4_45.png','./mage2/e_4_46.png','./mage2/e_4_50.png','./mage2/e_4_64.png','./mage2/e_4_73.png','./mage2/e_4_74.png','./mage2/e_4_77.png','./mage2/g_2_0.png','./mage2/g_2_1.png','./mage2/g_2_10.png','./mage2/g_2_2.png','./mage2/g_2_3.png','./mage2/g_2_4.png','./mage2/g_2_5.png','./mage2/g_2_6.png','./mage2/g_2_7.png','./mage2/g_2_8.png','./mage2/g_2_9.png','./mage2/meta.json','./mage2/p_0_0.png','./mage2/p_0_1.png','./mage2/p_0_2.png','./mage2/p_0_3.png','./mage2/p_0_4.png','./mage2/p_0_5.png','./mage2/p_0_6.png','./mage2/p_0_7.png','./mage2/p_0_8.png','./mage2/p_0_9.png','./mage2/p_1_0.png','./mage2/p_1_1.png','./mage2/p_1_10.png','./mage2/p_1_2.png','./mage2/p_1_3.png','./mage2/p_1_4.png','./mage2/p_1_5.png','./mage2/p_1_6.png','./mage2/p_1_7.png','./mage2/p_1_8.png','./mage2/p_1_9.png','./mage2/p_2_0.png','./mage2/p_2_1.png','./mage2/p_2_10.png','./mage2/p_2_2.png','./mage2/p_2_3.png','./mage2/p_2_4.png','./mage2/p_2_5.png','./mage2/p_2_6.png','./mage2/p_2_7.png','./mage2/p_2_8.png','./mage2/p_2_9.png','./mage2/p_3_0.png','./mage2/p_3_1.png','./mage2/p_3_2.png','./mage2/p_3_3.png','./mage2/p_3_4.png','./mage2/p_3_5.png','./mage2/p_3_6.png','./mage2/p_3_7.png','./mage2/p_3_8.png','./mage2/p_3_9.png','./mage2/p_4_0.png','./mage2/p_4_1.png','./mage2/p_4_2.png','./mage2/p_4_3.png','./mage2/p_4_4.png','./mage2/p_4_5.png','./mage2/p_4_6.png','./mage2/p_4_7.png','./mage2/p_4_8.png','./mage2/p_4_9.png','./anim/manifest.json','./spr_mage.webp','./spr_knight.webp','./spr_tank.webp','./spr_assassin.webp','./spr_boss.webp','./game_clean.png','./question_panel.png','./icon_attack.png','./icon_coin.png','./manifest.webmanifest','./potion_hp.png','./potion_mana.png'];
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
