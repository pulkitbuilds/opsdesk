import{route,json,body,str,STAFF,HttpError}from"@/lib/api.js";import{q,SELECT,present,insertTicket,addEvent}from"@/lib/db.js";
import{PRIORITIES,REGIONS,INTENTS,TBOH_RE,suggestIntent}from"@/lib/domain.js";import{routeTicket}from"@/lib/tickets.js";export const dynamic="force-dynamic";
const OPEN="t.status NOT IN ('Resolved','Closed')";
export const GET=route(null,async(req,u)=>{const sp=new URL(req.url).searchParams,w=[],p=[],add=(c,v)=>{p.push(v);w.push(c.replace("?","$"+p.length))};
const view=sp.get("view")||"all",region=sp.get("region"),intent=sp.get("intent"),text=sp.get("q");
if(u.role==="req")add("t.agency=?",u.agency);if(u.role==="em")w.push("t.status='Escalated'");
if(view==="triage")w.push("t.owner IS NULL AND "+OPEN);else if(view==="mine")add("t.owner=? AND "+OPEN,u.id);else if(view==="esc")w.push("t.status='Escalated'");else if(view==="open")w.push(OPEN);
if(region)add("t.region=?",region);if(intent)add("t.intent=?",intent);if(text&&text.length<=100)add("(t.title ILIKE ? OR t.tboh ILIKE ?)","%"+text.replace(/[%_]/g,"")+"%");
const page=Math.max(0,parseInt(sp.get("page")||"0",10)||0),limit=50;const where=w.length?" WHERE "+w.join(" AND "):"";
const rows=await q(`${SELECT}${where} ORDER BY (t.status IN ('Resolved','Closed')),t.sla_due ASC,t.id DESC LIMIT ${limit+1} OFFSET ${page*limit}`,p);
return json({tickets:rows.slice(0,limit).map(present),hasMore:rows.length>limit})});
export const POST=route(["req","agent","lead"],async(req,u)=>{const b=await body(req);const title=str(b.title,200,"title"),description=str(b.description??"",4000,"description",0),tboh=str(b.tboh,20,"tboh").toUpperCase();
if(!TBOH_RE.test(tboh))throw new HttpError(400,"TBOH must look like TBOH-1234");if(!PRIORITIES.includes(b.priority))throw new HttpError(400,"Invalid priority");if(!REGIONS.includes(b.region))throw new HttpError(400,"Invalid region");
const intent=b.intent?b.intent:suggestIntent(title+" "+description);if(!(intent in INTENTS))throw new HttpError(400,"Invalid intent");
const agency=u.role==="req"?u.agency:str(b.agency,100,"agency");let checkin=null;if(b.checkin){checkin=new Date(b.checkin);if(isNaN(checkin))throw new HttpError(400,"Invalid check-in date")}
const t=await insertTicket({agency,tboh,title,description,priority:b.priority,intent,region:b.region,checkin},u.name);
const L=await q(`SELECT id FROM tickets WHERE id<>$1 AND (tboh=$2 OR (agency=$3 AND intent=$4))`,[t.id,tboh,agency,intent]);if(L.length)await addEvent(t.id,u.name,"Linked to "+L.map(x=>"T-"+x.id).join(", "));
await routeTicket(t,"routing-engine");const[r]=await q(`${SELECT} WHERE t.id=$1`,[t.id]);return json(present(r),201)});
