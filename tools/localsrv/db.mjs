// Banco local de teste: PGlite + o mesmo schema/funcoes do Supabase (supabase/local/schema.sql) + migracao 10 (match).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const QUESTIONS = JSON.parse(readFileSync(join(here, '..', '..', 'data/perguntas.json'), 'utf8'));
export async function makeDb() {
  const db = new PGlite();
  await db.exec(readFileSync(join(here, '..', '..', 'supabase', 'local', 'bootstrap.sql'), 'utf8'));
  await db.exec(readFileSync(join(here, '..', '..', 'supabase', 'local', 'schema.sql'), 'utf8'));
  // migracoes novas (a partir da 12) por cima do schema exportado em 11
  const mdir = join(here, '..', '..', 'supabase', 'migrations');
  for (const f of readdirSync(mdir).filter(f => /^\d+_.*\.sql$/.test(f) && parseInt(f) >= 12).sort()) await db.exec(readFileSync(join(mdir, f), 'utf8'));
  await db.exec(`drop function public.cast_action(uuid,text,text,text); drop function public._new_round(uuid,uuid,int); drop function public.advance_round(uuid,int);`);   // no Supabase real as antigas ficam so revogadas
  await db.exec(`grant usage on schema public to anon, authenticated, service_role; grant all on all tables in schema public to authenticated, service_role; grant all on all sequences in schema public to authenticated, service_role; grant execute on all functions in schema public to authenticated, service_role;`);
  // perguntas
  for (const q of QUESTIONS) {
    const r = await db.query(`insert into public.questions (rank, text, options) values ($1, $2, $3::jsonb) returning id`, [q.difficulty, q.text, JSON.stringify(q.answers)]);
    await db.query(`insert into public.question_keys (question_id, correct) values ($1, $2)`, [r.rows[0].id, q.correct]);
  }
  return db;
}
// executa como um usuario (papel authenticated + claims), como o PostgREST faz; devolve o resultado em JSON
export async function asUser(db, uid, fn, args = {}) {
  const names = Object.keys(args);
  const vals = names.map(n => (args[n] !== null && typeof args[n] === 'object') ? JSON.stringify(args[n]) : args[n]);
  const ph = names.map((n, i) => `${n} => $${i + 1}${(args[n] !== null && typeof args[n] === 'object') ? '::jsonb' : ''}`).join(', ');
  return db.transaction(async tx => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: true })]);
    await tx.exec('set local role authenticated');
    const r = await tx.query(`select to_jsonb(public.${fn}(${ph})) as r`, vals);
    return r.rows[0].r;
  });
}
