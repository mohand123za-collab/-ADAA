// تنبيهات النظام للتقييمات المنخفضة عبر Web Push.
let pushRegistrationPromise = null;
let pushBusy = false;

function isAppleMobileForPush() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneForPush() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function pushPublicKeyBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

function getPushRegistration() {
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    return Promise.reject(new Error('تعمل الإشعارات على اتصال HTTPS آمن فقط.'));
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return Promise.reject(new Error('هذا المتصفح لا يدعم الإشعارات خارج التطبيق.'));
  }
  if (!pushRegistrationPromise) {
    const base = new URL('./', document.baseURI);
    pushRegistrationPromise = navigator.serviceWorker.register(new URL('sw.js', base).href, { scope: base.pathname })
      .catch(error => { pushRegistrationPromise = null; throw error; });
  }
  return pushRegistrationPromise;
}

async function syncPushButton() {
  const button = document.getElementById('push-notifications-button');
  if (!button) return;
  button.hidden = !state.user;
  if (!state.user) return;
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    button.disabled = true;
    button.dataset.enabled = '0';
    button.title = 'يلزم فتح الموقع عبر HTTPS لتفعيل الإشعارات.';
    button.innerHTML = icon('bell') + '<span>إشعارات التقييم</span>';
    return;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    button.disabled = true;
    button.dataset.enabled = '0';
    button.title = 'الإشعارات خارج التطبيق غير مدعومة في هذا المتصفح.';
    button.innerHTML = icon('bell') + '<span>الإشعارات غير مدعومة</span>';
    return;
  }
  if (isAppleMobileForPush() && !isStandaloneForPush()) {
    button.disabled = false;
    button.dataset.enabled = '0';
    button.title = 'أضف التطبيق إلى الشاشة الرئيسية أولًا، ثم افتحه وفعّل الإشعارات.';
    button.innerHTML = icon('bell') + '<span>تفعيل التنبيهات</span>';
    return;
  }
  button.disabled = false;
  try {
    const registration = await getPushRegistration();
    const subscription = await registration.pushManager.getSubscription();
    button.dataset.enabled = subscription ? '1' : '0';
    button.innerHTML = icon('bell') + '<span>' + (subscription ? 'إيقاف التنبيهات' : 'تفعيل تنبيهات التقييم') + '</span>';
    button.title = subscription ? 'إيقاف الإشعارات على هذا الجهاز' : 'استلام إشعار عند تسجيل تقييم أقل من 70٪';
  } catch (error) {
    button.dataset.enabled = '0';
    button.title = error.message || 'تعذر تهيئة خدمة الإشعارات.';
  }
}

async function togglePushNotifications(button) {
  if (pushBusy) return;
  pushBusy = true;
  button.disabled = true;
  let permissionRequest = null;
  try {
    if (isAppleMobileForPush() && !isStandaloneForPush()) {
      throw new Error('على iPhone أو iPad: أضف الموقع إلى الشاشة الرئيسية وافتح التطبيق منها أولًا.');
    }
    if (button.dataset.enabled !== '1' && Notification.permission === 'default') {
      // طلب الإذن فور ضغطة المستخدم حتى لا يفقد المتصفح سياق التفاعل.
      permissionRequest = Notification.requestPermission();
    }
    const registration = await getPushRegistration();
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await api('/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: existing.endpoint })
      });
      await existing.unsubscribe();
      toast('تم إيقاف التنبيهات على هذا الجهاز.');
    } else {
      const permission = permissionRequest ? await permissionRequest : Notification.permission;
      if (permission !== 'granted') {
        throw new Error(permission === 'denied'
          ? 'الإشعارات محظورة من إعدادات المتصفح. اسمح بها للموقع ثم أعد المحاولة.'
          : 'لم يتم السماح بإرسال الإشعارات.');
      }
      const result = await api('/api/push/vapid-public-key');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: pushPublicKeyBytes(result.publicKey)
      });
      try {
        await api('/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription.toJSON ? subscription.toJSON() : subscription)
        });
      } catch (error) {
        await subscription.unsubscribe();
        throw error;
      }
      toast('تم تفعيل التنبيهات على هذا الجهاز.');
    }
  } catch (error) {
    toast(error.message || 'تعذر تفعيل التنبيهات.', 'error');
  } finally {
    pushBusy = false;
    if (button.isConnected) {
      await syncPushButton();
      button.disabled = false;
    }
  }
}
