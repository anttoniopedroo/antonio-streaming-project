// Valida supabase/setup.sql num Postgres real (PGlite), imitando os papéis do Supabase.
// Rode com: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const setup = readFileSync(new URL('../supabase/setup.sql', import.meta.url), 'utf-8');
const db = new PGlite();
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'OK  ' : 'FALHA'} ${msg}`); if (!cond) fails++; };
const tryQ = async (sql) => { try { return { rows: (await db.query(sql)).rows }; } catch (e) { return { error: e.message }; } };

// --- Ambiente parecido com o Supabase ---
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  grant usage on schema auth to supabase_auth_admin;
  grant insert, delete on auth.users to supabase_auth_admin;
  grant usage on schema public to anon, authenticated, service_role;
  -- No Supabase, tabelas novas em public recebem ALL para estes papéis:
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`);

// --- Roda o setup duas vezes (precisa ser idempotente) ---
await db.exec(setup);
const second = await db.exec(setup).then(() => ({}), (e) => ({ error: e.message }));
ok(!second.error, `setup.sql pode rodar 2x sem erro ${second.error ?? ''}`);

// --- Trigger cria perfil bloqueado por padrão ---
// Quem cria usuários no Supabase é o serviço de auth (não é superusuário).
await db.exec(`set role supabase_auth_admin`);
await db.exec(`insert into auth.users (email) values ('ana@teste.com'), ('bia@teste.com');`);
await db.exec(`reset role`);
const { rows: profs } = await db.query(`select email, ativo, trocar_senha from public.profiles order by email`);
ok(profs.length === 2, 'trigger criou 1 perfil por usuário');
ok(profs.every((p) => p.ativo === false && p.trocar_senha === true), 'perfil nasce bloqueado e com troca de senha pendente');

// --- Papéis do navegador (anon / authenticated) não enxergam nem alteram nada ---
for (const role of ['anon', 'authenticated']) {
  await db.exec(`set role ${role}`);
  const sel = await tryQ(`select * from public.profiles`);
  ok(sel.error || sel.rows.length === 0, `${role}: SELECT em profiles não retorna linhas`);
  const logs = await tryQ(`select * from public.access_logs`);
  ok(logs.error || logs.rows.length === 0, `${role}: SELECT em access_logs não retorna linhas`);
  const upd = await tryQ(`update public.profiles set ativo = true returning id`);
  ok(upd.error || upd.rows.length === 0, `${role}: UPDATE em profiles (tentar se liberar) não afeta nada`);
  const ins = await tryQ(`insert into public.access_logs (evento) values ('falso')`);
  ok(Boolean(ins.error), `${role}: INSERT em access_logs bloqueado`);
  const del = await tryQ(`delete from public.profiles returning id`);
  ok(del.error || del.rows.length === 0, `${role}: DELETE em profiles não afeta nada`);
  const rpc = await tryQ(`select public.handle_new_user()`);
  ok(Boolean(rpc.error), `${role}: chamar handle_new_user() direto falha (${(rpc.error ?? '').slice(0, 60)})`);
  await db.exec(`reset role`);
}

// --- Back-end (service_role) controla tudo ---
await db.exec(`set role service_role`);
const s = await tryQ(`select count(*)::int as n from public.profiles`);
ok(s.rows?.[0]?.n === 2, 'service_role: lê os perfis');
const u = await tryQ(`update public.profiles set ativo = true where email = 'ana@teste.com' returning email`);
ok(u.rows?.length === 1, 'service_role: libera um usuário');
const l = await tryQ(`insert into public.access_logs (email, evento) values ('ana@teste.com', 'login') returning id`);
ok(l.rows?.length === 1, 'service_role: grava registro de acesso');
await db.exec(`reset role`);

// --- Apagar usuário apaga o perfil e mantém o registro ---
await db.exec(`delete from auth.users where email = 'ana@teste.com'`);
const after = await db.query(`select (select count(*)::int from public.profiles) as p, (select count(*)::int from public.access_logs) as l`);
ok(after.rows[0].p === 1 && after.rows[0].l === 1, 'apagar usuário remove o perfil e preserva o histórico');

// --- Privilégios de EXECUTE na função do trigger ---
const ex = await db.query(`
  select r.rolname, has_function_privilege(r.rolname, 'public.handle_new_user()', 'execute') as pode
  from pg_roles r where r.rolname in ('anon','authenticated')`);
console.log('info: EXECUTE em handle_new_user():', ex.rows.map((r) => `${r.rolname}=${r.pode}`).join(', '));

console.log(fails ? `\n${fails} FALHA(S)` : '\nTodos os testes passaram.');
process.exit(fails ? 1 : 0);
