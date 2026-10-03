# Simulador Monte-Carlo do combate (espelha as regras de app.js). Uso: python3 tools/sim_boss.py [N]
import random, sys, statistics as st
P = dict(boss_hp=650, prep=.2, prep_mult=1.5, tele=1/6, tele_from=4, tele_dmg=20, stun=1.25, thrust=24, enr_aoe=2, new=True, hard_acc=-.2, easy_acc=.12)
DIFF = {1:(18,3), 2:(32,5), 3:(50,9)}
SK = {
 'mage':[('mana_atk','atk',10,0,1),('elem_atk','atk',20,1,1.3),('mana_def','def',10,0,.5),('elem_def','def',20,1,.5),('dodge','dodge',0,1,0)],
 'knight':[('atk','atk',0,0,1),('heavy','atk',15,1,1.5),('def','def',0,0,.5),('dodge','dodge',0,1,0)],
 'tank':[('atk','atk',0,0,1),('super','atk',20,3,2),('guard','util',20,2,0),('def','def',0,0,.5),('dodge','dodge',0,1,0)],
 'assassin':[('atk','atk',0,0,1),('holy_atk','atk',20,1,1.5),('def','def',0,0,.5),('holy_def','def',20,1,.75),('dodge','dodge',0,1,0)],
}
ORDER = ['mage','knight','tank','assassin']
def game(acc, rng, policy, p=P):
    hp = {k:100 for k in ORDER}; mp = {k:100 for k in ORDER}; cd = {k:{} for k in ORDER}
    boss = p['boss_hp']; rage = 0; hardNext = False; since = 0; ult = {k:False for k in ORDER}
    bh = bers = tired = taunt = 0; burn = 0; prepNext = False; dazed = False; rnd = 0; tcd = 0; ecd = 0; mcd = 0; falls = {k:0 for k in ORDER}
    def alive(): return [k for k in ORDER if hp[k] > 0]
    def hit(k, d):
        nonlocal hp
        if hp[k] <= 0: return
        hp[k] -= d
        if hp[k] <= 0: hp[k] = 0; falls[k] += 1
    while rnd < 80:
        rnd += 1; dz = dazed; dazed = False; enrag = hardNext; empow = prepNext and not enrag; warn = False; tele = None
        if not dz and not empow and not enrag and p['new'] and rnd >= 2 and rng.random() < p['prep']: warn = True
        if p['new'] and not dz and not empow and not warn and not enrag and rnd > p['tele_from'] and tcd <= 0 and rng.random() < p['tele']:
            tele = min(alive(), key=lambda k: hp[k]); tcd = 2
        if warn: prepNext = True
        since += 1
        if enrag or since >= 5: d = 3
        else: d = 1 if rng.random() < .55 else 2
        if enrag: rage = 0; hardNext = False
        if d == 3: since = 0
        dmg_b, aoe = DIFF[d]
        base = 0 if warn else round(dmg_b * (p['prep_mult'] if empow else 1))
        a = acc + (p['easy_acc'] if d == 1 else p['hard_acc'] if d == 3 else 0)
        ok = {k: rng.random() < (a if (policy == 'smart' or True) else .6) for k in ORDER}
        if d == 3:
            for k in ORDER:
                if k == 'mage' and mcd > 0: mcd -= 1; continue
                if ok[k]: ult[k] = True
        # escolha de ações
        act = {}
        for k in alive():
            # ult
            if ult[k] and (policy == 'smart' or rng.random() < .5):
                if k == 'assassin':
                    tg = [h for h in ORDER if hp[h] <= 0] or [h for h in ORDER if hp[h] < 70]
                    if tg: t = tg[0]; (hp.__setitem__(t, 35) if hp[t] <= 0 else hp.__setitem__(t, min(100, hp[t] + 25))); ult[k] = False
                else:
                    ult[k] = False
                    if k == 'mage': boss -= 49; mcd = 1
                    if k == 'knight': bers = 2; tired = 0
                    if k == 'tank': taunt = 2
            av = [s for s in SK[k] if cd[k].get(s[0], 0) <= 0 and mp[k] >= s[2]]
            if policy == 'smart':
                if ok[k] or (k == 'knight' and bers > 0):
                    atks = [s for s in av if s[1] == 'atk']; s = max(atks, key=lambda s: s[4] * (1.5 if s[0] == 'elem_atk' else 1)) if atks else None
                    if s is None: s = ([x for x in av if x[1] != 'util'] or [None])[0]
                    # tanque guarda o mais fraco às vezes
                else:
                    dd = [s for s in av if s[1] == 'dodge']; df = [s for s in av if s[1] == 'def']
                    if tele == k and dd: s = dd[0]
                    elif dd and rng.random() < .6: s = dd[0]
                    elif df: s = max(df, key=lambda s: s[4])
                    elif dd: s = dd[0]
                    else: s = av[0] if av else None
            else:
                c_ = [x for x in av if x[1] != 'util'] or av; s = rng.choice(c_) if c_ else None
            act[k] = s if s else ('none','none',0,0,0)
        guard = None
        if policy == 'smart' and 'tank' in act and ok['tank'] is False and False: pass
        # teleporte
        stun = dz
        if tele and hp[tele] > 0:
            s = act.get(tele)
            if s and s[1] == 'dodge': stun = True
            else: hit(tele, round(p['tele_dmg'] * (1 - (s[4] if s and s[1] == 'def' else 0))))
        # resolução
        bossdmg_mult = (p['stun'] if stun else 1)
        for k in [x for x in ORDER if x in act]:
            if hp[k] <= 0: continue
            s = act[k]; mp[k] -= s[2]
            if s[2] or s[3]: pass
            hurt = 0; dealt = 0
            if s[1] == 'none':
                if not ok[k]: hurt = base
            elif s[1] == 'atk':
                if ok[k] or (k == 'knight' and bers > 0):
                    dealt = 14 * s[4]
                    if s[0] == 'elem_atk':
                        if policy == 'smart': dealt *= 1.5; burn = 2
                        else:
                            e = rng.random()
                            if e < .25: dealt *= 1.5; burn = 2
                            elif e < .75: dealt = 0
                    if k == 'tank' and s[0] == 'super': dazed = True
                    if k == 'knight' and bers > 0: dealt *= 1.5
                    if k == 'mage' and bh: dealt *= 3
                if not ok[k]: hurt = base
            elif s[1] == 'def':
                if ok[k]: rage = min(5, rage + 5)
                else: hurt = round(base * (1 - s[4]))
            elif s[1] == 'dodge':
                if ok[k]: rage = min(5, rage + 5)
                else: rage = min(5, rage + 1)
            if dealt: boss -= round(dealt * bossdmg_mult)
            if hurt:
                t = k; dm = hurt
                if hp['tank'] > 0 and taunt > 0: t = 'tank'; dm = round(dm * .5)
                if t == 'knight': dm = round(dm * (.5 if bers > 0 else 1.5 if tired > 0 else 1))
                hit(t, dm)
            if boss <= 0: return True, rnd, falls
            if not alive(): return False, rnd, falls
        # estocada
        if p['new'] and hp['tank'] > 0 and taunt > 0 and ecd <= 0 and not dz:
            c = [k for k in alive() if k != 'tank']
            if c:
                ecd = 3
                t = rng.choice(c); s = act.get(t)
                if not (s and s[1] == 'dodge'): hit(t, round(p['thrust'] * (1 - (s[4] if s and s[1] == 'def' else 0))))
        # onda
        ao = aoe + (p['enr_aoe'] if (enrag and p['new']) else 0)
        for k in alive():
            hit(k, round(ao / 2) if (taunt > 0 and k != 'tank' and hp['tank'] > 0) else ao)
        if not alive(): return False, rnd, falls
        if burn > 0: burn -= 1; boss -= 3.5
        if boss <= 0: return True, rnd, falls
        bh = max(0, bh - 1); tcd = max(0, tcd - 1); ecd = max(0, ecd - 1)
        if bers > 0:
            bers -= 1
            if bers == 0: tired = 1
        elif tired > 0: tired -= 1
        if taunt > 0: taunt -= 1
        for k in ORDER:
            for key in list(cd[k]): cd[k][key] = max(0, cd[k][key] - 1)
            if k in act and act[k][3] > 0: cd[k][act[k][0]] = act[k][3]
        if empow: prepNext = False
        if rage >= 5: hardNext = True
    return False, rnd, falls
def run(acc, n, policy, p=P, seed=1):
    rng = random.Random(seed); w = 0; rs = []; fl = {k:0 for k in ORDER}; wr = []
    for _ in range(n):
        r = game(acc, rng, policy, p); w += r[0]; rs.append(r[1]); [fl.__setitem__(k, fl[k] + r[2][k]) for k in ORDER]
        if r[0]: wr.append(r[1])
    return w / n, st.mean(rs), {k: fl[k] / n for k in ORDER}
if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    for label, pp in (('SEM habilidades novas', {**P, 'new': False}), ('COM habilidades novas', P)):
        print('==', label, 'boss_hp', pp['boss_hp'])
        for pol in ('smart', 'random'):
            for acc in (.4, .6, .8):
                w, r, f = run(acc, n, pol, pp)
                print(f'{pol:6} acc {int(acc*100)}%  vitória {w*100:5.1f}%  rodadas {r:5.1f}  quedas/herói ' + ' '.join(f'{k[:3]}:{v:.2f}' for k, v in f.items()))
