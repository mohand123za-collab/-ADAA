function navItems() { return [
  {key:'dashboard',label:'لوحة التحكم',icon:'grid'},
  {key:'teachers',label:'ملفات المدرسين',icon:'people'},
  {key:'evaluations',label:'التقييمات اليومية',icon:'clipboard'},
  {key:'warnings',label:'سجل الإنذارات',icon:'bell',count:state.dashboard?.warningCount||0},
  {key:'reports',label:'التقارير',icon:'report'},
  {key:'directives',label:'التوجيهات الإدارية',icon:'message'},
  ...(state.user?.role==='director'?[{key:'administration',label:'الإدارة',icon:'shield'}]:[]),
]; }
function pageTitle() { const item=navItems().find(x=>x.key===state.page);if(item)return item.label;if(state.page==='profile')return 'ملف المدرس';return 'لوحة التحكم'; }
function shell(content) {
  const nav=navItems().map(item=>`<button class="nav-btn ${state.page===item.key||state.page==='profile'&&item.key==='teachers'?'active':''}" data-action="navigate" data-page="${item.key}">${icon(item.icon)}<span>${item.label}</span>${item.count?`<span class="nav-count">${item.count>9?'9+':item.count}</span>`:''}</button>`).join('');
  const date=new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  return `<div class="app-shell">
    <aside class="sidebar ${state.mobileOpen?'open':''}" id="sidebar">
      <div class="brand"><img class="brand-logo" src="${BRAND_LOGO_SMALL}" alt="شعار معهد المجد"><span><div class="brand-name">أداء <span class="brand-divider">|</span> ADAA</div><div class="brand-sub">معهد المجد · إدارة الأداء التعليمي</div></span></div>
      <div class="nav-label">القائمة الرئيسية</div><nav class="nav">${nav}</nav>
      <div class="sidebar-bottom"><div class="institution-label">معهد المجد لتحفيظ القرآن الكريم<br>بوابة متابعة الأداء والتطوير</div><div class="sidebar-note">﴿ إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾</div></div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="topbar-start"><button class="icon-btn mobile-menu" data-action="toggle-menu" aria-label="القائمة">${icon('menu')}</button><div><div class="eyebrow">معهد المجد لتحفيظ القرآن الكريم</div><div class="topbar-title">${esc(pageTitle())}</div></div></div>
        <div class="topbar-actions"><div class="date-chip">${icon('calendar')}${esc(date)}</div><div class="user-menu">${teacherAvatar(state.user.name,'avatar')}<div><div class="user-name">${esc(state.user.name)}</div><div class="user-role">${esc(roleNames[state.user.role])}</div></div></div><div class="account-actions">
          <button class="icon-btn" data-action="logout" title="تسجيل الخروج">${icon('logout')}</button>
          <button id="install-app-button" class="install-app-button" type="button" aria-label="تثبيت التطبيق" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v4h14v-4"/></svg>
            <span>تثبيت التطبيق</span>
          </button>
          <button id="push-notifications-button" class="push-notifications-button" type="button" data-action="toggle-push-notifications" aria-label="تفعيل تنبيهات التقييم">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>تفعيل تنبيهات التقييم</span>
          </button>
        </div></div>
      </header><section class="page">${content}</section>
    </main>
  </div>${state.modal||''}`;
}
function pageHeading(title,description,actions='') { return `<div class="page-heading"><div><h1 class="page-title">${title}</h1><p class="page-description">${description}</p></div>${actions?`<div class="heading-actions">${actions}</div>`:''}</div>`; }
function emptyState(text,button='') { return `<div class="empty-state"><div class="empty-icon">${icon('book')}</div><div>${text}</div>${button?`<div style="margin-top:13px">${button}</div>`:''}</div>`; }
function teacherLink(t) { return `<button class="text-link" data-action="open-profile" data-id="${t.id}">${esc(t.name)}</button>`; }
function statCard(label,value,sub,ico,accent='#225944',bg='#edf3ed') { return `<article class="stat-card" style="--accent:${accent};--accent-bg:${bg}"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon(ico)}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${sub}</div></article>`; }

async function boot() {
  try {
    const session=await api('/api/session');criteria=session.criteria||criteriaDefaults;
    if(session.setupRequired){renderSetup();return;}
    if(!session.user){renderLogin();return;}
    state.user=session.user;try{const configured=await criteriaApi('/api/criteria');if(configured.criteria?.length)criteria=configured.criteria;}catch(error){if(!session.user)throw error;}await renderPage();
  } catch(error) { renderLogin(error.message); }
}
function renderLogin(message='') {
  state.user=null;state.modal='';
  app.innerHTML=`<main class="auth-screen"><section class="auth-layout"><div class="auth-brand-panel"><img class="auth-logo" src="${BRAND_LOGO_LARGE}" alt="شعار معهد المجد"><div class="auth-product">أداء <span>|</span> ADAA<small>بوابة متابعة الأداء التعليمي</small></div><h1>رعايةٌ واعية<br>لأهل القرآن</h1><p>منظومة متكاملة لمتابعة جودة التعليم، وتقدير أثره، ومساندة المعلم في رحلته التربوية.</p><div class="auth-values"><div class="auth-value">${icon('check')} تقييم يومي بمعايير واضحة وعادلة</div><div class="auth-value">${icon('check')} متابعة النمو التربوي والتعليمي</div><div class="auth-value">${icon('check')} حفظ منظم للملفات والتقارير</div></div></div>
    <div class="auth-form-panel"><h2>مرحبًا بعودتك</h2><p class="auth-lead">سجّل الدخول إلى بوابة متابعة الأداء.</p><form class="auth-form" id="login-form"><div class="field"><label for="username">اسم المستخدم</label><input id="username" name="username" autocomplete="username" required placeholder="أدخل اسم المستخدم"></div><div class="field"><label for="password">كلمة المرور</label><input id="password" name="password" type="password" autocomplete="current-password" required placeholder="أدخل كلمة المرور"></div><button class="btn btn-primary" type="submit">تسجيل الدخول ${icon('arrow')}</button><div id="auth-message">${message?`<div class="flash error">${esc(message)}</div>`:''}</div></form><div class="auth-lock">${icon('shield')} وصول خاص بحسابي الإدارة المعتمدين</div></div></section></main>`;
}
function renderSetup(message='') {
  app.innerHTML=`<main class="auth-screen"><section class="auth-layout"><div class="auth-brand-panel"><img class="auth-logo" src="${BRAND_LOGO_LARGE}" alt="شعار معهد المجد"><div class="auth-product">أداء <span>|</span> ADAA<small>بوابة متابعة الأداء التعليمي</small></div><h1>الإعداد الأولي<br>للنظام</h1><p>أنشئ حسابَي الإدارة المعتمدين للبدء. لكل منصب حساب مستقل، وتُخزّن كلمة المرور بصورة تجزئة آمنة.</p><div class="auth-values"><div class="auth-value">${icon('shield')} صلاحيات منفصلة داخل النظام</div><div class="auth-value">${icon('check')} لا يمكن إضافة حساب إداري ثالث</div></div></div>
   <div class="auth-form-panel"><h2>إنشاء حسابَي الإدارة</h2><p class="auth-lead">أدخل اسمًا واسم مستخدم وكلمة مرور لكل منصب. الحد الأدنى لكلمة المرور 3 أحرف أو أرقام.</p><form id="setup-form" class="auth-form">
   <div class="wizard-accounts"><div class="wizard-account"><div class="wizard-title">رئيس شؤون المعلمين والمعلمات</div><div class="field"><label>الاسم</label><input name="chairName" required maxlength="100"></div><div class="field"><label>اسم المستخدم</label><input name="chairUsername" required minlength="3" autocomplete="username"></div><div class="field"><label>كلمة المرور</label><input name="chairPassword" type="password" required minlength="3" autocomplete="new-password"></div></div>
   <div class="wizard-account"><div class="wizard-title">المدير العام</div><div class="field"><label>الاسم</label><input name="directorName" required maxlength="100"></div><div class="field"><label>اسم المستخدم</label><input name="directorUsername" required minlength="3" autocomplete="username"></div><div class="field"><label>كلمة المرور</label><input name="directorPassword" type="password" required minlength="3" autocomplete="new-password"></div></div></div>
   <div><button class="btn btn-primary" type="submit">حفظ الحسابين والبدء ${icon('arrow')}</button><div id="auth-message">${message?`<div class="flash error">${esc(message)}</div>`:''}</div></div></form></div></section></main>`;
}

let renderVersion=0;
async function renderPage() {
  if(!state.user)return;
  const version=++renderVersion;
  state.modal='';
  let content='';
  if(state.page==='dashboard')content=await dashboardPage();
  else if(state.page==='teachers')content=await teachersPage();
  else if(state.page==='profile')content=await profilePage();
  else if(state.page==='evaluations')content=await evaluationsPage();
  else if(state.page==='warnings')content=await warningsPage();
  else if(state.page==='reports')content=await reportsPage();
  else if(state.page==='directives')content=await directivesPage();
  else if(state.page==='administration')content=await administrationPage();
  else {state.page='dashboard';content=await dashboardPage();}
  if(version!==renderVersion||!state.user)return;
  app.innerHTML=shell(content);
  syncInstallButton();
  syncPushButton();
}

function trendChart(items,cls='chart-wrap') {
  if(!items?.length)return `<div class="${cls}"><div class="chart-empty">تظهر حركة الأداء بعد تسجيل التقييمات</div></div>`;
  const width=780,height=230,pad={top:18,right:34,bottom:30,left:38};const innerW=width-pad.left-pad.right,innerH=height-pad.top-pad.bottom;
  const max=10,min=0,points=items.map((d,i)=>({x:pad.left+(items.length===1?innerW/2:i*innerW/(items.length-1)),y:pad.top+innerH-(Math.max(min,Math.min(max,Number(d.average)||0))-min)/(max-min)*innerH,value:Number(d.average)||0,item:d}));
  const line=points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ');const area=`${line} L${points.at(-1).x},${pad.top+innerH} L${points[0].x},${pad.top+innerH} Z`;
  const grids=[0,5,10].map(v=>{const y=pad.top+innerH-v/10*innerH;return `<line class="chart-grid" x1="${pad.left}" y1="${y}" x2="${width-pad.right}" y2="${y}"/><text class="chart-text" x="${pad.left-10}" y="${y+3}" text-anchor="end">${v*10}%</text>`}).join('');
  const labels=points.filter((_,i)=>items.length<=7||i%Math.ceil(items.length/7)===0||i===items.length-1).map(p=>`<text class="chart-text" x="${p.x}" y="${height-5}" text-anchor="middle">${esc(String(p.item.date||p.item.period||'').slice(5))}</text>`).join('');
  const dots=points.map(p=>`<circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="4"><title>${esc(p.item.date||p.item.period||'')}: ${formatPercent(p.value)}</title></circle>`).join('');
  return `<div class="${cls}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="الرسم البياني لتطور الأداء"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ca38a" stop-opacity=".30"/><stop offset="1" stop-color="#7ca38a" stop-opacity=".01"/></linearGradient></defs>${grids}<path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/>${dots}${labels}</svg></div>`;
}
