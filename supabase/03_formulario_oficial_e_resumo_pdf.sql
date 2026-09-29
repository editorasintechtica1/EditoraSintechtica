-- Execute uma única vez no SQL Editor antes de publicar o site atualizado.
-- Alinha a tabela ao formulário oficial (questões 22 e 24 a 27).

alter table public.editorial_submissions
  add column if not exists bibliographic_references text not null default '',
  add column if not exists authorship_confirmed boolean not null default false,
  add column if not exists publication_authorized boolean not null default false,
  add column if not exists image_rights_confirmed boolean not null default false,
  add column if not exists ai_use_confirmed boolean not null default false;

-- O formulário oficial usa declarações eletrônicas e não exige um termo separado.
alter table public.editorial_submissions
  alter column rights_file_path set default '';

drop policy if exists "propostas_editoriais_insercao" on public.editorial_submissions;
create policy "propostas_editoriais_insercao"
on public.editorial_submissions
for insert
to anon
with check (
  scope_confirmed = true
  and rights_confirmed = true
  and authorship_confirmed = true
  and publication_authorized = true
  and image_rights_confirmed = true
  and ai_use_confirmed = true
  and status = 'recebida'
);

