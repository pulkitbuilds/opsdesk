export const PRIORITIES=["P1","P2","P3","P4"],STATUSES=["New","Open","Pending","Escalated","Resolved","Closed"],REGIONS=["India","UAE","Singapore"];
export const OPEN_CLOSED=["Resolved","Closed"];
export const INTENTS={refund:["refund","money back","not received"],cancellation:["cancel"],amendment:["change","amend","modify","rename","name correction"],voucher:["voucher","confirmation","ticket copy"],inventory_sync:["sync","inventory","availability","stock"],payment:["payment","deducted","wallet","invoice"],general:[]};
export const THEMES={"refund delay":["refund"],"inventory sync":["sync","inventory"],"special request":["special","wheelchair","meal"],"bug signal":["error","bug","fails","not loading"]};
const H=36e5;
export function suggestIntent(text){const t=(text||"").toLowerCase();let best="general",n=0;for(const[k,w]of Object.entries(INTENTS)){const c=w.filter(x=>t.includes(x)).length;if(c>n){n=c;best=k}}return best}
export const detectThemes=text=>{const t=(text||"").toLowerCase();return Object.keys(THEMES).filter(k=>THEMES[k].some(w=>t.includes(w)))};
export const SLA_HOURS={P1:4,P2:8,P3:24,P4:48};
// Travel-aware SLA: priority hours, tightened when check-in/LCD is near.
export function slaDue(priority,createdMs,checkinMs){let h=SLA_HOURS[priority]??24;if(checkinMs){const p=(checkinMs-createdMs)/H;if(p<24)h=Math.min(h,2);else if(p<72)h=Math.min(h,6)}return new Date(createdMs+h*H)}
export function slaState(dueIso,createdIso,status,nowMs=Date.now()){if(OPEN_CLOSED.includes(status))return"met";const due=new Date(dueIso).getTime(),c=new Date(createdIso).getTime();if(nowMs>due)return"breached";if(nowMs>c+.75*(due-c))return"risk";return"ok"}
// agents: [{id,region,available,load}] -> {id,reason}|null
export function pickAgent(agents,t){const c=agents.filter(a=>a.available).map(a=>{let s=-0.5*a.load;const w=[];if(a.region===t.region){s+=3;w.push("region match")}if(t.priority==="P1"||t.priority==="P2"){s+=1;w.push("priority "+t.priority+" fast-lane")}w.push("load "+a.load);return{a,s,w}}).sort((x,y)=>y.s-x.s)[0];return c?{id:c.a.id,reason:c.w.join(", ")}:null}
export const TBOH_RE=/^TBOH-\d{3,12}$/;
