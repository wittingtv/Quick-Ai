/* ═══════════════════════════════════════════════════════════
   iStore — Utilities Layer
   ✅ Sanitization · Storage · Themes · Modals · i18n · Toasts
   ❌ Not included: Firebase integration, app CRUD, uploads,
      downloads, auth, comments — those power the store itself.
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ────────────── 1. SANITIZATION (XSS Prevention) ────────────── */
const Sanitizer = {
  html(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    }[c]));
  },
  url(str) {
    try {
      const u = new URL(String(str));
      return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
    } catch { return ''; }
  },
  filename(str) {
    return String(str || '').replace(/[^\w.\- ]/g, '_').slice(0, 200);
  }
};

/* ────────────── 2. STORAGE (Safe localStorage wrapper) ────────────── */
const Store = {
  key(k) { return 'istore:' + k; },
  get(k, fallback = null) {
    try {
      const v = localStorage.getItem(this.key(k));
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(this.key(k), JSON.stringify(v)); return true; }
    catch { return false; }
  },
  remove(k) { try { localStorage.removeItem(this.key(k)); } catch {} },
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('istore:'))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};

/* ────────────── 3. TOAST NOTIFICATIONS ────────────── */
const Toast = {
  show(message, type = 'info', duration = 3000) {
    const stack = document.getElementById('notifStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `notif ${type}`;
    el.textContent = Sanitizer.html(message);
    el.innerHTML = `<span>${Sanitizer.html(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, duration);
  },
  success(m, d) { this.show(m, 'success', d); },
  error(m, d) { this.show(m, 'error', d); },
  warn(m, d) { this.show(m, 'warning', d); }
};

/* ────────────── 4. THEME SYSTEM ────────────── */
const Theme = {
  themes: ['dark', 'light', 'gold', 'algeria', 'redblack', 'sea'],
  apply(name) {
    if (!this.themes.includes(name)) name = 'dark';
    document.documentElement.setAttribute('data-theme', name);
    Store.set('theme', name);
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.theme === name);
    });
    const val = document.getElementById('stgThemeValue');
    if (val) val.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  },
  current() { return Store.get('theme', 'dark'); },
  init() { this.apply(this.current()); }
};

function selectTheme(name) { Theme.apply(name); }
function openThemeSheet() {
  const m = document.getElementById('themeModal');
  if (m) { m.classList.add('open'); Theme.apply(Theme.current()); }
}

/* ────────────── 5. MODAL SYSTEM ────────────── */
const Modal = {
  open(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
  },
  closeAll() {
    document.querySelectorAll('.modal.open, .bottom-sheet-modal.open')
      .forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
};

function openModal(id) { Modal.open(id); }
function closeModal(id) { Modal.close(id); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) Modal.closeAll();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Modal.closeAll();
});

/* ────────────── 6. i18n (Language) ────────────── */
const I18N = {
  en: {
    searchPlaceholder: 'Search any app, game or tool...',
    navToday: 'Today', navGames: 'Games', navApps: 'Apps', navTools: 'Tools',
    settings: 'Settings', signIn: 'Sign In', cancel: 'Cancel', close: 'Close',
    theme: 'Theme', language: 'Language', darkMode: 'Dark Mode'
  },
  ar: {
    searchPlaceholder: 'ابحث عن تطبيق، لعبة أو أداة...',
    navToday: 'اليوم', navGames: 'ألعاب', navApps: 'تطبيقات', navTools: 'أدوات',
    settings: 'الإعدادات', signIn: 'تسجيل الدخول', cancel: 'إلغاء', close: 'إغلاق',
    theme: 'الثيم', language: 'اللغة', darkMode: 'الوضع الداكن'
  }
};

const I18n = {
  current() { return Store.get('lang', 'en'); },
  apply(lang) {
    if (!I18N[lang]) lang = 'en';
    Store.set('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[lang][key]) el.textContent = I18N[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (I18N[lang][key]) el.placeholder = I18N[lang][key];
    });
    const val = document.getElementById('stgLanguageValue');
    if (val) val.textContent = lang === 'ar' ? 'العربية' : 'English';
  },
  init() { this.apply(this.current()); }
};

function changeLanguage(lang) { I18n.apply(lang); }

/* ────────────── 7. SETTINGS PAGE ────────────── */
function openSettings() {
  const page = document.getElementById('settingsPage');
  if (page) { page.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeSettingsPage() {
  const page = document.getElementById('settingsPage');
  if (page) { page.classList.remove('open'); document.body.style.overflow = ''; }
}

function openActivitiesPage() {
  const page = document.getElementById('activitiesPage');
  if (page) { page.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeActivitiesPage() {
  const page = document.getElementById('activitiesPage');
  if (page) { page.classList.remove('open'); document.body.style.overflow = ''; }
}

function openLoginPage() {
  const page = document.getElementById('loginPage');
  if (page) { page.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeLoginPage() {
  const page = document.getElementById('loginPage');
  if (page) { page.classList.remove('open'); document.body.style.overflow = ''; }
}

function openDMCAPage() {
  const page = document.getElementById('dmcaPage');
  if (page) { page.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeDMCAPage() {
  const page = document.getElementById('dmcaPage');
  if (page) { page.classList.remove('open'); document.body.style.overflow = ''; }
}

/* ────────────── 8. TOGGLE SETTINGS (functional) ────────────── */
function toggleSetting(key) {
  const current = Store.get('settings', {})[key] ?? false;
  const next = !current;
  const settings = Store.get('settings', {});
  settings[key] = next;
  Store.set('settings', settings);

  const btn = document.getElementById('stg' + key.charAt(0).toUpperCase() + key.slice(1));
  if (btn) btn.classList.toggle('on', next);

  if (key === 'darkMode') {
    Theme.apply(next ? 'dark' : 'light');
  }
}

function loadSettings() {
  const settings = Store.get('settings', {});
  Object.entries(settings).forEach(([key, val]) => {
    const btn = document.getElementById('stg' + key.charAt(0).toUpperCase() + key.slice(1));
    if (btn) btn.classList.toggle('on', !!val);
  });
}

/* ────────────── 9. SEARCH OVERLAY (UI only) ────────────── */
function openSearchOverlay() {
  const o = document.getElementById('searchOverlay');
  if (!o) return;
  o.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('searchOverlayInput')?.focus(), 150);
}
function closeSearchOverlay() {
  const o = document.getElementById('searchOverlay');
  if (!o) return;
  o.classList.remove('open');
  document.body.style.overflow = '';
}
function clearSearchOverlay() {
  const i = document.getElementById('searchOverlayInput');
  if (i) { i.value = ''; i.focus(); }
}

/* ────────────── 10. AI CHAT (UI shell) ────────────── */
function openAiChat() {
  const d = document.getElementById('aiChatDrawer');
  if (d) { d.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeAiChat() {
  const d = document.getElementById('aiChatDrawer');
  if (d) { d.classList.remove('open'); document.body.style.overflow = ''; }
}
function sendQuickAction() { /* to be implemented */ }
function sendAiMessage() { /* to be implemented */ }

/* ────────────── 11. SUPPORT MENU ────────────── */
function toggleSupportMenu() {
  const items = document.getElementById('supportMenuItems');
  const chevron = document.getElementById('supportMenuChevron');
  if (!items) return;
  const open = items.classList.toggle('open');
  if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
}
function closeSupportMenu() {
  const items = document.getElementById('supportMenuItems');
  const chevron = document.getElementById('supportMenuChevron');
  if (items) items.classList.remove('open');
  if (chevron) chevron.style.transform = '';
}

/* ────────────── 12. STG CHOICE MODAL ────────────── */
function openStgChoice(title, options) {
  const modal = document.getElementById('stgChoiceModal');
  const titleEl = document.getElementById('stgChoiceTitle');
  const listEl = document.getElementById('stgChoiceList');
  if (!modal || !listEl) return;
  if (titleEl) titleEl.textContent = title;
  listEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'stg-modal-item';
    btn.textContent = opt.label; // textContent is safe
    btn.onclick = () => { opt.onSelect(); closeStgChoice(); };
    listEl.appendChild(btn);
  });
  modal.classList.add('open');
}
function closeStgChoice() {
  document.getElementById('stgChoiceModal')?.classList.remove('open');
}

/* ────────────── 13. INIT ────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  I18n.init();
  loadSettings();

  // Splash screen
  const splash = document.getElementById('splashScreen');
  if (splash) {
    splash.style.display = 'flex';
    setTimeout(() => {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.5s';
      setTimeout(() => splash.remove(), 500);
    }, 1200);
  }
});
