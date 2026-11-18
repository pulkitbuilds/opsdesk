import{NextResponse}from"next/server";import{getUser}from"./auth.js";import{ready}from"./db.js";
export const json=(d,s=200)=>NextResponse.json(d,{status:s});
export class HttpError extends Error{constructor(s,m){super(m);this.status=s}}
export const route=(roles,fn)=>async(req,ctx)=>{try{await ready();const u=await getUser();if(!u)throw new HttpError(401,"Not signed in");if(roles&&!roles.includes(u.role))throw new HttpError(403,"Forbidden");return await fn(req,u,ctx)}catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);console.error(e);return json({error:"Server error"},500)}};
export async function body(req){try{const b=await req.json();if(!b||typeof b!=="object")throw 0;return b}catch{throw new HttpError(400,"Invalid JSON body")}}
export const str=(v,max,name,min=1)=>{if(typeof v!=="string"||v.trim().length<min||v.length>max)throw new HttpError(400,`${name} is invalid`);return v.trim()};
export const STAFF=["agent","lead","em"],OPS=["agent","lead"];
