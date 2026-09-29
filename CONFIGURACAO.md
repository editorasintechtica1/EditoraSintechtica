# Editora Sintechtica — configuração

## 1. Criar o banco

No Supabase, abra **SQL Editor**, cole o conteúdo de `supabase/01_estrutura_editora.sql` e execute uma vez.

## 2. Conectar o GitHub ao Supabase

Em **Settings > Secrets and variables > Actions**, crie os segredos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use a URL do projeto e a chave pública `anon`. Nunca use a chave `service_role` no GitHub Pages.

## 3. Publicar

Em **Settings > Pages**, selecione **GitHub Actions**. Cada envio para a branch `main` fará uma nova publicação.

## 4. Inserir livros

Cadastre os títulos na tabela `books` pelo Table Editor do Supabase. O livro só aparece no site quando `published` estiver marcado como verdadeiro.

## 5. Atualizar o formulário oficial

Antes de publicar o site atualizado, execute no **SQL Editor** o arquivo `supabase/03_formulario_oficial_e_resumo_pdf.sql`.

Esse script adiciona a questão 22 (referências bibliográficas), registra separadamente as declarações das questões 24 a 27 e atualiza a política de inserção.

## 6. Consultar propostas

As novas propostas ficam na tabela `editorial_submissions`. Os originais ficam no bucket privado `editorial-submissions`, em **Storage**.

Visitantes podem enviar propostas e arquivos, mas não conseguem consultar, editar ou excluir os registros. Para baixar um original, entre no painel autenticado do Supabase e abra o bucket privado.

## Importante ao atualizar uma instalação existente

Execute novamente todo o arquivo `supabase/01_estrutura_editora.sql`. Ele cria a nova tabela, o bucket privado e as políticas necessárias sem apagar os registros anteriores.

## 7. Ativar a Área Administrativa

1. Execute `supabase/02_admin_e_email.sql` no SQL Editor.
2. Em **Authentication > Users**, crie a conta da pessoa que administrará as propostas.
3. Volte ao SQL Editor e execute o `insert` comentado no final de `02_admin_e_email.sql`, trocando `SEU_EMAIL_AQUI` pelo e-mail criado.
4. Publique novamente o site e acesse `/admin/`.

Somente usuários presentes em `editorial_admins` conseguem ler propostas, alterar status e gerar links temporários dos anexos.

## 8. Ativar notificações por e-mail

O envio ocorre em uma Supabase Edge Function; a chave do serviço de e-mail nunca vai para o GitHub Pages.

1. Crie uma conta no Resend e uma API Key.
2. No Supabase, abra **Edge Functions > Secrets** e cadastre:
   - `RESEND_API_KEY`: chave secreta do Resend;
   - `EDITORIAL_NOTIFICATION_EMAIL`: `editorasintechtica@animaeducacao.com.br`;
   - `EDITORIAL_FROM_EMAIL`: remetente autorizado, por exemplo `Editora Sintechtica <editorial@seudominio.com>`.
3. Publique **toda a pasta** `supabase/functions/notify-editorial-submission` com o nome `notify-editorial-submission`. A pasta contém o código e três imagens usadas no papel timbrado do PDF.

Durante o primeiro teste, o remetente padrão do Resend pode ser usado. Para produção, valide o domínio da editora e configure `EDITORIAL_FROM_EMAIL` com esse domínio.

O aviso envia dois anexos para `editorasintechtica@animaeducacao.com.br`:

1. resumo executivo em PDF, no papel timbrado, com as questões 7, 9, 11, 12, 13, 14, 16, 17 e 22;
2. cópia integral da obra em Word.

O título informado dentro da apresentação da obra é usado somente para identificar a submissão no painel e no assunto do e-mail; ele não aparece no resumo executivo. Para proteger a estabilidade do envio, a obra anexada está limitada a 20 MB; arquivos maiores permanecem armazenados na Área Administrativa.
