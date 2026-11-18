import{route,json,body,str,STAFF,HttpError}from"@/lib/api.js";import{q}from"@/lib/db.js";export const dynamic="force-dynamic";
export const GET=route(STAFF,async()=>json(await q(`SELECT id,name,role,region,available FROM users WHERE role<>'req' ORDER BY name`)));
export const PATCH=route(["lead"],async(req)=>{const b=await body(req);const id=str(b.id,20,"id");if(typeof b.available!=="boolean")throw new HttpError(400,"available must be boolean");
await q(`UPDATE users SET available=$1 WHERE id=$2 AND role='agent'`,[b.available,id]);return json({ok:true})});
