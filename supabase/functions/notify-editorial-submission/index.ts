import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const A4 = { width: 595.28, height: 841.89 };
const COLOR = {
  teal: rgb(0, 0.50, 0.47), tealDark: rgb(0.04, 0.37, 0.34),
  tealPale: rgb(0.91, 0.95, 0.94), ink: rgb(0.09, 0.15, 0.16),
  gray: rgb(0.40, 0.46, 0.48), line: rgb(0.85, 0.83, 0.80),
  beige: rgb(0.96, 0.95, 0.92), white: rgb(1, 1, 1),
};
type Submission = Record<string, string | number | boolean | null>;

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

const cleanPdfText = (value: unknown) => String(value ?? "Não informado")
  .replaceAll("\t", " ").replace(/[\u2010-\u2015]/g, "-")
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  }
  return btoa(binary);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of cleanPdfText(text).split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = words.shift()!;
    for (const word of words) {
      const candidate = `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

async function buildExecutiveSummary(item: Submission) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Resumo executivo - ${item.protocol}`);
  pdf.setAuthor("Editora Sintechtica");
  pdf.setSubject("Resumo executivo para avaliação editorial");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const [stripBytes, animaBytes, editorBytes] = await Promise.all([
    Deno.readFile(new URL("./faixa-superior.png", import.meta.url)),
    Deno.readFile(new URL("./logo-anima.png", import.meta.url)),
    Deno.readFile(new URL("./logo-editora.png", import.meta.url)),
  ]);
  const strip = await pdf.embedPng(stripBytes);
  const anima = await pdf.embedPng(animaBytes);
  const editor = await pdf.embedPng(editorBytes);
  let page: PDFPage;
  let y = 0;
  let pageNumber = 0;

  const drawHeaderFooter = (target: PDFPage) => {
    target.drawImage(strip, { x: 0, y: A4.height - 17, width: A4.width, height: 14 });
    target.drawImage(anima, { x: (A4.width - 100) / 2, y: A4.height - 91, width: 100, height: 70 });
    const brand = "EDITORA SINTECHTICA";
    target.drawText(brand, { x: (A4.width - bold.widthOfTextAtSize(brand, 9.5)) / 2, y: A4.height - 108, size: 9.5, font: bold, color: rgb(0.04, 0.58, 0.78) });
    target.drawLine({ start: { x: 55, y: 47 }, end: { x: A4.width - 55, y: 47 }, thickness: 0.8, color: rgb(0.04, 0.65, 0.82) });
    target.drawImage(editor, { x: 55, y: 14, width: 105, height: 28.5 });
    target.drawText("EDITORA SINTECHTICA", { x: 435, y: 29, size: 7.2, font: bold, color: rgb(0.08, 0.20, 0.25) });
    target.drawText("ANIMA EDUCACAO", { x: 458, y: 19, size: 7.2, font: bold, color: rgb(0.08, 0.20, 0.25) });
    target.drawText(`PAGINA ${pageNumber}`, { x: 493, y: 8, size: 6.8, font: regular, color: COLOR.gray });
  };
  const newPage = () => { page = pdf.addPage([A4.width, A4.height]); pageNumber += 1; drawHeaderFooter(page); y = A4.height - 135; };
  const ensure = (needed: number) => { if (y - needed < 62) newPage(); };

  const drawCard = (x: number, width: number, label: string, value: unknown) => {
    const lines = wrapText(String(value || "Não informado"), regular, 9.2, width - 22);
    const height = Math.max(67, 31 + lines.length * 12);
    page.drawRectangle({ x, y: y - height, width, height, color: COLOR.beige, borderColor: COLOR.line, borderWidth: 0.7 });
    page.drawText(cleanPdfText(label).toUpperCase(), { x: x + 11, y: y - 18, size: 7.6, font: bold, color: COLOR.teal });
    let lineY = y - 36;
    for (const line of lines) { page.drawText(line, { x: x + 11, y: lineY, size: 9.2, font: regular, color: COLOR.ink }); lineY -= 12; }
    return height;
  };
  const drawSectionHeader = (number: number, label: string, continued = false) => {
    ensure(58);
    page.drawRectangle({ x: 55, y: y - 32, width: 39, height: 32, color: COLOR.teal });
    page.drawRectangle({ x: 94, y: y - 32, width: A4.width - 149, height: 32, color: COLOR.tealPale });
    const n = String(number);
    page.drawText(n, { x: 74 - bold.widthOfTextAtSize(n, 10) / 2, y: y - 20, size: 10, font: bold, color: COLOR.white });
    page.drawText(`${cleanPdfText(label).toUpperCase()}${continued ? " - CONTINUACAO" : ""}`, { x: 105, y: y - 20, size: 8.7, font: bold, color: COLOR.tealDark });
    y -= 43;
  };
  const drawSection = (number: number, label: string, value: unknown) => {
    drawSectionHeader(number, label);
    for (const line of wrapText(String(value || "Não informado"), regular, 9.3, A4.width - 110)) {
      if (y < 76) { newPage(); drawSectionHeader(number, label, true); }
      if (line) page.drawText(line, { x: 55, y, size: 9.3, font: regular, color: COLOR.ink });
      y -= line ? 12.3 : 7;
    }
    y -= 13;
  };

  newPage();
  page.drawText("GESTAO EDITORIAL  |  RESUMO EXECUTIVO", { x: 55, y, size: 9.5, font: bold, color: COLOR.teal });
  y -= 23;
  page.drawText("Sintese para avaliacao editorial", { x: 55, y, size: 11.5, font: regular, color: COLOR.gray });
  y -= 31;
  const cardGap = 10;
  const cardWidth = (A4.width - 110 - cardGap) / 2;
  const h1 = drawCard(55, cardWidth, "Questão 9 · Tipo de obra", item.work_type);
  const h2 = drawCard(55 + cardWidth + cardGap, cardWidth, "Questão 7 · Área do conhecimento (CINE)", String(item.cine_areas || "Não informado").replaceAll("|", ", "));
  y -= Math.max(h1, h2) + 20;
  page.drawText("INFORMACOES DA PROPOSTA", { x: 55, y, size: 8.5, font: bold, color: COLOR.gray });
  y -= 15;
  drawSection(11, "Relevância", item.relevance);
  drawSection(12, "Originalidade e contribuição", item.originality);
  drawSection(13, "Potencial de alcance", item.reach);
  drawSection(14, "Pertinência para o acervo", item.collection_fit);
  drawSection(16, "Descrição do sumário", item.table_of_contents);
  drawSection(17, "Público-alvo", String(item.audiences || "").replaceAll("|", ", "));
  drawSection(22, "Referências bibliográficas", item.bibliographic_references);
  ensure(28);
  page.drawText(`Protocolo: ${cleanPdfText(item.protocol)}`, { x: 55, y, size: 7.8, font: italic, color: COLOR.gray });
  return new Uint8Array(await pdf.save());
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { protocol } = await request.json();
    if (!/^SIN-\d{4}-[A-F0-9]{8}$/.test(protocol)) throw new Error("Protocolo inválido");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const editorialEmail = Deno.env.get("EDITORIAL_NOTIFICATION_EMAIL") || "editorasintechtica@animaeducacao.com.br";
    const from = Deno.env.get("EDITORIAL_FROM_EMAIL") || "Editora Sintechtica <onboarding@resend.dev>";
    if (!resendKey || !editorialEmail) throw new Error("E-mail não configurado");
    const databaseHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const query = await fetch(`${supabaseUrl}/rest/v1/editorial_submissions?protocol=eq.${encodeURIComponent(protocol)}&select=*`, { headers: databaseHeaders });
    const rows = await query.json();
    const item = rows?.[0] as Submission | undefined;
    if (!item) throw new Error("Proposta não encontrada");
    if (item.email_sent_at) return new Response(JSON.stringify({ ok: true, alreadySent: true }), { headers: { ...cors, "Content-Type": "application/json" } });

    const filePath = String(item.manuscript_path).split("/").map(encodeURIComponent).join("/");
    const fileResponse = await fetch(`${supabaseUrl}/storage/v1/object/authenticated/editorial-submissions/${filePath}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
    if (!fileResponse.ok) throw new Error("Não foi possível recuperar o anexo da obra");
    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    if (fileBytes.byteLength > 20 * 1024 * 1024) throw new Error("A obra excede 20 MB e não pode ser enviada como anexo de e-mail");
    const summaryBytes = await buildExecutiveSummary(item);
    const bookFileName = String(item.manuscript_path).split("/").pop() || "obra.docx";
    const summaryFileName = `resumo-executivo-${item.protocol}.pdf`;
    const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f1eb;padding:24px;font-family:Arial,sans-serif;color:#172529"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:640px;background:#fff;border:1px solid #d9d3c9"><tr><td style="background:#172529;color:#fff;padding:20px 26px;font-size:18px;font-weight:700">EDITORA SINTECHTICA</td></tr><tr><td style="background:#087f78;color:#fff;padding:10px 26px;font-size:11px;letter-spacing:1px;font-weight:700">NOVA SUBMISSÃO EDITORIAL</td></tr><tr><td style="padding:28px 26px"><p style="margin:0 0 15px;font-size:17px;font-weight:700">Proposta recebida para avaliação</p><p style="margin:0 0 8px;line-height:1.6"><strong>Protocolo:</strong> ${esc(item.protocol)}</p><p style="margin:0 0 8px;line-height:1.6"><strong>Obra:</strong> ${esc(item.work_title)}</p><p style="margin:18px 0 0;line-height:1.6;color:#526064">Este e-mail contém o resumo executivo em PDF, no papel timbrado da Editora Sintechtica, e uma cópia integral da obra.</p></td></tr><tr><td style="background:#e7f2ef;padding:15px 26px;color:#075e57;font-size:12px;font-weight:700">2 ANEXOS: RESUMO EXECUTIVO + OBRA</td></tr></table></td></tr></table></body></html>`;
    const sendEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [editorialEmail], subject: `Nova submissão editorial — ${item.protocol}`, html, reply_to: item.email,
        attachments: [{ filename: summaryFileName, content: toBase64(summaryBytes) }, { filename: bookFileName, content: toBase64(fileBytes) }] }),
    });
    if (!sendEmail.ok) throw new Error(`Falha no provedor de e-mail: ${await sendEmail.text()}`);
    await fetch(`${supabaseUrl}/rest/v1/editorial_submissions?protocol=eq.${encodeURIComponent(protocol)}`, {
      method: "PATCH", headers: { ...databaseHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ email_sent_at: new Date().toISOString(), email_error: null }),
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Erro interno" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
