async function evaluationsPage() {
  const {teachers}=await api('/api/teachers');const {evaluations}=await api('/api/evaluations');
  const canWrite=state.user.role==='chair';
  return `${pageHeading('التقييمات اليومية','سجل الدرجات والمعايير والتوجيهات لكل يوم.',canWrite?`<button class="btn btn-primary" data-action="open-evaluation-modal">${icon('plus')} إدخال تقييم</button>`:'')}
    <div class="toolbar"><div class="field"><label>بحث بالمدرس</label><input id="evaluation-search" placeholder="اسم المدرس" autocomplete="off"></div><div class="field"><label>من تاريخ</label><input id="evaluation-from" type="date"></div><div class="field"><label>إلى تاريخ</label><input id="evaluation-to" type="date"></div><button class="btn btn-secondary" data-action="filter-evaluations">${icon('search')} تطبيق</button><span class="toolbar-spacer"></span><span class="record-muted" id="evaluation-count">${evaluations.length} تقييمًا</span></div>
    <article class="card table-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>المدرس</th><th>المجموع</th><th>التقدير</th><th>المقيّم</th><th>المدير العام</th><th>الإجراء</th></tr></thead><tbody id="evaluation-rows">${evaluationRows(evaluations,teachers)}</tbody></table></div></article>`;
}
function evaluationRows(evaluations) {
  return evaluations.length?evaluations.map(e=>`<tr data-evaluation-row data-date="${e.date}" data-name="${esc(e.teacherName.toLocaleLowerCase())}"><td>${dateText(e.date)}</td><td><div class="teacher-cell">${teacherAvatar(e.teacherName)}<div><strong>${esc(e.teacherName)}</strong><small>${esc(e.teacherGender)}</small></div></div></td><td><strong class="score ${classScore(e.score)}">${formatPercent(e.score)}</strong></td><td>${gradePill(e)}</td><td>${esc(e.evaluatorName)}</td><td>${e.directive?`<span class="pill good">تم التوجيه</span>`:`<span class="record-muted">بانتظار المراجعة</span>`}</td><td><button class="text-link" data-action="why" data-id="${e.id}">${state.user.role==='director'?'لماذا حصل على هذه الدرجة؟':'عرض التفاصيل'}</button>${state.user.role==='chair'&&!e.teacherDeleted?`<button class="text-link" data-action="edit-evaluation" data-id="${e.id}">تعديل</button>`:''}</td></tr>`).join(''):`<tr><td colspan="7">${emptyState('لا توجد تقييمات ضمن الفترة المحددة.')}</td></tr>`;
}

async function warningsPage() {
  const {warnings:rawWarnings}=await api('/api/warnings');const [{evaluations},teacherData]=await Promise.all([api('/api/evaluations'),api('/api/teachers')]);const teacherMap=Object.fromEntries((teacherData.teachers||[]).map(t=>[t.id,t]));const evalMap=Object.fromEntries((evaluations||[]).map(e=>[e.id,e]));const warnings=(rawWarnings||[]).map(w=>{const e=evalMap[w.evaluation_id]||{};const t=teacherMap[e.teacherId]||{};return {...w,teacher_name:t.name||e.teacherName||'—',teacher_gender:t.gender||e.teacherGender||'',date:e.date,score:Number(e.score),issuer_name:e.evaluatorName||'—'};});const fresh=warnings.filter(w=>!w.seen_at).length;
  return `${pageHeading('سجل الإنذارات','متابعة جميع النتائج الأقل من 70% وقراءة أسبابها المسجلة.',`<span class="pill low">${fresh} تنبيه جديد</span>`)}
    <div class="warning-banner"><span class="warning-dot"></span><div><strong>آلية الإنذار التلقائي</strong>عند نزول نتيجة التقييم اليومي عن 70%، يُحفظ إنذار مرتبط بالتقييم وسببه، ويظهر للطرفين المخوّلين بالمراجعة.</div></div>
    <article class="card table-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>الحالة</th><th>المدرس</th><th>تاريخ التقييم</th><th>النسبة</th><th>السبب</th><th>سجلها</th><th>الإجراء</th></tr></thead><tbody>${warnings.length?warnings.map(w=>`<tr><td>${w.seen_at?'<span class="pill neutral">تمت المراجعة</span>':'<span class="pill low"><span class="warning-dot"></span>جديد</span>'}</td><td><div class="teacher-cell">${teacherAvatar(w.teacherName||w.teacher_name)}<div><strong>${esc(w.teacher_name)}</strong><small>${esc(w.teacher_gender)}</small></div></div></td><td>${dateText(w.date)}</td><td><strong class="score low">${formatPercent(w.score)}</strong></td><td>${esc(w.reason)}</td><td>${esc(w.issuer_name)}</td><td><button class="text-link" data-action="warning-review" data-eval-id="${w.evaluation_id||w.id}" data-id="${w.id}">مراجعة السبب</button></td></tr>`).join(''):`<tr><td colspan="7">${emptyState('لا توجد إنذارات مسجلة.')}</td></tr>`}</tbody></table></div></article>`;
}

async function applyEvaluationFilters() {
  const from=document.getElementById('evaluation-from').value;const to=document.getElementById('evaluation-to').value;const search=document.getElementById('evaluation-search').value.trim().toLocaleLowerCase();
  const qs=new URLSearchParams();if(from)qs.set('from',from);if(to)qs.set('to',to);
  const {evaluations}=await api(`/api/evaluations?${qs}`);const tbody=document.getElementById('evaluation-rows');if(!tbody)return;
  const filtered=evaluations.filter(e=>e.teacherName.toLocaleLowerCase().includes(search));tbody.innerHTML=evaluationRows(filtered);document.getElementById('evaluation-count').textContent=`${filtered.length} تقييمًا`;
}

async function refreshTeacherChoices(day) {
  const select=document.querySelector('#evaluation-form [name="teacherId"]');if(!select)return;
  const selected=select.value;const {teachers}=await api(`/api/teachers?date=${encodeURIComponent(day)}`);
  select.innerHTML='<option value="">اختر المدرس</option>'+teachers.map(t=>{
    const evaluated=Boolean(t.today_evaluation_id);return `<option value="${t.id}" ${selected===String(t.id)&&!evaluated?'selected':''} ${evaluated?'disabled':''}>${esc(t.name)} · ${esc(t.gender)} · ${esc(t.circle||'بدون حلقة')}${evaluated?' · تم تقييمه في هذا التاريخ':''}</option>`;
  }).join('');
  if(selected&&teachers.some(t=>String(t.id)===selected&&t.today_evaluation_id))toast('هذا المدرس لديه تقييم مسجل في التاريخ المختار؛ استخدم زر «تعديل» لتغييره.','error');
}
