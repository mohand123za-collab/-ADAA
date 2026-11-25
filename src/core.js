const app = document.getElementById('app');
const state = { user:null, page:'dashboard', teacherId:null, modal:null, modalBusy:false, mobileOpen:false, report:null, dashboard:null };
const roleNames = { chair:'رئيس شؤون المعلمين والمعلمات', director:'المدير العام' };
const iconPaths = {
  grid:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
  people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  clipboard:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M8 11h8M8 15h8M8 18h4"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  chart:'<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
  report:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  book:'<path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M21 18V5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v16M3 18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2"/>',
  arrow:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
  calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/>',
  close:'<path d="m18 6-12 12M6 6l12 12"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  circle:'<circle cx="12" cy="12" r="9"/>',
};
const criteriaDefaults = [
  {key:'respect',label:'حسن التعامل والأدب مع الطلاب',max:10},
  {key:'rolemodel',label:'التأثير التربوي والأخلاقي والقدوة الحسنة',max:10},
  {key:'discipline',label:'الانضباط والالتزام',max:10},
  {key:'goals',label:'تحقيق الأهداف التعليمية اليومية',max:10},
  {key:'teaching',label:'الكفاءة التعليمية وجودة التدريس',max:10},
  {key:'growth',label:'تطوير النفس والتعلم المستمر',max:10},
  {key:'classroom',label:'إدارة الحلقة وضبط الطلاب',max:10},
];
let criteria = criteriaDefaults;

function esc(v='') { return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function icon(name,cls='') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.circle}</svg>`; }
function dateInputValue(date=new Date()) { const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`; }
function dateText(value,opts={day:'numeric',month:'short',year:'numeric'}) { if(!value)return '—';const d=new Date(`${String(value).slice(0,10)}T12:00:00`);return Number.isNaN(d.valueOf())?esc(value):new Intl.DateTimeFormat('ar-EG',opts).format(d); }
function formatScore(n) { return n===null||n===undefined||n===''?'—':`${Number(n).toLocaleString('ar-EG',{maximumFractionDigits:1})}`; }
function formatPercent(score) { return score===null||score===undefined||score===''?'—':`${formatScore(Number(score)*10)}%`; }
function classScore(s) { return Number(s)<7?'low':Number(s)>=9?'gold':''; }
function gradeClass(score) { return Number(score)<7?'low':Number(score)<8?'medium':'good'; }
function gradePill(e) { const label=e.warning?'إنذار':e.grade||gradeLabel(e.score);return `<span class="pill ${gradeClass(e.score)}">${e.warning?'<span class="warning-dot"></span>':''}${esc(label)}</span>`; }
function gradeLabel(score) { const n=Number(score);return n>=9?'ممتاز':n>=8?'جيد جدًا':n>=7?'جيد':'إنذار تلقائي'; }
function initial(name='') { return [...String(name).trim()][0]||'م'; }
function teacherAvatar(name,cls='teacher-initial') { return `<span class="${cls}">${esc(initial(name))}</span>`; }
function toast(message,type='') { const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=message;document.getElementById('toast-region').append(el);setTimeout(()=>el.remove(),3800); }
const SUPABASE_FUNCTION_URL='https://umxznkskctubakjyjqpv.supabase.co/functions/v1/adaa-api';



const apiCache=new Map();
const apiInflight=new Map();
async function api(path,options={}) {
  const isGet=!options.method||options.method==='GET';
  const cached=apiCache.get(path);
  if(isGet&&cached&&Date.now()-cached.time<4000)return cached.data;
  if(isGet&&apiInflight.has(path))return apiInflight.get(path);
  if(!isGet)apiCache.clear();
  const request=(async()=>{
    const session=localStorage.getItem('adaa_session');
    const response=await fetch(SUPABASE_FUNCTION_URL+path,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(session?{'x-adaa-session':session}:{}),...(options.headers||{})}});
    if(response.status===401){localStorage.removeItem('adaa_session');if(state.user){state.user=null;state.page='dashboard';renderLogin('انتهت الجلسة. أدخل بيانات الدخول للمتابعة.');}throw new Error('انتهت الجلسة.');}
    const type=response.headers.get('Content-Type')||'';
    if(!response.ok){let message='تعذر إكمال العملية.';if(type.includes('json')){const data=await response.json();message=data.error||message;}else message=await response.text()||message;throw new Error(message);}
    if(type.includes('text/csv'))return response;
    const result=await response.json();if(isGet)apiCache.set(path,{time:Date.now(),data:result});return result;
  })();
  if(isGet)apiInflight.set(path,request);
  try{return await request;}finally{if(isGet&&apiInflight.get(path)===request)apiInflight.delete(path);}
}
