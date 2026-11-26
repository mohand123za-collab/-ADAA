function administrativeDirectiveStatus(status) {
  const values={pending:{label:'بانتظار التنفيذ',className:'neutral'},in_progress:{label:'قيد التنفيذ',className:'medium'},completed:{label:'مكتمل',className:'good'}};
  return values[status]||values.pending;
}
function administrativeDirectiveDate(value) {
  const date=new Date(value);return Number.isNaN(date.valueOf())?esc(value||''):new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(date);
}
async function directivesPage() {
  const {directives=[]}=await api('/api/directives');
  const canCreate=['chair','director'].includes(state.user.role);
  const actions=canCreate?`<button class="btn btn-primary" data-action="open-administrative-directive">${icon('plus')} توجيه جديد</button>`:'';
  const cards=directives.map(d=>{
    const status=administrativeDirectiveStatus(d.status);
    return `<article class="directive-card"><div class="directive-card-head"><div><div class="directive-target">${d.teacherName?`توجيه خاص · ${esc(d.teacherName)}`:'توجيه عام'}</div><div class="record-muted">أُرسل ${administrativeDirectiveDate(d.createdAt)}</div></div><span class="pill ${status.className}">${status.label}</span></div><p class="directive-content">${esc(d.content)}</p><section class="directive-response"><strong>رد مدير المطبخ</strong><p>${d.response?esc(d.response):'<span class="record-muted">لم يُسجّل رد بعد.</span>'}</p></section>${['chair','director'].includes(state.user.role)?`<div class="directive-card-actions"><button class="btn btn-secondary btn-small" data-action="respond-administrative-directive" data-id="${d.id}">${icon('edit')} تسجيل الرد أو تحديث الحالة</button></div>`:''}</article>`;
  }).join('');
  return `${pageHeading('التوجيهات التشغيلية',canCreate?'اكتب توجيهات عامة أو خصّص توجيهًا لعامل، وتابع الردود وحالة التنفيذ.':'جميع توجيهات المدير العام محفوظة هنا، مع إمكانية تسجيل الرد وتحديث حالة التنفيذ.',actions)}<div class="directive-notice">${icon('message')}<span>تُحفظ التوجيهات وردودها للرجوع إليها لاحقًا.</span></div><div class="directive-list">${cards||emptyState('لا توجد توجيهات إدارية مسجلة بعد.',canCreate?'<button class="btn btn-primary btn-small" data-action="open-administrative-directive">إضافة أول توجيه</button>':'')}</div>`;
}