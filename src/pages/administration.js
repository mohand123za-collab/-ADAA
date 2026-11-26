async function administrationPage() {
  const {criteria:items=[]}=await criteriaApi('/api/criteria');
  const rows=items.map(c=>`<article class="admin-criterion"><div class="admin-criterion-main"><span class="admin-order">${c.sortOrder}</span><div><strong>${esc(c.label)}</strong><small>المعرّف: ${esc(c.key)} · الحد الأعلى: ${formatScore(c.max) }</small></div></div><div class="admin-criterion-actions"><button class="btn btn-secondary btn-small" data-action="edit-criterion" data-id="${c.id}" data-key="${esc(c.key)}" data-label="${esc(c.label)}" data-max="${c.max}">${icon('edit')} تعديل</button><button class="btn btn-danger btn-small" data-action="delete-criterion" data-id="${c.id}" data-label="${esc(c.label)}">حذف</button></div></article>`).join('');
  return `${pageHeading('الإدارة','إدارة معايير التقييم: الاسم والدرجة وعدد المعايير المستخدمة في نموذج التقييم.',`<button class="btn btn-primary" data-action="add-criterion">${icon('plus')} إضافة معيار تقييم</button>`)}
    <div class="directive-notice">${icon('shield')}<span>التغييرات تؤثر في التقييمات الجديدة والتقارير القادمة. السجلات السابقة تبقى محفوظة كما أُدخلت.</span></div>
    <article class="card admin-criteria-card"><div class="form-section-title">معايير التقييم الحالية</div><div class="admin-criteria-list">${rows||emptyState('لا توجد خيارات تقييم. أضف خيارًا للبدء.')}</div></article>`;
}
