document.addEventListener('submit',async e=>{
  if(e.target.id==='login-form'){
    e.preventDefault();
    const form=e.target;
    if(form.dataset.submitting==='1')return;
    form.dataset.submitting='1';
    const fd=new FormData(form);
    const button=form.querySelector('button[type="submit"]');
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML='<span class="loading-spinner" aria-hidden="true"></span><span>جارٍ تسجيل الدخول…</span>';}
    try{
      const data=await api('/api/login',{method:'POST',body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})});
      localStorage.setItem('adaa_session',data.token);state.user=data.user;state.page='dashboard';
      await renderPage();
    }catch(error){
      const currentMessage=document.getElementById('auth-message');
      if(currentMessage)currentMessage.innerHTML='<div class="flash error">'+esc(error.message)+'</div>';
    }finally{
      if(form.isConnected){
        delete form.dataset.submitting;
        if(button){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML='تسجيل الدخول '+icon('arrow');}
      }
    }
  }
  if(e.target.id==='setup-form'){
    e.preventDefault();const fd=new FormData(e.target);const data={chair:{name:fd.get('chairName'),username:fd.get('chairUsername'),password:fd.get('chairPassword')},director:{name:fd.get('directorName'),username:fd.get('directorUsername'),password:fd.get('directorPassword')}};const msg=document.getElementById('auth-message');
    try{await api('/api/setup',{method:'POST',body:JSON.stringify(data)});toast('تم إنشاء الحسابين. سجّل الدخول للمتابعة.');renderLogin('اكتمل الإعداد الأولي. سجّل الدخول بحسابك.');}
    catch(error){if(msg)msg.innerHTML='<div class="flash error">'+esc(error.message)+'</div>';}
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='teacher-search'||e.target.id==='teacher-filter')filterTeachers();
  if(e.target.id==='evaluation-search')applyEvaluationFilters().catch(()=>{});
  if(e.target.closest('#evaluation-form')&&e.target.type==='number'){
    const criterion=criteria.find(c=>e.target.name===`score-${c.key}`);
    if(criterion&&e.target.value.trim()){
      const entered=Number(e.target.value);
      if(Number.isFinite(entered)&&entered>criterion.max)e.target.value=String(criterion.max);
      else if(Number.isFinite(entered)&&entered<0)e.target.value='0';
    }
    let sum=0,valid=true;for(const c of criteria){const input=document.querySelector(`[name="score-${c.key}"]`);if(!input.value.trim()){valid=false;continue;}const n=Number(input.value);if(!Number.isFinite(n)||n<0||n>c.max)valid=false;else sum+=n;}
    const average=Math.round(sum/criteria.length*100)/100;const total=document.getElementById('evaluation-total');if(total)total.textContent=formatPercent(average)+(valid&&average<7?' · إنذار تلقائي':'');
  }
});
document.addEventListener('change',e=>{if(e.target.id==='dashboard-period'){state.dashboardPeriod=e.target.value;renderPage();return;}
  if(e.target.matches('#evaluation-form [name="date"]'))refreshTeacherChoices(e.target.value).catch(error=>toast(error.message,'error'));
});
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;if(el.dataset.busy==='1')return;const instantActions=new Set(['navigate','open-teacher-modal','open-evaluation-modal','edit-teacher','edit-evaluation','save-teacher','save-evaluation','delete-teacher','save-directive','warning-review','load-report','export-csv','filter-evaluations','delete-evaluation','delete-selected-evaluations']);if(instantActions.has(action)){el.dataset.busy='1';el.classList.add('is-busy');el.setAttribute('aria-busy','true');}
  try{
    if(action==='navigate'){state.page=el.dataset.page;state.mobileOpen=false;state.teacherId=null;await renderPage();}
    else if(action==='toggle-menu'){state.mobileOpen=!state.mobileOpen;document.getElementById('sidebar')?.classList.toggle('open',state.mobileOpen);}
    else if(action==='toggle-push-notifications'){await togglePushNotifications(el);}
    else if(action==='logout'){await api('/api/logout',{method:'POST',body:'{}'});localStorage.removeItem('adaa_session');state.user=null;state.page='dashboard';renderLogin();}
    else if(action==='open-teacher-modal'){await openTeacherModal();}
    else if(action==='edit-teacher'){await openTeacherModal(el.dataset.id);}
    else if(action==='delete-teacher'){
      const teacherName=el.closest('tr')?.querySelector('.teacher-cell strong')?.textContent||document.querySelector('.profile-name')?.textContent||'هذا المدرس';
      if(!window.confirm(`حذف ملف «${teacherName}» من قائمة المعلمين؟ سيمنع ذلك تقييمات جديدة لهذا المدرس، مع الاحتفاظ بالتقييمات والإنذارات وسجل التعديلات السابق.`))return;
      await api(`/api/teachers/${el.dataset.id}`,{method:'DELETE'});state.page='teachers';state.teacherId=null;toast('تم حذف الملف من القائمة مع الاحتفاظ بسجلاته السابقة.');await renderPage();
    }
    else if(action==='save-teacher'){
      if(state.modalBusy)return;const form=document.getElementById('teacher-form');if(!form.reportValidity())return;state.modalBusy=true;el.disabled=true;
      const fd=new FormData(form);const data=Object.fromEntries(fd.entries());
      try{if(el.dataset.id)await api(`/api/teachers/${el.dataset.id}`,{method:'PUT',body:JSON.stringify(data)});else await api('/api/teachers',{method:'POST',body:JSON.stringify(data)});state.modalBusy=false;state.modal='';toast(el.dataset.id?'تم تحديث ملف المدرس.':'تم إنشاء ملف المدرس.');await renderPage();}
      catch(error){state.modalBusy=false;el.disabled=false;document.getElementById('form-error').innerHTML=`<div class="flash error">${esc(error.message)}</div>`;}
    }
    else if(action==='open-evaluation-modal'){await openEvaluationModal(el.dataset.teacherId||null);}
    else if(action==='edit-evaluation'){const id=el.dataset.id;document.querySelector('.modal-backdrop')?.remove();await openEvaluationModal(null,null,id);}
    else if(action==='delete-evaluation'){
      const teacher=el.dataset.teacherName||'هذا المدرس',date=el.dataset.date||'';
      if(!window.confirm(`حذف تقييم «${teacher}» بتاريخ ${date}؟ سيُحذف معه الإنذار وسجل التعديلات المرتبطان به.`))return;
      await api(`/api/evaluations/${el.dataset.id}`,{method:'DELETE'});
      toast('تم حذف التقييم.');await renderPage();
    }
    else if(action==='delete-selected-evaluations'){
      const ids=[...document.querySelectorAll('[data-evaluation-select]:checked')].map(box=>Number(box.value));
      if(!ids.length)return;
      if(!window.confirm(`حذف ${ids.length} تقييمًا محددًا مع الإنذارات وسجل التعديلات المرتبط بها؟ لا يمكن التراجع عن الحذف.`))return;
      const result=await api('/api/evaluations/bulk-delete',{method:'POST',body:JSON.stringify({ids})});
      toast(`تم حذف ${result.deleted||ids.length} تقييمًا.`);await renderPage();
    }
    else if(action==='save-evaluation'){
      if(state.modalBusy)return;const form=document.getElementById('evaluation-form');if(!form.reportValidity())return;
      const fd=new FormData(form);const saveButton=document.querySelector('[data-action="save-evaluation"]');const data={teacherId:Number(fd.get('teacherId')),date:fd.get('date'),replace:saveButton?.dataset.replace==='1',criteria:{}};
      for(const c of criteria){const value=fd.get(`score-${c.key}`);if(!String(value||'').trim()){document.getElementById('form-error').innerHTML='<div class="flash error">أدخل درجة أمام كل معيار.</div>';return;}data.criteria[c.key]={score:Number(value),comment:fd.get(`comment-${c.key}`),deductionReason:fd.get(`reason-${c.key}`)};}
      for(const key of ['strengths','weaknesses','behaviorNote','goalsNote','teachingNote','generalNote'])data[key]=fd.get(key);
      state.modalBusy=true;el.disabled=true;
      try{const result=await api('/api/evaluations',{method:'POST',body:JSON.stringify(data)});state.modalBusy=false;state.modal='';toast(result.updated?'تم تحديث تقييم هذا اليوم وسُجل التعديل.':'تم حفظ التقييم اليومي.');await renderPage();}
      catch(error){state.modalBusy=false;el.disabled=false;document.getElementById('form-error').innerHTML=`<div class="flash error">${esc(error.message)}</div>`;}
    }
    else if(action==='open-profile'){state.teacherId=el.dataset.id;state.page='profile';await renderPage();}
    else if(action==='why'){await openWhy(el.dataset.id);}
    else if(action==='close-modal'){state.modal='';document.querySelector('.modal-backdrop')?.remove();}
    else if(action==='backdrop'&&e.target===el){state.modal='';el.remove();}
    else if(action==='profile-tab'){await profileTab(el.dataset.tab);}
    else if(action==='warning-review'){await api(`/api/warnings/${el.dataset.id}/seen`,{method:'POST',body:'{}'});await openWhy(el.dataset.evalId);}
    else if(action==='save-directive'){
      const directive=document.getElementById('directive-input').value;await api(`/api/evaluations/${el.dataset.id}/directive`,{method:'PUT',body:JSON.stringify({directive})});toast('تم حفظ التوجيه الإداري.');await openWhy(el.dataset.id);document.querySelectorAll('.modal-backdrop').item(0)?.remove();
    }
    else if(action==='filter-evaluations')await applyEvaluationFilters();
    else if(action==='load-report')await loadReport();
    else if(action==='export-csv')await exportCsv();
    else if(action==='print-report')window.print();
  }catch(error){if(error.message!=='انتهت الجلسة.')toast(error.message,'error');}finally{if(el.dataset.busy==='1'){el.dataset.busy='0';el.classList.remove('is-busy');el.removeAttribute('aria-busy');if(el.isConnected&&!el.closest('.modal-backdrop'))el.disabled=false;}}
});
document.addEventListener('change',e=>{
  if(e.target.id==='select-all-evaluations'){
    document.querySelectorAll('[data-evaluation-select]').forEach(box=>{box.checked=e.target.checked;});
    updateEvaluationSelection();
  }else if(e.target.matches?.('[data-evaluation-select]'))updateEvaluationSelection();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const modal=document.querySelector('.modal-backdrop');if(modal){modal.remove();state.modal='';}else if(state.mobileOpen){state.mobileOpen=false;document.getElementById('sidebar')?.classList.remove('open');}}});
setInterval(async()=>{
  if(!state.user||document.hidden)return;
  try{
    const data=await api(`/api/dashboard?date=${dateInputValue()}`);const previous=state.dashboard?.warningCount||0;state.dashboard=data;
    const navButton=document.querySelector('.nav-btn[data-page="warnings"]');let badge=navButton?.querySelector('.nav-count');
    if(data.warningCount>0){if(!badge&&navButton){badge=document.createElement('span');badge.className='nav-count';navButton.append(badge);}if(badge)badge.textContent=data.warningCount>9?'9+':String(data.warningCount);}
    else badge?.remove();
    if(data.warningCount>previous)toast(`تم تسجيل ${data.warningCount-previous} إنذار جديد. راجع سجل الإنذارات.`, 'error');
  }catch{}
},60000);
boot();
