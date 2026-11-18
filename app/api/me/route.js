import{route,json}from"@/lib/api.js";export const dynamic="force-dynamic";
export const GET=route(null,async(req,u)=>json(u));
