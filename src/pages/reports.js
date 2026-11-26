async function reportsPage() {
  const {teachers}=await api('/api/teachers');
  const today=dateInputValue();const monthStart=`${today.slice(0,7)}-01`;
  return `${pageHeading('التقارير','اختر عاملًا أو جميع العاملين، وحدد الفترة ونوع التجميع.')}
   <div class="toolbar report-toolbar"><div class="field"><label>العامل</label><select id="report-teacher"><option value="all">جميع العاملين</option>${teachers.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div><div class="field"><label>الفترة من</label><input id="report-from" type="date" value="${monthStart}"></div><div class="field"><label>الفترة إلى</label><input id="report-to" type="date" value="${today}"></div><div class="field"><label>نوع التقرير</label><select id="report-period"><option value="daily">يومي</option><option value="weekly">أسبوعي</option><option value="monthly">شهري</option></select></div><button class="btn btn-primary" data-action="load-report">${icon('search')} عرض التقرير</button></div>
   <div id="report-content">${emptyState('حدد الفترة المطلوبة ثم اختر «عرض التقرير».')}</div>`;
}
function renderReport(data,teacherName) {
  const rows=data.evaluations||[];const avg=rows.length?rows.reduce((a,e)=>a+e.score,0)/rows.length:null;const warn=rows.filter(e=>e.warning).length;
  const groupHtml=data.groups.length?data.groups.map(g=>{
    const label=data.period==='daily'?dateText(g.period):data.period==='weekly'?`أسبوع ${dateText(g.period,{day:'numeric',month:'short'})}`:new Intl.DateTimeFormat('ar-EG',{month:'long',year:'numeric'}).format(new Date(`${g.period}-01T12:00:00`));
    const evals=rows.filter(e=>data.period==='daily'?e.date===g.period:data.period==='weekly'?weekStart(e.date)===g.period:e.date.startsWith(g.period));
    return `<article class="report-row"><div class="report-row-head"><span>${label}</span><small>${g.count} تقييم · المتوسط ${formatPercent(g.average)}</small></div>${evals.map(e=>`<div class="report-detail"><div><span>العامل</span>${esc(e.teacherName)} (${esc(e.teacherGender)})</div><div><span>النسبة والتقدير</span><b class="score ${classScore(e.score)}">${formatPercent(e.score)}</b> · ${gradePill(e)}</div><div><span>الملاحظات العامة</span>${esc(e.generalNote||'—')}</div><div><span>المشرف / الإنذار</span>${esc(e.evaluatorName)} · ${e.warning?'<b class="score low">إنذار</b>':'—'}</div><div><span>نقاط القوة</span>${esc(e.strengths||'—')}</div><div><span>نقاط الضعف</span>${esc(e.weaknesses||'—')}</div><div><span>السلوك والأهداف والكفاءة</span>${esc([e.behaviorNote,e.goalsNote,e.teachingNote].filter(Boolean).join(' · ')||'—')}</div><div><span>التوجيه التشغيلي</span>${esc(e.directive||'—')}</div><div><span>درجات المعايير من 10</span>${criteria.map(c=>`${esc(c.label)}: ${formatScore(e.criteria[c.key]?.score)}/${c.max}`).join(' · ')}</div><div><span>أسباب الخصم المسجلة</span>${criteria.map(c=>e.criteria[c.key]?.deductionReason?`${esc(c.label)}: ${esc(e.criteria[c.key].deductionReason)}`:'').filter(Boolean).join(' · ')||'—'}</div></div>`).join('')}</article>`;
  }).join(''):emptyState('لا توجد تقييمات في هذه الفترة.');
  return `<div class="print-only report-print-title"><div class="report-brand"><img src="${BRAND_LOGO_SMALL}" alt=""><span>مطبخ الإدارة المركزي</span></div><h1>تقرير الأداء اليومي · مذاق | MATHAQ</h1><p>${esc(teacherName||'جميع العاملين')} · ${dateText(data.from)} – ${dateText(data.to)}</p></div><div class="report-summary"><span class="summary-chip">عدد التقييمات <strong>${rows.length}</strong></span><span class="summary-chip">متوسط الأداء <strong>${formatPercent(avg)}</strong></span><span class="summary-chip">عدد التنبيهات <strong>${warn}</strong></span><span class="summary-chip">الفترة <strong>${data.period==='daily'?'يومي':data.period==='weekly'?'أسبوعي':'شهري'}</strong></span></div><div class="heading-actions no-print" style="margin:0 0 14px"><button class="btn btn-secondary" data-action="export-csv">${icon('download')} تصدير Excel (CSV)</button><button class="btn btn-gold" data-action="print-report">${icon('report')} تنزيل PDF</button></div>${groupHtml}`;
}

async function loadReport() {
  const teacher=document.getElementById('report-teacher').value;const from=document.getElementById('report-from').value;const to=document.getElementById('report-to').value;const period=document.getElementById('report-period').value;
  if(!from||!to){toast('حدد تاريخ البداية والنهاية.','error');return;}
  const box=document.getElementById('report-content');box.innerHTML='<div class="card">'+emptyState('جاري إعداد التقرير…')+'</div>';
  const response=await api(`/api/reports?teacherId=${teacher==='all'?'':encodeURIComponent(teacher)}&from=${from}&to=${to}&period=${period}`);
  const data=response.report||response;const rows=data.evaluations||[];const grouped={};rows.forEach(e=>{const key=period==='daily'?e.date:period==='weekly'?weekStart(e.date):e.date.slice(0,7);(grouped[key]??={period:key,values:[]}).values.push(e);});data.period=period;data.groups=Object.values(grouped).map(g=>({period:g.period,count:g.values.length,average:g.values.reduce((a,e)=>a+Number(e.score||0),0)/g.values.length}));
  const select=document.getElementById('report-teacher');const teacherName=teacher==='all'?'جميع العاملين':select.selectedOptions[0]?.textContent;
  state.report={teacher,from,to,period,teacherName};box.innerHTML=renderReport(data,teacherName);
}
async function exportCsv() {
  if(!state.report)return;const r=state.report;
  const response=await api(`/api/reports?teacherId=${r.teacher==='all'?'':encodeURIComponent(r.teacher)}&from=${r.from}&to=${r.to}&period=${r.period}&format=csv`);
  const blob=await response.blob();const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=`تقرير-أداء-MATHAQ-${r.from}-${r.to}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);toast('تم تنزيل ملف التقرير بصيغة CSV المتوافقة مع Excel.');
}
