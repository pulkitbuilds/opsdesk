import{SignJWT,jwtVerify}from"jose";import{cookies}from"next/headers";
const secret=()=>{const s=process.env.AUTH_SECRET;if(!s||s.length<16)throw new Error("AUTH_SECRET must be set (16+ chars)");return new TextEncoder().encode(s)};
export const COOKIE="opsdesk_session";
export const sign=u=>new SignJWT({role:u.role,agency:u.agency,name:u.name}).setProtectedHeader({alg:"HS256"}).setSubject(u.id).setExpirationTime("8h").sign(secret());
export async function getUser(){const t=cookies().get(COOKIE)?.value;if(!t)return null;try{const{payload}=await jwtVerify(t,secret());return{id:payload.sub,role:payload.role,agency:payload.agency,name:payload.name}}catch{return null}}
