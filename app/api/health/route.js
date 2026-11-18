import{q}from"@/lib/db.js";import{json}from"@/lib/api.js";export const dynamic="force-dynamic";
export async function GET(){try{await q("SELECT 1");return json({ok:true})}catch{return json({ok:false},503)}}
