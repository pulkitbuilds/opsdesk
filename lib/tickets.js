import{q,SELECT,present,addEvent}from"./db.js";import{HttpError}from"./api.js";import{OPEN_CLOSED,pickAgent}from"./domain.js";
export async function loadTicket(idParam,u){if(!/^\d+$/.test(idParam))throw new HttpError(404,"Not found");const[r]=await q(`${SELECT} WHERE t.id=$1`,[idParam]);
if(!r||(u.role==="req"&&r.agency!==u.agency)||(u.role==="em"&&r.status!=="Escalated"&&r.owner!==u.id))throw new HttpError(404,"Not found");return r}
export async function routeTicket(t,actor){const agents=await q(`SELECT u.id,u.region,u.available,(SELECT count(*)::int FROM tickets x WHERE x.owner=u.id AND x.status NOT IN ('Resolved','Closed')) AS load FROM users u WHERE u.role='agent'`);
const pick=pickAgent(agents,t);if(!pick){await addEvent(t.id,actor,"Routing: no available agent, left in triage");return null}
await q(`UPDATE tickets SET owner=$1,status=CASE WHEN status='New' THEN 'Open' ELSE status END,updated_at=now() WHERE id=$2`,[pick.id,t.id]);
await addEvent(t.id,actor,"Auto-routed to "+pick.id+" ("+pick.reason+")");return pick}
export{OPEN_CLOSED,present};
