-- Livestreamhjälp v2: Ägare/Admin-roller.
-- Kör detta en gång i Supabase -> SQL Editor.

alter table public.admins add column if not exists role text;
update public.admins set role = 'admin' where role is null or role not in ('owner','admin');
alter table public.admins alter column role set default 'admin';
alter table public.admins alter column role set not null;

do $$
begin
  if not exists (select 1 from public.admins where role = 'owner') then
    update public.admins
    set role = 'owner'
    where user_id = (select user_id from public.admins order by user_id limit 1);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'admins_role_check') then
    alter table public.admins drop constraint admins_role_check;
  end if;
  alter table public.admins add constraint admins_role_check check (role in ('owner','admin'));
end $$;

create index if not exists admins_role_idx on public.admins(role);

-- Befintlig RLS kan vara kvar: alla admins får redigera innehåll enligt era nuvarande policies.
-- Hantering av andra admins sker server-side via Netlify Function och service-role-nyckeln.
