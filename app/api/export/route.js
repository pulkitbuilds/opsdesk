import{route,HttpError}from"@/lib/api.js";import{q}from"@/lib/db.js";export const dynamic="force-dynamic";
const c=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
// Streams all rows via keyset pagination (1000/batch): no row cap, constant memory.
export const GET=route(["lead"],async()=>{let last=0,sent=false;const enc=new TextEncoder();
const s=new ReadableStream({async pull(ctl){if(!sent){ctl.enqueue(enc.encode("ref,agency,tboh,title,intent,region,priority,status,owner,sla_due,themes,created_at\n"));sent=true;return}
const rows=await q(`SELECT * FROM tickets WHERE id>$1 ORDER BY id LIMIT 1000`,[last]);if(!rows.length)return ctl.close();last=rows[rows.length-1].id;
ctl.enqueue(enc.encode(rows.map(t=>[ "T-"+t.id,t.agency,t.tboh,t.title,t.intent,t.region,t.priority,t.status,t.owner,new Date(t.sla_due).toISOString(),t.themes.join("|"),new Date(t.created_at).toISOString()].map(c).join(",")).join("\n")+"\n"))}});
return new Response(s,{headers:{"Content-Type":"text/csv","Content-Disposition":'attachment; filename="opsdesk-export.csv"'}})});
