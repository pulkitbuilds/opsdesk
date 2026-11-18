import{route,json,OPS}from"@/lib/api.js";import{q}from"@/lib/db.js";export const dynamic="force-dynamic";
export const GET=route([...OPS,"em"],async()=>{const themes=await q(`SELECT theme,count(*)::int AS count,(array_agg('T-'||id||' '||title ORDER BY id DESC))[1:3] AS samples FROM tickets,unnest(themes) AS theme WHERE created_at>now()-interval '7 days' GROUP BY theme ORDER BY count DESC`);
const[health]=await q(`SELECT count(*)::int AS open,count(*) FILTER (WHERE owner IS NULL)::int AS unassigned,count(*) FILTER (WHERE sla_due<now())::int AS breached,count(*) FILTER (WHERE sla_due>=now() AND now()>created_at+0.75*(sla_due-created_at))::int AS at_risk FROM tickets WHERE status NOT IN ('Resolved','Closed')`);
return json({themes,health})});
