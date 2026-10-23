-- =========================================================
--  ANTONIO STREAMING PROJECT — controle de acesso
-- =========================================================
--  Rode este arquivo UMA vez no Supabase:
--  painel do projeto > SQL Editor > New query > cole tudo > Run
-- =========================================================

-- Perfis: uma linha por usuário. É aqui que você controla o acesso.
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text,
  nome           text,                                -- nome exibido no site (opcional)
  ativo          boolean     not null default false,  -- false = bloqueado (toda conta nasce bloqueada)
  expira_em      timestamptz,                         -- vazio = sem data de expiração
  trocar_senha   boolean     not null default true,   -- true = precisa criar nova senha no próximo login
  ultimo_acesso  timestamptz,
  criado_em      timestamptz not null default now()
);

-- Registro de acessos: login, logout, troca de senha, bloqueios e expirações.
create table if not exists public.access_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  email       text,
  evento      text        not null,
  ip          text,
  user_agent  text,
  criado_em   timestamptz not null default now()
);

create index if not exists access_logs_criado_em_idx on public.access_logs (criado_em desc);

-- Segurança: RLS ligado e SEM políticas = ninguém acessa estas tabelas pelo navegador.
-- Só o back-end do projeto (com a chave secreta) lê e escreve aqui.
alter table public.profiles    enable row level security;
alter table public.access_logs enable row level security;

-- Cria o perfil automaticamente quando você adiciona um usuário no painel.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria perfis para usuários que já existiam antes deste script.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
