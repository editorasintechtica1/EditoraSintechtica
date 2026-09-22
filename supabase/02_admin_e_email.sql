-- Execute depois de 01_estrutura_editora.sql.
alter table public.editorial_submissions add column if not exists email_sent_at timestamptz;
alter table public.editorial_submissions add column if not exists email_error text;

create table if not exists public.editorial_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.editorial_admins enable row level security;

create or replace function public.is_editorial_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.editorial_admins where user_id=auth.uid()) $$;
revoke all on function public.is_editorial_admin() from public;
grant execute on function public.is_editorial_admin() to authenticated;

drop policy if exists "equipe_editorial_leitura" on public.editorial_submissions;
create policy "equipe_editorial_leitura" on public.editorial_submissions for select to authenticated using (public.is_editorial_admin());
drop policy if exists "equipe_editorial_atualizacao" on public.editorial_submissions;
create policy "equipe_editorial_atualizacao" on public.editorial_submissions for update to authenticated using (public.is_editorial_admin()) with check (public.is_editorial_admin());
grant select, update on public.editorial_submissions to authenticated;

drop policy if exists "equipe_editorial_download" on storage.objects;
create policy "equipe_editorial_download" on storage.objects for select to authenticated using (bucket_id='editorial-submissions' and public.is_editorial_admin());

-- Depois de criar o usuário em Authentication > Users, troque o e-mail abaixo e execute:
-- insert into public.editorial_admins(user_id,email)
-- select id,email from auth.users where email='SEU_EMAIL_AQUI'
-- on conflict (user_id) do update set email=excluded.email;
