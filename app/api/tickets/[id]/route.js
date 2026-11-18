import{route,json,body,str,STAFF,OPS,HttpError}from"@/lib/api.js";import{q,SELECT,present,addEvent}from"@/lib/db.js";import{STATUSES,PRIORITIES,slaDue}from"@/lib/domain.js";import{loadTicket,routeTicket}from"@/lib/tickets.js";export const dynamic="force-dynamic";
export const GET=route(null,async(req,u,{params})=>{const r=await loadTicket(params.id,u);const staff=u.role!=="req";
const linked=await q(`${SELECT} WHERE t.id<>$1 AND (t.tboh=$2 OR (t.agency=$3 AND t.intent=$4)) ${u.role==="req"?"AND t.agency=$3":""} ORDER BY t.id DESC LIMIT 20`,[r.id,r.tboh,r.agency,r.intent]);
const events=await q(`SELECT at,actor,message,kind FROM events WHERE ticket_id=$1 ${staff?"":"AND kind='status'"} ORDER BY at,id`,[r.id]);
let threads=[];if(staff){threads=await q(`SELECT * FROM side_threads WHERE ticket_id=$1 ORDER BY id`,[r.id]);const m=threads.length?await q(`SELECT * FROM side_msgs WHERE thread_id=ANY($1::bigint[]) ORDER BY at,id`,[threads.map(t=>t.id)]):[];threads=threads.map(t=>({...t,messages:m.filter(x=>x.thread_id===t.id)}))}
return json({ticket:present(r),linked:linked.map(present),events,threads})});
export const PATCH=route(STAFF,async(req,u,{params})=>{const r=await loadTicket(params.id,u),b=await body(req),id=r.id;
switch(b.action){
case"assign":{const uid=str(b.userId,20,"userId");const[t]=await q(`SELECT id,name FROM users WHERE id=$1 AND role<>'req'`,[uid]);if(!t)throw new HttpError(400,"Unknown assignee");
const[{n}]=await q(`SELECT count(*)::int n FROM side_threads WHERE ticket_id=$1`,[id]);await q(`UPDATE tickets SET owner=$1,status=CASE WHEN status='New' THEN 'Open' ELSE status END,updated_at=now() WHERE id=$2`,[uid,id]);
await addEvent(id,u.name,"Reassigned "+(r.owner_name||"Unassigned")+" → "+t.name+(n?` (${n} side thread(s) keep their explicit recipients)`:""),"status");break}
case"unassign":if(!OPS.includes(u.role))throw new HttpError(403,"Forbidden");await q(`UPDATE tickets SET owner=NULL,status='New',updated_at=now() WHERE id=$1`,[id]);await addEvent(id,u.name,"Unassigned from "+(r.owner_name||"nobody"));break;
case"reroute":if(!OPS.includes(u.role))throw new HttpError(403,"Forbidden");await routeTicket({...r},u.name);break;
case"status":{if(!STATUSES.includes(b.status))throw new HttpError(400,"Invalid status");await q(`UPDATE tickets SET status=$1,updated_at=now() WHERE id=$2`,[b.status,id]);await addEvent(id,u.name,"Status → "+b.status,"status");break}
case"priority":{if(!OPS.includes(u.role)||!PRIORITIES.includes(b.priority))throw new HttpError(400,"Invalid");const due=slaDue(b.priority,new Date(r.created_at).getTime(),r.checkin&&new Date(r.checkin).getTime());await q(`UPDATE tickets SET priority=$1,sla_due=$2,updated_at=now() WHERE id=$3`,[b.priority,due,id]);await addEvent(id,u.name,"Priority → "+b.priority);break}
case"escalate":{if(!OPS.includes(u.role))throw new HttpError(403,"Forbidden");if(r.status==="Escalated")throw new HttpError(409,"Already escalated");
const[em]=await q(`SELECT u.id,u.name FROM users u WHERE u.role='em' ORDER BY (SELECT count(*) FROM tickets x WHERE x.owner=u.id AND x.status='Escalated') LIMIT 1`);if(!em)throw new HttpError(409,"No Escalation Manager configured");
await q(`UPDATE tickets SET owner=$1,status='Escalated',updated_at=now() WHERE id=$2`,[em.id,id]);const note=typeof b.note==="string"?b.note.slice(0,300):"";await addEvent(id,u.name,"Escalated to "+em.name+" (SLA "+present(r).sla+")"+(note?": "+note:""),"status");break}
default:throw new HttpError(400,"Unknown action")}
const[n]=await q(`${SELECT} WHERE t.id=$1`,[id]);return json(present(n))});
