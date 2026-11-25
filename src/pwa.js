// يتيح زر الصفحة استخدام نافذة التثبيت الأصلية، مع إرشادات للمتصفحات الأخرى.
let installPromptEvent = null;
const installAppButton = document.getElementById('install-app-button');

function isInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function hideInstallButton() {
  if (installAppButton) installAppButton.hidden = true;
}

function showManualInstallGuide() {
  const ua = navigator.userAgent || '';
  const isAppleMobile = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isAppleMobile) {
    window.alert('للتثبيت على iPhone أو iPad: افتح الموقع في Safari، اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية».');
  } else if (/Android/i.test(ua)) {
    window.alert('للتثبيت على Android: افتح قائمة المتصفح (⋮)، ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».');
  } else if (/Macintosh|MacIntel/i.test(ua)) {
    window.alert('على الكمبيوتر: استخدم رمز التثبيت في شريط العنوان، أو من Safari اختر File ثم Add to Dock.');
  } else {
    window.alert('على الكمبيوتر: استخدم رمز التثبيت بجوار شريط العنوان في Chrome أو Edge، أو افتح قائمة المتصفح واختر «تثبيت التطبيق».');
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPromptEvent = event;
  if (installAppButton) installAppButton.hidden = false;
});

window.addEventListener('appinstalled', () => {
  installPromptEvent = null;
  hideInstallButton();
});

installAppButton?.addEventListener('click', async () => {
  if (!installPromptEvent) {
    showManualInstallGuide();
    return;
  }

  const promptEvent = installPromptEvent;
  installPromptEvent = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === 'accepted') hideInstallButton();
  } catch {
    showManualInstallGuide();
  }
});

if (isInstalledApp()) hideInstallButton();
