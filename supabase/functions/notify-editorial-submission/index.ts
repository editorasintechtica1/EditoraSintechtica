import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  const {protocol}=await req.json(); if(!/^SIN-\d{4}-[A-F0-9]{8}$/.test(protocol))throw new Error("Protocolo inválido");
  const supabaseUrl=Deno.env.get("SUPABASE_URL")!,serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,resendKey=Deno.env.get("RESEND_API_KEY")!,editorialEmail=Deno.env.get("EDITORIAL_NOTIFICATION_EMAIL")!,from=Deno.env.get("EDITORIAL_FROM_EMAIL")||"Editora Sintechtica <onboarding@resend.dev>";
  if(!resendKey||!editorialEmail)throw new Error("E-mail não configurado");
  const dbHeaders={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};
  const q=await fetch(`${supabaseUrl}/rest/v1/editorial_submissions?protocol=eq.${encodeURIComponent(protocol)}&select=*`,{headers:dbHeaders}); const rows=await q.json(); const item=rows?.[0];
  if(!item)throw new Error("Proposta não encontrada"); if(item.email_sent_at)return new Response(JSON.stringify({ok:true,alreadySent:true}),{headers:{...cors,"Content-Type":"application/json"}});
  const html=`<div style="font-family:Arial;color:#18242a;max-width:680px"><h1 style="color:#0b6b63">Nova proposta editorial</h1><p>Uma nova obra foi submetida à Editora Sintechtica.</p><table style="border-collapse:collapse;width:100%"><tr><td><b>Protocolo</b></td><td>${esc(item.protocol)}</td></tr><tr><td><b>Título</b></td><td>${esc(item.work_title)}</td></tr><tr><td><b>Proponente</b></td><td>${esc(item.author_name)}</td></tr><tr><td><b>E-mail</b></td><td>${esc(item.email)}</td></tr><tr><td><b>Instituição</b></td><td>${esc(item.institution)}</td></tr><tr><td><b>Tipo</b></td><td>${esc(item.work_type)}</td></tr></table><p>Acesse a Área Administrativa para consultar os dados completos e baixar os anexos.</p></div>`;
  const send=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[editorialEmail],subject:`Nova proposta editorial — ${item.protocol}`,html,reply_to:item.email})});
  if(!send.ok)throw new Error(`Falha no provedor de e-mail: ${await send.text()}`);
  await fetch(`${supabaseUrl}/rest/v1/editorial_submissions?protocol=eq.${encodeURIComponent(protocol)}`,{method:"PATCH",headers:{...dbHeaders,Prefer:"return=minimal"},body:JSON.stringify({email_sent_at:new Date().toISOString(),email_error:null})});
  return new Response(JSON.stringify({ok:true}),{headers:{...cors,"Content-Type":"application/json"}});
 }catch(e){return new Response(JSON.stringify({ok:false,error:e instanceof Error?e.message:"Erro interno"}),{status:400,headers:{...cors,"Content-Type":"application/json"}})}
});
