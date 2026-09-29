# Atualização do formulário e do resumo em PDF

Siga esta ordem. Publicar apenas o site sem atualizar o banco e a Edge Function deixará o envio quebrado.

## 1. Atualizar o banco

No Supabase, abra **SQL Editor**, copie todo o conteúdo de:

`supabase/03_formulario_oficial_e_resumo_pdf.sql`

Clique em **Run**.

## 2. Atualizar a Edge Function

Abra **Edge Functions > notify-editorial-submission > Code** e substitua a função pelos quatro arquivos da pasta:

`supabase/functions/notify-editorial-submission/`

- `index.ts`
- `faixa-superior.png`
- `logo-anima.png`
- `logo-editora.png`

Depois clique em **Deploy updates**.

Se o editor do painel não aceitar os arquivos de imagem, faça o deploy da pasta com a Supabase CLI:

```bash
supabase functions deploy notify-editorial-submission
```

## 3. Publicar o site

Envie os arquivos atualizados para o repositório do GitHub. O GitHub Pages publicará a nova versão pelo workflow já configurado.

## 4. Teste obrigatório

Faça uma submissão de teste preenchendo as 27 questões e anexando um Word pequeno. Verifique se o e-mail recebido contém exatamente:

1. `resumo-executivo-SIN-....pdf`, no papel timbrado;
2. `obra.docx`, com a cópia integral do livro.

No PDF, confira as questões 7, 9, 11, 12, 13, 14, 16, 17 e 22. A questão 15 e o título da obra não devem aparecer.

