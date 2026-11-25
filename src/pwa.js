// يعرض زر التثبيت أسفل تسجيل الخروج ويتعامل مع نافذة التثبيت وإرشادات المتصفحات الأخرى.
let installPromptEvent = null;
let installedDuringSession = false;
const installedFlag = 'adaa_pwa_installed';

function getInstallButton() {
  return document.getElementById('install-app-button');
}

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

async function isPwaInstalled() {
  if (installedDuringSession || isStandaloneApp()) return true;

  let savedInstallFlag = false;
  try {
    savedInstallFlag = localStorage.getItem(installedFlag) === 'true';
  } catch {}

  if (typeof navigator.getInstalledRelatedApps === 'function') {
    try {
      const relatedApps = await navigator.getInstalledRelatedApps();
      const installed = relatedApps.some(app => app.platform === 'webapp');
      if (installed) return true;
      if (savedInstallFlag) localStorage.removeItem(installedFlag);
      return false;
    } catch {
      return savedInstallFlag;
    }
  }

  return savedInstallFlag;
}

async function syncInstallButton() {
  const button = getInstallButton();
  if (!button) return;
  if (installPromptEvent) {
    button.hidden = false;
    return;
  }
  button.hidden = await isPwaInstalled();
}

function hideInstallButton() {
  const button = getInstallButton();
  if (button) button.hidden = true;
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
  installedDuringSession = false;
  try { localStorage.removeItem(installedFlag); } catch {}
  const button = getInstallButton();
  if (button) button.hidden = false;
});

window.addEventListener('appinstalled', () => {
  installPromptEvent = null;
  installedDuringSession = true;
  try { localStorage.setItem(installedFlag, 'true'); } catch {}
  hideInstallButton();
});

document.addEventListener('click', async event => {
  const button = event.target.closest('#install-app-button');
  if (!button) return;

  if (!installPromptEvent) {
    showManualInstallGuide();
    return;
  }

  const promptEvent = installPromptEvent;
  installPromptEvent = null;
  button.disabled = true;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === 'accepted') {
      installedDuringSession = true;
      try { localStorage.setItem(installedFlag, 'true'); } catch {}
      hideInstallButton();
    }
  } catch {
    showManualInstallGuide();
  } finally {
    if (button.isConnected) button.disabled = false;
  }
});
