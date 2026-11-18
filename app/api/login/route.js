import bcrypt from"bcryptjs";import{cookies}from"next/headers";import{q,ready}from"@/lib/db.js";import{sign,COOKIE}from"@/lib/auth.js";import{json,body,str,HttpError}from"@/lib/api.js";
const DUMMY="$2a$08$abcdefghijklmnopqrstuuYj3o3W1p0kq3Zk0m0m0m0m0m0m0m0m0m";
export async function POST(req){try{await ready();const b=await body(req);const email=str(b.email,200,"email").toLowerCase(),pw=str(b.password,200,"password");
const[u]=await q(`SELECT * FROM users WHERE email=$1`,[email]);const ok=await bcrypt.compare(pw,u?u.pw_hash:DUMMY);if(!u||!ok)throw new HttpError(401,"Invalid email or password");
cookies().set(COOKIE,await sign(u),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:28800});
return json({id:u.id,name:u.name,role:u.role,agency:u.agency})}catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);console.error(e);return json({error:"Server error"},500)}}
