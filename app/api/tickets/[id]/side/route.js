import{route,json,body,str,STAFF,HttpError}from"@/lib/api.js";import{q,addEvent}from"@/lib/db.js";import{loadTicket}from"@/lib/tickets.js";
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const POST=route(STAFF,async(req,u,{params})=>{const r=await loadTicket(params.id,u),b=await body(req);
if(b.threadId){const[th]=await q(`SELECT id FROM side_threads WHERE id=$1 AND ticket_id=$2`,[b.threadId,r.id]);if(!th)throw new HttpError(404,"Thread not found");if(!["ext","int"].includes(b.kind))throw new HttpError(400,"kind must be ext or int");
await q(`INSERT INTO side_msgs(thread_id,kind,author,body) VALUES($1,$2,$3,$4)`,[th.id,b.kind,u.name,str(b.body,4000,"body")]);await addEvent(r.id,u.name,b.kind==="int"?"Internal note added":"External reply sent");return json({ok:true},201)}
const subject=str(b.subject,200,"subject");const rec=Array.isArray(b.recipients)?[...new Set(b.recipients.map(x=>String(x).trim().toLowerCase()))]:[];
if(!rec.length||rec.length>20||!rec.every(x=>EMAIL.test(x)&&x.length<=200))throw new HttpError(400,"Provide 1–20 valid recipient emails");
await q(`INSERT INTO side_threads(ticket_id,subject,recipients,created_by) VALUES($1,$2,$3,$4)`,[r.id,subject,rec,u.name]);await addEvent(r.id,u.name,"Side thread '"+subject+"' started → "+rec.join(", "));return json({ok:true},201)});
