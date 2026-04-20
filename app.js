'use strict';

const BUILD = '2026-04-18.1';

const firebaseConfig = {
  apiKey: 'AIzaSyCO8QV3OTNLFmaeVjJ7tDDL9vbiEoiIsLk',
  authDomain: 'db-musicala-fsa.firebaseapp.com',
  projectId: 'db-musicala-fsa',
  storageBucket: 'db-musicala-fsa.firebasestorage.app',
  messagingSenderId: '611214393967',
  appId: '1:611214393967:web:6b0eca59b0ced50c78839a'
};

const HUB = {
  name: 'HUB Lideres FSA',
  subtitle: 'Panel de coordinacion y seguimiento',
  centerName: 'GMMMC',
  users: {
    'alekcaballeromusic@gmail.com': {
      label: 'Alek Caballero',
      role: 'admin'
    },
    'catalina.medina.leal@gmail.com': {
      label: 'Catalina Medina',
      role: 'admin'
    },
    'tsocialgs@fundacionsanantonio.org': {
      label: 'Andrea Herrera',
      role: 'lider'
    }
    // Agrega aqui los perfiles faltantes (lideres y docentes):
    // 'lider@dominio.com': { label: 'Nombre Lider', role: 'leader' },
    // 'docente@dominio.com': { label: 'Nombre Docente', role: 'teacher' }
  },
  links: {
    academicDocs: 'https://musicala.github.io/explicacionartes/',
    protocols: '',
    annualSchedule: '',
    supportMail: 'mailto:alekcaballeromusic@gmail.com?subject=Soporte%20HUB%20Lideres%20FSA',
    team: 'https://musicala.github.io/perfilesmusicala//'
  },
  buttons: [
    { id: 'calendar', icon: '\uD83D\uDCC5', title: 'Calendario', subtitle: 'Eventos y agenda del centro', section: 'Operacion diaria', kind: 'module' },
    { id: 'schedule', icon: '\uD83D\uDCCB', title: 'Horario docentes', subtitle: 'Consulta de horario del equipo docente', section: 'Operacion diaria', kind: 'module', roles: ['admin', 'leader'] },
    { id: 'punctuality', icon: '\u23F1', title: 'Registro de puntualidad', subtitle: 'Seguimiento del equipo docente', section: 'Operacion diaria', kind: 'module' },
    { id: 'attendance', icon: '\uD83D\uDCDD', title: 'Informe de asistencia', subtitle: 'Lectura de registros por clase', section: 'Operacion diaria', kind: 'module' },
    { id: 'students', icon: '\uD83D\uDC65', title: 'Lista de estudiantes', subtitle: 'Listado general del centro', section: 'Operacion diaria', kind: 'module' },

    { id: 'logs', icon: '\uD83D\uDCD2', title: 'Bitacoras de clase', subtitle: 'Consulta de bitacoras guardadas', section: 'Seguimiento academico', kind: 'module' },
    { id: 'diagnostics', icon: '\uD83E\uDDEA', title: 'Diagnosticos', subtitle: 'Seguimiento diagnostico y observaciones', section: 'Seguimiento academico', kind: 'module' },
    { id: 'projects', icon: '\uD83E\uDDE9', title: 'Proyectos', subtitle: 'Planeaciones y proyectos activos', section: 'Seguimiento academico', kind: 'module' },
    { id: 'samples', icon: '\uD83C\uDFAD', title: 'Muestras de proceso', subtitle: 'Evidencias y preparacion', section: 'Seguimiento academico', kind: 'module' },

    { id: 'gallery', icon: '\uD83D\uDDBC', title: 'Galeria de imagenes', subtitle: 'Consulta de evidencias visuales', section: 'Equipo y recursos', kind: 'module' },
    { id: 'team', icon: '\uD83D\uDC69\u200D\uD83C\uDFEB', title: 'Perfil equipo de docentes', subtitle: 'Perfiles del equipo docente', section: 'Equipo y recursos', kind: 'link' },
    { id: 'academicDocs', icon: '\uD83D\uDCDA', title: 'Documentos academicos', subtitle: 'Explicacion de lo que hacemos en Musicala', section: 'Equipo y recursos', kind: 'link' },
    { id: 'protocols', icon: '\uD83D\uDEE1', title: 'Protocolos', subtitle: 'Documentos y guias operativas', section: 'Equipo y recursos', kind: 'link' }
  ]
};

const COLLECTIONS = {
  calendar: 'calendarEvents',
  calendarLegacy: 'calendar2026',
  schedules: 'leaderSchedules',
  punctuality: 'teacherShifts',
  attendance: 'attendanceSessions',
  students: 'students',
  logs: 'classLogs',
  team: 'teacherProfiles',
  gallery: 'galleryImages',
  diagnostics: 'diagnostics',
  projects: 'projects',
  samples: 'processSamples'
};

const CORE_BUTTON_IDS = ['schedule', 'students', 'attendance', 'logs'];
const MODAL_IDS = ['modal-search', 'modal-favorites', 'modal-workspace'];
const LOCAL_KEYS = {
  recent: 'musicala_lideres_recent',
  favorites: 'musicala_lideres_favorites'
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let DB = null;
let AUTH = null;
let CURRENT_USER = null;
let ACTIVE_EMAIL = '';
let ACTIVE_PROFILE = null;
let deferredInstallPrompt = null;
let toastTimer = null;
let searchBound = false;
let drawerBound = false;
let modalBound = false;
let workspaceBound = false;
let scheduleEditorState = { editingId: '', placeListEditing: false, placeDraft: [], areaListEditing: false, areaDraft: [] };
let calendarEditorState = { editingId: '' };

const STATE = {
  currentModule: '',
  recentIds: [],
  favorites: [],
  filters: {
    search: '',
    attendanceStatus: 'all',
    scheduleTeacher: 'all',
    calendarYear: String(new Date().getFullYear()),
    calendarMonth: String(new Date().getMonth() + 1),
    logsArea: 'all',
    logsIndex: 0
  },
  data: {
    calendar: { loaded: false, items: [] },
    schedule: { loaded: false, items: [] },
    punctuality: { loaded: false, items: [] },
    attendance: { loaded: false, items: [] },
    students: { loaded: false, items: [] },
    logs: { loaded: false, items: [] },
    team: { loaded: false, items: [] },
    gallery: { loaded: false, items: [] },
    diagnostics: { loaded: false, items: [] },
    projects: { loaded: false, items: [] },
    samples: { loaded: false, items: [] }
  },
  settings: {
    scheduleDays: { loaded: false, items: [] },
    schedulePlaces: { loaded: false, items: [] },
    scheduleAreas: { loaded: false, items: [] }
  }
};

const ROLE_LABELS = {
  admin: 'Admin',
  leader: 'Lider',
  teacher: 'Docente'
};

const DEFAULT_SCHEDULE_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const SETTINGS = {
  scheduleDaysCollection: 'hubSettings',
  scheduleDaysDocId: 'scheduleDays',
  schedulePlacesDocId: 'schedulePlaces',
  scheduleAreasDocId: 'scheduleAreas'
};
const CLEAN_DEFAULT_SCHEDULE_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const DEFAULT_SCHEDULE_PLACES = ['Sede principal', 'Salon 1', 'Salon 2'];
const DEFAULT_SCHEDULE_AREAS = ['Porras', 'Danzas'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function fixMojibakeText(value) {
  let text = String(value ?? '');
  const replacements = [
    ['Â·', ' - '],
    ['Â', ''],
    ['Ã¡', 'a'], ['Ã©', 'e'], ['Ã­', 'i'], ['Ã³', 'o'], ['Ãº', 'u'], ['Ã±', 'n'],
    ['Ã', 'A'], ['Ã‰', 'E'], ['Ã', 'I'], ['Ã“', 'O'], ['Ãš', 'U'], ['Ã‘', 'N'],
    ['â€¦', '...'], ['â€“', '-'], ['â€”', '-'], ['â€™', "'"], ['â€œ', '"'], ['â€', '"'],
    ['â˜°', '☰'], ['âœ•', '×'], ['â˜‘', '☑'], ['âŒ‚', '⌂'], ['â—«', '◫'], ['â–¤', '▤']
  ];
  replacements.forEach(([from, to]) => {
    text = text.split(from).join(to);
  });
  return text;
}

let sanitizeUiTimer = null;
function sanitizeUiMojibake() {
  if (sanitizeUiTimer) clearTimeout(sanitizeUiTimer);
  sanitizeUiTimer = setTimeout(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const original = node.nodeValue || '';
      const fixed = fixMojibakeText(original);
      if (fixed !== original) node.nodeValue = fixed;
    });

    const attrTargets = document.querySelectorAll('[title],[placeholder],[aria-label]');
    attrTargets.forEach((el) => {
      ['title', 'placeholder', 'aria-label'].forEach((attr) => {
        const raw = el.getAttribute(attr);
        if (raw == null) return;
        const fixed = fixMojibakeText(raw);
        if (fixed !== raw) el.setAttribute(attr, fixed);
      });
    });
  }, 30);
}

function normalizeDayLabel(value) {
  const text = normalizeText(value);
  if (!text) return '';
  const lower = text.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

function safeLower(value) {
  return normalizeText(value).toLowerCase();
}

function slugify(value) {
  return safeLower(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function emailKey(user) {
  return safeLower(user?.email || '');
}

function currentRecentKey() {
  return `${LOCAL_KEYS.recent}_${ACTIVE_EMAIL || 'guest'}`;
}

function currentFavoritesKey() {
  return `${LOCAL_KEYS.favorites}_${ACTIVE_EMAIL || 'guest'}`;
}

function getRecentIds() {
  return lsGet(currentRecentKey(), []) || [];
}

function pushRecentId(id) {
  if (!id || !ACTIVE_EMAIL) return;
  const next = [id, ...getRecentIds().filter((item) => item !== id)].slice(0, 8);
  STATE.recentIds = next;
  lsSet(currentRecentKey(), next);
}

function getFavoriteIds() {
  return lsGet(currentFavoritesKey(), []) || [];
}

function setFavoriteIds(ids) {
  STATE.favorites = [...new Set(ids.filter(Boolean))];
  lsSet(currentFavoritesKey(), STATE.favorites);
}

function toggleFavorite(id) {
  const current = new Set(getFavoriteIds());
  if (current.has(id)) current.delete(id);
  else current.add(id);
  setFavoriteIds([...current]);
  renderFavoritesList();
  renderButtons();
}

function prettyName(user = CURRENT_USER, profile = ACTIVE_PROFILE) {
  return normalizeText(profile?.label || user?.displayName || user?.email || 'Lider');
}

function currentRole() {
  return safeLower(ACTIVE_PROFILE?.role || '');
}

function roleLabel(role = currentRole()) {
  return ROLE_LABELS[role] || 'Sin rol';
}

function isRole(role) {
  return currentRole() === role;
}

function canManageTeacherSchedules() {
  return isRole('admin');
}

function canManageCalendarEvents() {
  return isRole('admin');
}

function canViewButton(button) {
  if (!button) return false;
  if (!Array.isArray(button.roles) || !button.roles.length) return true;
  return button.roles.includes(currentRole());
}

function getVisibleButtons() {
  return HUB.buttons.filter(canViewButton);
}

function getCenterName() {
  return HUB.centerName || 'GMMMC';
}

function normalizeUrl(raw) {
  const url = normalizeText(raw);
  if (!url) return '';
  if (/^\s*(javascript|data|file):/i.test(url)) return '';
  if (/^(mailto|tel):/i.test(url)) return url;
  if (/^(https?:)?\/\//i.test(url)) return url;
  if (/^(\.?\/|\/)/.test(url)) return url;
  return `https://${url}`;
}

function openExternal(rawUrl) {
  const safe = normalizeUrl(rawUrl);
  if (!safe) {
    toast('Este acceso aÃºn no tiene enlace configurado.');
    return false;
  }

  if (/^(\.?\/|\/)/.test(safe)) {
    window.location.href = safe;
    return true;
  }

  if (/^(mailto|tel):/i.test(safe)) {
    window.location.href = safe;
    return true;
  }

  window.open(safe, '_blank', 'noopener,noreferrer');
  return true;
}

function pickToastEl() {
  return $('#toast-app') || $('#toast');
}

function toast(message, options = {}) {
  const el = pickToastEl();
  if (!el) return;

  const { actionText = '', onAction = null, sticky = false, ms = 2600 } = options;

  el.hidden = false;
  el.classList.remove('show');
  el.innerHTML = '';

  const msg = document.createElement('span');
  msg.className = 'toastMsg';
  msg.textContent = String(message || '');
  el.appendChild(msg);

  if (actionText) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toastBtn';
    btn.textContent = actionText;
    btn.addEventListener('click', () => {
      try {
        onAction && onAction();
      } finally {
        el.classList.remove('show');
      }
    });
    el.appendChild(btn);
  }

  requestAnimationFrame(() => el.classList.add('show'));

  clearTimeout(toastTimer);
  if (!sticky) {
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      if (el.id === 'toast-app') el.hidden = true;
    }, Math.max(1200, Number(ms) || 2600));
  }
}

function show(view) {
  const loginView = $('#view-login');
  const appView = $('#view-app');
  if (!loginView || !appView) return;

  if (view === 'login') {
    loginView.hidden = false;
    appView.hidden = true;
  } else {
    loginView.hidden = true;
    appView.hidden = false;
  }
}

function anyModalOpen() {
  return MODAL_IDS.some((id) => {
    const el = document.getElementById(id);
    return !!el && !el.hidden;
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = true;
  if (!isDrawerOpen() && !anyModalOpen()) {
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  MODAL_IDS.forEach((id) => {
    const modal = document.getElementById(id);
    if (modal) modal.hidden = true;
  });
  if (!isDrawerOpen()) {
    document.body.style.overflow = '';
  }
}

function scrollToTop() {
  const host = document.querySelector('.screen') || document.scrollingElement || document.documentElement;
  host?.scrollTo?.({ top: 0, behavior: 'smooth' });
}

function setBottomNavActive(tab) {
  $$('.dockTab').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function setHubCopy() {
  document.title = HUB.name;
  const titleIds = ['hub-title', 'app-title', 'drawer-hub-title'];
  titleIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = HUB.name;
  });

  const loginSubtitle = $('#hub-subtitle');
  const drawerSub = $('#drawer-hub-sub');
  const userLine = $('#user-line');

  if (loginSubtitle) loginSubtitle.textContent = 'Acceso con Google para usuarios autorizados';
  if (drawerSub) drawerSub.textContent = HUB.subtitle;
  if (userLine) userLine.textContent = `${getCenterName()} - seguimiento y coordinacion`;
}

function setNetPill() {
  const pill = $('#net-pill');
  if (!pill) return;

  const update = () => {
    const online = navigator.onLine !== false;
    pill.classList.toggle('offline', !online);
    pill.textContent = online ? 'Conectado' : 'Sin conexion';
  };

  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
}

function getButtonById(id) {
  return getVisibleButtons().find((button) => button.id === id) || null;
}

function groupButtonsBySection(buttons = getVisibleButtons()) {
  const map = new Map();
  buttons.forEach((button) => {
    const section = button.section || 'Accesos';
    if (!map.has(section)) map.set(section, []);
    map.get(section).push(button);
  });
  return map;
}

function getButtonStatus(button) {
  if (!button) return { badge: 'Abrir', subtitle: '', pending: false };

  if (button.kind === 'link') {
    const linked = normalizeText(HUB.links[button.id]);
    return {
      badge: linked ? 'Abrir' : 'Pendiente',
      subtitle: button.subtitle,
      pending: !linked
    };
  }

  const stateKey = button.id;
  const bucket = STATE.data[stateKey];
  if (!bucket?.loaded) {
    return { badge: 'Ver', subtitle: button.subtitle, pending: false };
  }

  const count = Array.isArray(bucket.items) ? bucket.items.length : 0;
  const labels = {
    calendar: `${count} eventos`,
    schedule: `${count} bloques`,
    punctuality: `${count} registros`,
    attendance: `${count} sesiones`,
    students: `${count} estudiantes`,
    logs: `${count} bitÃ¡coras`,
    team: `${count} perfiles`,
    gallery: `${count} imÃ¡genes`,
    diagnostics: `${count} diagnÃ³sticos`,
    projects: `${count} proyectos`,
    samples: `${count} muestras`
  };

  return {
    badge: 'Ver',
    subtitle: labels[stateKey] || button.subtitle,
    pending: false
  };
}

function renderButtons() {
  const grid = $('#grid');
  if (!grid) return;

  const groups = groupButtonsBySection();
  const favoriteSet = new Set(getFavoriteIds());
  const html = [];

  groups.forEach((items, section) => {
    html.push(`<div class="secBlock" style="grid-column:1 / -1;"><div class="secTitle">${escapeHtml(section)}</div></div>`);
    items.forEach((button) => {
      const status = getButtonStatus(button);
      const starred = favoriteSet.has(button.id);
      html.push(`
        <article class="tile ${status.pending ? 'pending' : ''}" data-id="${escapeHtml(button.id)}" role="button" tabindex="0" aria-label="${escapeHtml(button.title)}">
          <div class="tileTop">
            <div class="ico" aria-hidden="true">${escapeHtml(button.icon)}</div>
            <div class="tileActions">
              <button
                type="button"
                class="favMiniBtn"
                data-fav-toggle="${escapeHtml(button.id)}"
                aria-label="${starred ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                title="${starred ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
              >${starred ? '\u2605' : '\u2606'}</button>
              <span class="badge ${status.pending ? '' : 'ok'}">${escapeHtml(status.badge)}</span>
            </div>
          </div>
          <div class="tileText">
            <div class="tTitle">${escapeHtml(button.title)}</div>
            <div class="tSub">${escapeHtml(status.subtitle)}</div>
          </div>
        </article>
      `);
    });
  });

  grid.innerHTML = html.join('');
  sanitizeUiMojibake();

  if (!grid.__bound) {
    grid.__bound = true;

    grid.addEventListener('click', async (event) => {
      const favBtn = event.target.closest('[data-fav-toggle]');
      if (favBtn) {
        event.stopPropagation();
        toggleFavorite(favBtn.getAttribute('data-fav-toggle'));
        return;
      }

      const card = event.target.closest('[data-id]');
      if (!card) return;
      await triggerAccess(card.getAttribute('data-id'));
    });

    grid.addEventListener('keydown', async (event) => {
      const card = event.target.closest('[data-id]');
      if (!card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        await triggerAccess(card.getAttribute('data-id'));
      }
    });
  }
}

function renderSearchResultItem(button) {
  const status = getButtonStatus(button);
  return `
    <button class="modalItem" type="button" data-open-id="${escapeHtml(button.id)}">
      <div class="modalItemTitle">${escapeHtml(button.title)}</div>
      <div class="modalItemSub">${escapeHtml(button.section)} Â· ${escapeHtml(status.subtitle || button.subtitle)}</div>
    </button>
  `;
}

function renderSearchResults(queryText = '') {
  const container = $('#search-results');
  if (!container) return;

  const q = safeLower(queryText);
  const visibleButtons = getVisibleButtons();
  const filtered = !q
    ? visibleButtons
    : visibleButtons.filter((button) => {
        const haystack = safeLower(`${button.title} ${button.subtitle} ${button.section} ${button.id}`);
        return haystack.includes(q);
      });

  if (!filtered.length) {
    container.innerHTML = `<div class="muted">No encontrÃ© accesos con ese criterio.</div>`;
    return;
  }

  container.innerHTML = filtered.map(renderSearchResultItem).join('');
}

function renderFavoritesList() {
  const container = $('#favorites-list');
  if (!container) return;

  const favorites = getFavoriteIds().map(getButtonById).filter(Boolean);
  const buttons = favorites.length ? favorites : CORE_BUTTON_IDS.map(getButtonById).filter(Boolean);

  if (!buttons.length) {
    container.innerHTML = `<div class="muted">AÃºn no tienes favoritos.</div>`;
    return;
  }

  container.innerHTML = buttons.map(renderSearchResultItem).join('');
}

function openSearchModal() {
  renderSearchResults('');
  openModal('modal-search');
  const input = $('#search-input');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 0);
  }
}

function openFavoritesModal() {
  renderFavoritesList();
  openModal('modal-favorites');
}

function drawerEls() {
  return {
    btnMenu: $('#btn-menu'),
    drawer: $('#app-drawer'),
    overlay: $('#drawer-overlay'),
    btnClose: $('#drawer-close')
  };
}

function isDrawerOpen() {
  const { drawer, overlay } = drawerEls();
  return !!drawer && !!overlay && !drawer.hidden && !overlay.hidden;
}

function openDrawer() {
  const { drawer, overlay, btnClose, btnMenu } = drawerEls();
  if (!drawer || !overlay) return;
  overlay.hidden = false;
  drawer.hidden = false;
  btnMenu?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  setTimeout(() => btnClose?.focus(), 0);
}

function closeDrawer() {
  const { drawer, overlay, btnMenu } = drawerEls();
  if (!drawer || !overlay) return;
  overlay.hidden = true;
  drawer.hidden = true;
  btnMenu?.setAttribute('aria-expanded', 'false');
  if (!anyModalOpen()) document.body.style.overflow = '';
}

function setDrawerProfile() {
  const userName = $('#drawer-user-name');
  const userEmail = $('#drawer-user-email');
  const build = $('#drawer-build');
  const status = $('#drawer-status');

  if (userName) userName.textContent = prettyName();
  if (userEmail) userEmail.textContent = [ACTIVE_EMAIL, roleLabel(), getCenterName()].filter(Boolean).join(' - ');
  if (build) build.textContent = `BUILD ${BUILD}`;
  if (status) status.textContent = navigator.onLine !== false ? 'OK' : 'OFFLINE';
}

function showAppHeaderData() {
  const userLine = $('#user-line');
  const heroShiftButton = $('#btn-hero-shift');
  if (userLine) userLine.textContent = `${prettyName()} - ${roleLabel()} - ${getCenterName()}`;
  if (heroShiftButton) heroShiftButton.hidden = !canViewButton(HUB.buttons.find((button) => button.id === 'schedule'));
}

function updateHeroSummary() {
  const summary = $('#hero-summary');
  const areaList = $('#hero-area-list');
  const heroAreas = $('#hero-areas');
  const studentsCount = $('#hero-students-count');
  const attendanceCount = $('#hero-attendance-count');
  const logsCount = $('#hero-logs-count');
  const focusTitle = $('#hero-shift-title');
  const focusSub = $('#hero-shift-subtitle');
  const pendingBanner = $('#pending-shift-banner');

  if (summary) {
    summary.textContent = `Consulta rapidamente calendario, horario, asistencia, bitacoras y recursos del centro ${getCenterName()} desde un solo panel.`;
  }

  if (areaList) {
    areaList.innerHTML = [
      `<span class="heroChip">Centro ${escapeHtml(getCenterName())}</span>`,
      `<span class="heroChip">Perfiles: Admin - Lider - Docente</span>`,
      `<span class="heroChip">Seguimiento</span>`
    ].join('');
  }

  if (heroAreas) heroAreas.textContent = getCenterName();
  if (studentsCount) studentsCount.textContent = String(STATE.data.students.items.length || 0);
  if (attendanceCount) attendanceCount.textContent = String(STATE.data.attendance.items.length || 0);
  if (logsCount) logsCount.textContent = String(STATE.data.logs.items.length || 0);
  if (focusTitle) focusTitle.textContent = getCenterName();
  if (focusSub) focusSub.textContent = 'Supervision general del equipo, clases y seguimiento academico.';
  if (pendingBanner) pendingBanner.hidden = true;
}

function renderEmptyState(title, text) {
  return `
    <div class="emptyState">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return value;
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : 0;
}

function formatDate(value, options = {}) {
  const ms = toMillis(value);
  if (!ms) return '-';

  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'short',
      year: options.withYear === false ? undefined : 'numeric',
      hour: options.withTime ? 'numeric' : undefined,
      minute: options.withTime ? '2-digit' : undefined
    }).format(new Date(ms));
  } catch (_) {
    return '-';
  }
}

function sortByRecent(items, fields = ['updatedAt', 'createdAt', 'date']) {
  return [...items].sort((a, b) => {
    const aValue = fields.map((field) => toMillis(a?.[field]) || Date.parse(String(a?.[field] || '')) || 0).find(Boolean) || 0;
    const bValue = fields.map((field) => toMillis(b?.[field]) || Date.parse(String(b?.[field] || '')) || 0).find(Boolean) || 0;
    return bValue - aValue;
  });
}

function normalizeCalendar(doc) {
  const startAt = doc.startAt || doc.start || doc.date || doc.eventDate || null;
  const endAt = doc.endAt || doc.end || null;
  const parsedYear = Number(String(startAt || '').slice(0, 4));
  return {
    id: doc.id,
    title: normalizeText(doc.title || doc.name || doc.eventName || 'Evento'),
    startAt,
    endAt,
    location: normalizeText(doc.location || doc.place || ''),
    description: normalizeText(doc.description || doc.notes || ''),
    year: Number.isFinite(parsedYear) ? parsedYear : Number(doc.year) || 0
  };
}

function dateInputFromAny(value) {
  const text = normalizeText(value);
  if (!text) return '';
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
}

function getCalendarYearOptions(items = []) {
  const years = new Set();
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  years.add(Number(STATE.filters.calendarYear) || currentYear);
  items.forEach((item) => {
    if (Number.isFinite(item?.year) && item.year > 1900) years.add(item.year);
  });
  return [...years].sort((a, b) => b - a);
}

function toCalendarStorageDate(value) {
  const dateOnly = dateInputFromAny(value);
  return dateOnly ? `${dateOnly}T00:00:00-05:00` : '';
}

const CALENDAR_MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const CALENDAR_WEEKDAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function toDateKeyFromEvent(item) {
  return dateInputFromAny(item?.startAt || item?.date || '');
}

function renderCalendarYearGrid(year, items = []) {
  const eventsByDate = new Map();
  items.forEach((item) => {
    const key = toDateKeyFromEvent(item);
    if (!key) return;
    const list = eventsByDate.get(key) || [];
    list.push(item);
    eventsByDate.set(key, list);
  });

  const monthIndex = Math.min(11, Math.max(0, (Number(STATE.filters.calendarMonth) || 1) - 1));
  const monthLabel = CALENDAR_MONTH_LABELS[monthIndex];
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const dayCells = [];

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayNumber = cell - offset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      dayCells.push('<div class="yearDayCell muted"></div>');
      continue;
    }

    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const dayNum = String(dayNumber).padStart(2, '0');
    const dateKey = `${year}-${monthNum}-${dayNum}`;
    const dayEvents = eventsByDate.get(dateKey) || [];
    const dayHtml = dayEvents.slice(0, 3).map((eventItem) => `
      <div class="yearDayEvent" title="${escapeHtml(eventItem.title)}">${escapeHtml(eventItem.title)}</div>
    `).join('');
    const extra = dayEvents.length > 3 ? `<div class="yearDayMore">+${dayEvents.length - 3}</div>` : '';

    dayCells.push(`
      <div class="yearDayCell${dayEvents.length ? ' hasEvents' : ''}">
        <div class="yearDayNumber">${dayNumber}</div>
        ${dayHtml}
        ${extra}
      </div>
    `);
  }

  return `
    <div class="weekShell">
      <div class="weekToolbar">
        <h5 class="moduleFormTitle">Vista mensual</h5>
        <div class="monthPager">
          <button class="btnGhost" type="button" id="calendar-month-prev">Anterior</button>
          <span class="monthPagerLabel">${escapeHtml(monthLabel)} ${year}</span>
          <button class="btnGhost" type="button" id="calendar-month-next">Siguiente</button>
        </div>
      </div>
      <div class="yearGridWrap">
        <article class="yearMonthCard">
          <header>${escapeHtml(monthLabel)}</header>
          <div class="yearWeekHead">
            ${CALENDAR_WEEKDAY_LABELS.map((wd) => `<span>${escapeHtml(wd)}</span>`).join('')}
          </div>
          <div class="yearMonthGrid">
            ${dayCells.join('')}
          </div>
        </article>
      </div>
    </div>
  `;
}

function normalizeSchedule(doc) {
  return {
    id: doc.id,
    title: normalizeText(doc.title || doc.teacherName || doc.name || doc.groupName || 'Horario'),
    teacherName: normalizeText(doc.teacherName || doc.title || doc.name || 'Docente'),
    teacherId: normalizeText(doc.teacherId || ''),
    teacherEmail: normalizeText(doc.teacherEmail || ''),
    day: normalizeText(doc.day || doc.weekday || ''),
    area: normalizeText(doc.area || doc.subject || doc.art || ''),
    startTime: normalizeText(doc.startTime || doc.start || ''),
    endTime: normalizeText(doc.endTime || doc.end || ''),
    place: normalizeText(doc.place || doc.location || doc.siteName || ''),
    notes: normalizeText(doc.notes || '')
  };
}

function normalizeDayKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseTimeToMinutes(value) {
  const text = normalizeText(value);
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(text);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutesLabel(minutes) {
  const safe = Math.max(0, Number(minutes) || 0);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function renderWeeklySchedule(items = []) {
  const dayLabels = CLEAN_DEFAULT_SCHEDULE_DAYS;
  const dayKeyToLabel = dayLabels.reduce((acc, label) => {
    acc[normalizeDayKey(label)] = label;
    return acc;
  }, {});

  const normalized = items
    .map((item) => {
      const dayKey = normalizeDayKey(item.day);
      const day = dayKeyToLabel[dayKey] || '';
      const start = parseTimeToMinutes(item.startTime);
      const end = parseTimeToMinutes(item.endTime);
      return { ...item, day, start, end };
    })
    .filter((item) => item.day && item.start !== null && item.end !== null && item.end > item.start);

  const teacherOptions = [...new Set(normalized.map((item) => normalizeText(item.teacherName)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const activeTeacher = normalizeText(STATE.filters.scheduleTeacher || 'all');
  const normalizedFiltered = activeTeacher === 'all'
    ? normalized
    : normalized.filter((item) => normalizeText(item.teacherName) === activeTeacher);

  if (!normalized.length) {
    return `
      <div class="weekShell">
        <div class="emptyState">
          <strong>Vista semanal sin bloques</strong>
          <p>AÃºn no hay horarios vÃ¡lidos para dibujar el tablero semanal.</p>
        </div>
      </div>
    `;
  }

  if (!normalizedFiltered.length) {
    return `
      <div class="weekShell">
        <div class="weekToolbar">
          <h5 class="moduleFormTitle">Vista semanal</h5>
          <label class="field">
            <span class="fieldLabel">Vista de docente</span>
            <select class="input" id="schedule-teacher-filter">
              <option value="all"${activeTeacher === 'all' ? ' selected' : ''}>Todos</option>
              ${teacherOptions.map((name) => `<option value="${escapeHtml(name)}"${activeTeacher === name ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="emptyState">
          <strong>Sin bloques para ese docente</strong>
          <p>No hay clases para el filtro seleccionado.</p>
        </div>
      </div>
    `;
  }

  const minStart = Math.min(...normalizedFiltered.map((item) => item.start));
  const maxEnd = Math.max(...normalizedFiltered.map((item) => item.end));
  const from = Math.floor(minStart / 60) * 60;
  const to = Math.max(from + 60, Math.ceil(maxEnd / 60) * 60);
  const range = Math.max(60, to - from);
  const hourLines = [];
  for (let t = from; t <= to; t += 60) hourLines.push(t);
  const boardHeight = Math.max(460, Math.round(range * 0.95));

  const columns = dayLabels.map((day) => {
    const dayBlocks = normalizedFiltered
      .filter((item) => item.day === day)
      .sort((a, b) => (a.start - b.start) || (a.end - b.end));
    const groups = [];
    dayBlocks.forEach((block) => {
      const current = groups[groups.length - 1];
      if (!current || block.start >= current.maxEnd) {
        groups.push({ maxEnd: block.end, items: [block] });
      } else {
        current.items.push(block);
        current.maxEnd = Math.max(current.maxEnd, block.end);
      }
    });

    const dayBlocksWithLayout = groups.flatMap((group) => {
      const laneEnds = [];
      const withLane = group.items.map((block) => {
        let lane = laneEnds.findIndex((laneEnd) => block.start >= laneEnd);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(block.end);
        } else {
          laneEnds[lane] = block.end;
        }
        return { ...block, lane };
      });
      const laneCount = Math.max(1, laneEnds.length);
      return withLane.map((block) => ({ ...block, laneCount }));
    });

    const blocksHtml = dayBlocksWithLayout.map((item) => {
      const top = ((item.start - from) / range) * 100;
      const height = ((item.end - item.start) / range) * 100;
      const laneWidth = 100 / item.laneCount;
      const gapPx = 4;
      return `
        <article class="weekBlock" style="top:${top}%;height:${Math.max(6, height)}%;left:calc(${item.lane * laneWidth}% + ${gapPx}px);width:calc(${laneWidth}% - ${gapPx * 2}px);">
          <strong>${escapeHtml(item.teacherName || 'Docente')}</strong>
          <small>${escapeHtml(item.area || 'Ãrea')}</small>
          <small>${escapeHtml(item.place || 'Lugar')}</small>
          <small>${escapeHtml(`${formatMinutesLabel(item.start)} - ${formatMinutesLabel(item.end)}`)}</small>
        </article>
      `;
    }).join('');

    return `
      <section class="weekCol">
        <header>${escapeHtml(day)}</header>
        <div class="weekColTrack">
          ${hourLines.map((t) => `<span class="weekLine" style="top:${((t - from) / range) * 100}%;"></span>`).join('')}
          ${blocksHtml}
        </div>
      </section>
    `;
  }).join('');

  return `
    <div class="weekShell">
      <div class="weekToolbar">
        <h5 class="moduleFormTitle">Vista semanal</h5>
        <label class="field">
          <span class="fieldLabel">Vista de docente</span>
          <select class="input" id="schedule-teacher-filter">
            <option value="all"${activeTeacher === 'all' ? ' selected' : ''}>Todos</option>
            ${teacherOptions.map((name) => `<option value="${escapeHtml(name)}"${activeTeacher === name ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="weekBoardWrap">
        <div class="weekBoard" style="height:${boardHeight}px;">
          <aside class="weekAxis">
            ${hourLines.map((t) => `<div class="weekAxisItem" style="top:${((t - from) / range) * 100}%;">${escapeHtml(formatMinutesLabel(t))}</div>`).join('')}
          </aside>
          <div class="weekGrid">
            ${columns}
          </div>
        </div>
      </div>
    </div>
  `;
}

function normalizePunctuality(doc) {
  const checkIn = doc.checkIn || doc.checkin || doc.inAt || null;
  const checkOut = doc.checkOut || doc.checkout || doc.outAt || null;
  return {
    id: doc.id,
    teacherName: normalizeText(doc.teacherName || doc.label || doc.displayName || 'Docente'),
    date: normalizeText(doc.date || ''),
    checkIn,
    checkOut,
    status: normalizeText(doc.status || (checkOut ? 'closed' : 'open'))
  };
}

function normalizeStudent(doc) {
  return {
    id: doc.id,
    fullName: normalizeText(doc.fullName || doc.name || doc.studentName || 'Estudiante'),
    documentNumber: normalizeText(doc.documentNumber || doc.document || ''),
    groupName: normalizeText(doc.groupName || doc.group || ''),
    siteName: normalizeText(doc.siteName || doc.centerName || ''),
    guardianName: normalizeText(doc.guardianName || doc.parentName || ''),
    guardianPhone: normalizeText(doc.guardianPhone || doc.parentPhone || ''),
    notes: normalizeText(doc.notes || ''),
    active: doc.active !== false
  };
}

function normalizeAttendance(doc) {
  const entries = Array.isArray(doc.entries) ? doc.entries : Array.isArray(doc.students) ? doc.students : [];
  return {
    id: doc.id,
    date: normalizeText(doc.date || ''),
    sessionName: normalizeText(doc.sessionName || doc.title || doc.groupName || 'SesiÃ³n'),
    siteName: normalizeText(doc.siteName || doc.centerName || ''),
    notes: normalizeText(doc.notes || ''),
    entries,
    statusSummary: entries.reduce((acc, item) => {
      const key = safeLower(item?.status || 'presente') || 'presente';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  };
}

function normalizeLog(doc) {
  return {
    id: doc.id,
    date: normalizeText(doc.date || ''),
    sessionName: normalizeText(doc.sessionName || doc.title || 'BitÃ¡cora'),
    area: normalizeText(doc.area || doc.areaId || doc.primaryAreaId || ''),
    teacherName: normalizeText(doc.teacherName || doc.teacherLabel || ''),
    studentGroup: normalizeText(doc.studentGroup || doc.groupName || ''),
    objective: normalizeText(doc.objective || ''),
    activities: normalizeText(doc.activities || ''),
    achievements: normalizeText(doc.achievements || ''),
    challenges: normalizeText(doc.challenges || ''),
    followUp: normalizeText(doc.followUp || ''),
    notes: normalizeText(doc.notes || '')
  };
}

function normalizeProfile(doc) {
  return {
    id: doc.id,
    label: normalizeText(doc.label || doc.fullName || doc.displayName || 'Docente'),
    email: normalizeText(doc.email || ''),
    phone: normalizeText(doc.phone || doc.cellphone || ''),
    role: normalizeText(doc.role || ''),
    areaIds: Array.isArray(doc.areaIds) ? doc.areaIds : [],
    notes: normalizeText(doc.notes || ''),
    photoUrl: normalizeText(doc.photoUrl || doc.avatar || '')
  };
}

function normalizeGallery(doc) {
  return {
    id: doc.id,
    title: normalizeText(doc.title || doc.name || 'Imagen'),
    imageUrl: normalizeText(doc.imageUrl || doc.url || doc.src || ''),
    description: normalizeText(doc.description || doc.notes || '')
  };
}

function normalizeSimpleRecord(doc, fallbackTitle) {
  return {
    id: doc.id,
    title: normalizeText(doc.title || doc.name || fallbackTitle),
    subtitle: normalizeText(doc.subtitle || doc.summary || doc.description || ''),
    notes: normalizeText(doc.notes || doc.details || ''),
    updatedAt: doc.updatedAt || doc.createdAt || null
  };
}

const COLLECTION_META = {
  calendar: { name: COLLECTIONS.calendar, normalize: normalizeCalendar },
  schedule: { name: COLLECTIONS.schedules, normalize: normalizeSchedule },
  punctuality: { name: COLLECTIONS.punctuality, normalize: normalizePunctuality },
  attendance: { name: COLLECTIONS.attendance, normalize: normalizeAttendance },
  students: { name: COLLECTIONS.students, normalize: normalizeStudent },
  logs: { name: COLLECTIONS.logs, normalize: normalizeLog },
  team: { name: COLLECTIONS.team, normalize: normalizeProfile },
  gallery: { name: COLLECTIONS.gallery, normalize: normalizeGallery },
  diagnostics: { name: COLLECTIONS.diagnostics, normalize: (doc) => normalizeSimpleRecord(doc, 'DiagnÃ³stico') },
  projects: { name: COLLECTIONS.projects, normalize: (doc) => normalizeSimpleRecord(doc, 'Proyecto') },
  samples: { name: COLLECTIONS.samples, normalize: (doc) => normalizeSimpleRecord(doc, 'Muestra de proceso') }
};

async function readCollection(key, force = false) {
  const bucket = STATE.data[key];
  if (!bucket) return [];
  if (bucket.loaded && !force) return bucket.items;

  const meta = COLLECTION_META[key];
  if (!meta || !DB) return [];

  try {
    if (key === 'calendar') {
      const [mainSnap, legacySnap] = await Promise.all([
        getDocs(collection(DB, COLLECTIONS.calendar)),
        getDocs(collection(DB, COLLECTIONS.calendarLegacy))
      ]);
      const merged = new Map();
      [...mainSnap.docs, ...legacySnap.docs].forEach((docSnap) => {
        const item = normalizeCalendar({ id: docSnap.id, ...docSnap.data() });
        const itemKey = normalizeText(item.id) || `${normalizeText(item.title)}-${normalizeText(String(item.startAt))}`;
        if (!merged.has(itemKey)) merged.set(itemKey, item);
      });
      bucket.items = sortByRecent([...merged.values()], ['startAt', 'updatedAt', 'createdAt', 'date']);
      bucket.loaded = true;
      return bucket.items;
    }

    const snap = await getDocs(collection(DB, meta.name));
    const items = snap.docs.map((docSnap) => meta.normalize({ id: docSnap.id, ...docSnap.data() }));
    bucket.items = sortByRecent(items);
    bucket.loaded = true;
    return bucket.items;
  } catch (error) {
    console.warn(`No se pudo leer ${key}:`, error);
    bucket.items = [];
    bucket.loaded = true;
    return [];
  }
}

function getScheduleDayOptions() {
  const items = STATE.settings.scheduleDays.items;
  return items.length ? items : CLEAN_DEFAULT_SCHEDULE_DAYS;
}

async function readScheduleDayOptions(force = false) {
  const bucket = STATE.settings.scheduleDays;
  if (bucket.loaded && !force) return bucket.items;
  if (!DB) return getScheduleDayOptions();

  try {
    const snap = await getDoc(doc(DB, SETTINGS.scheduleDaysCollection, SETTINGS.scheduleDaysDocId));
    const raw = snap.exists()
      ? (snap.data()?.days || snap.data()?.items || snap.data()?.list || [])
      : [];
    const cleaned = [...new Set((Array.isArray(raw) ? raw : []).map(normalizeDayLabel).filter(Boolean))];
    bucket.items = cleaned;
    bucket.loaded = true;
  } catch (error) {
    console.warn('No se pudo leer lista de dÃƒÂ­as:', error);
    bucket.items = [];
    bucket.loaded = true;
  }

  return getScheduleDayOptions();
}

function getSchedulePlaceOptions() {
  const items = STATE.settings.schedulePlaces.items;
  return items.length ? items : DEFAULT_SCHEDULE_PLACES;
}

async function readSchedulePlaceOptions(force = false) {
  const bucket = STATE.settings.schedulePlaces;
  if (bucket.loaded && !force) return bucket.items;
  if (!DB) return getSchedulePlaceOptions();

  try {
    const snap = await getDoc(doc(DB, SETTINGS.scheduleDaysCollection, SETTINGS.schedulePlacesDocId));
    const raw = snap.exists()
      ? (snap.data()?.places || snap.data()?.items || snap.data()?.list || [])
      : [];
    const cleaned = [...new Set((Array.isArray(raw) ? raw : []).map(normalizeText).filter(Boolean))];
    bucket.items = cleaned;
    bucket.loaded = true;
  } catch (error) {
    console.warn('No se pudo leer lista de lugares:', error);
    bucket.items = [];
    bucket.loaded = true;
  }

  return getSchedulePlaceOptions();
}

function getScheduleAreaOptions() {
  const items = STATE.settings.scheduleAreas.items;
  return items.length ? items : DEFAULT_SCHEDULE_AREAS;
}

async function readScheduleAreaOptions(force = false) {
  const bucket = STATE.settings.scheduleAreas;
  if (bucket.loaded && !force) return bucket.items;
  if (!DB) return getScheduleAreaOptions();

  try {
    const snap = await getDoc(doc(DB, SETTINGS.scheduleDaysCollection, SETTINGS.scheduleAreasDocId));
    const raw = snap.exists()
      ? (snap.data()?.areas || snap.data()?.items || snap.data()?.list || [])
      : [];
    const cleaned = [...new Set((Array.isArray(raw) ? raw : []).map(normalizeText).filter(Boolean))];
    bucket.items = cleaned;
    bucket.loaded = true;
  } catch (error) {
    console.warn('No se pudo leer lista de areas:', error);
    bucket.items = [];
    bucket.loaded = true;
  }

  return getScheduleAreaOptions();
}

async function prefetchCoreData() {
  await Promise.all([
    readCollection('students', true),
    readCollection('attendance', true),
    readCollection('logs', true),
    readCollection('punctuality', true)
  ]);
  renderButtons();
  updateHeroSummary();
}

function renderCalendarModule() {
  const items = STATE.data.calendar.items;
  const yearOptions = getCalendarYearOptions(items);
  const selectedYear = Number(STATE.filters.calendarYear) || new Date().getFullYear();
  const scopedItems = sortByRecent(items.filter((item) => {
    if (!Number.isFinite(item.year) || !item.year) return true;
    return item.year === selectedYear;
  }), ['startAt', 'updatedAt', 'createdAt']);

  const adminTools = canManageCalendarEvents()
    ? `
      <div class="moduleAdminPanel">
        <h5 class="moduleFormTitle">${calendarEditorState.editingId ? 'Editar evento' : 'Agregar evento'}</h5>
        <form id="calendar-admin-form" class="moduleAdminForm">
          <div class="toolbarRow">
            <label class="field fieldSpan2">
              <span class="fieldLabel">Titulo</span>
              <input class="input" type="text" id="calendar-title" name="title" maxlength="80" placeholder="Ej: Muestra artistica mensual" required />
            </label>
            <label class="field">
              <span class="fieldLabel">Lugar</span>
              <input class="input" type="text" id="calendar-location" name="location" maxlength="80" placeholder="Sede, salon o auditorio" />
            </label>
          </div>
          <div class="toolbarRow">
            <label class="field">
              <span class="fieldLabel">Fecha inicio</span>
              <input class="input" type="date" id="calendar-startAt" name="startAt" required />
            </label>
            <label class="field">
              <span class="fieldLabel">Fecha fin (opcional)</span>
              <input class="input" type="date" id="calendar-endAt" name="endAt" />
            </label>
          </div>
          <label class="field fieldSpan2">
            <span class="fieldLabel">Descripcion</span>
            <textarea class="input textareaInput" id="calendar-description" name="description" maxlength="300" placeholder="Detalle opcional del evento"></textarea>
          </label>
          <div class="formActions">
            <button class="btnPrimary" type="submit">${calendarEditorState.editingId ? 'Guardar cambios' : 'Agregar evento'}</button>
            <button class="btnGhost" type="button" id="calendar-admin-reset"${calendarEditorState.editingId ? '' : ' hidden'}>Cancelar edicion</button>
          </div>
        </form>
      </div>
    `
    : '';
  const yearGridHtml = renderCalendarYearGrid(selectedYear, scopedItems);

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">Calendario</h4>
          <p class="moduleIntro">Eventos y agenda del centro ${escapeHtml(getCenterName())}. Visible para todos; editable solo por Admin.</p>
        </div>
      </div>
      <div class="toolbarRow">
        <label class="field">
          <span class="fieldLabel">Ano</span>
          <select class="input" id="calendar-year-filter">
            ${yearOptions.map((year) => `<option value="${year}"${year === selectedYear ? ' selected' : ''}>${year}</option>`).join('')}
          </select>
        </label>
        <div class="toolbarMeta">${scopedItems.length} eventos</div>
      </div>
      ${yearGridHtml}
      ${adminTools}
      <div class="recordList">
        ${scopedItems.length ? scopedItems.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div class="recordTitle">${escapeHtml(item.title)}</div>
              <span class="statusPill statusOk">${escapeHtml(formatDate(item.startAt))}</span>
            </div>
            <div class="recordBody">
              ${escapeHtml(item.location || 'Sin ubicacion')}
              ${item.description ? `<br><small>${escapeHtml(item.description)}</small>` : ''}
            </div>
            ${canManageCalendarEvents() ? `
              <div class="recordActions">
                <button class="btnGhost" type="button" data-calendar-edit="${escapeHtml(item.id)}">Editar</button>
                <button class="btnGhost dangerBtn" type="button" data-calendar-delete="${escapeHtml(item.id)}">Eliminar</button>
              </div>
            ` : ''}
          </article>
        `).join('') : renderEmptyState('Sin eventos en este ano', 'No hay eventos cargados para el ano seleccionado.')}
      </div>
    </section>
  `;
}

function renderScheduleModule() {
  const items = STATE.data.schedule.items;
  const weekDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const teachers = STATE.data.team.items
    .filter((item) => normalizeText(item.label))
    .sort((a, b) => normalizeText(a.label).localeCompare(normalizeText(b.label), 'es'));
  const dayOptions = CLEAN_DEFAULT_SCHEDULE_DAYS;
  const placeOptions = getSchedulePlaceOptions();
  const areaOptions = getScheduleAreaOptions();
  const weeklyHtml = renderWeeklySchedule(items);

  const teacherOptions = teachers.map((teacher) => `
    <option value="${escapeHtml(teacher.id)}" data-name="${escapeHtml(teacher.label)}" data-email="${escapeHtml(teacher.email || '')}">
      ${escapeHtml(teacher.label)}${teacher.email ? ` - ${escapeHtml(teacher.email)}` : ''}
    </option>
  `).join('');

  const adminTools = canManageTeacherSchedules()
    ? `
      <div class="moduleAdminPanel">
        <div class="toolbarRow" style="justify-content:space-between;align-items:center;">
          <h5 class="moduleFormTitle" style="margin:0;">ConfiguraciÃ³n de lugares</h5>
          <button class="btnGhost" type="button" id="schedule-places-toggle">${scheduleEditorState.placeListEditing ? 'Cerrar ediciÃ³n' : 'Editar lista de lugares'}</button>
        </div>
        ${scheduleEditorState.placeListEditing ? `
          <div class="moduleAdminPanel" style="margin-top:10px;">
            <div class="toolbarRow">
              <label class="field" style="flex:1 1 240px;">
                <span class="fieldLabel">Nuevo lugar</span>
                <input class="input" type="text" id="schedule-place-new" maxlength="70" placeholder="Ej: Sede principal o Salon 2" />
              </label>
              <button class="btnGhost" type="button" id="schedule-places-add">Agregar</button>
              <button class="btnPrimary" type="button" id="schedule-places-save">Guardar lista</button>
            </div>
            <div class="recordActions" id="schedule-places-draft">
              ${(scheduleEditorState.placeDraft.length ? scheduleEditorState.placeDraft : placeOptions).map((place) => `
                <button class="btnGhost" type="button" data-place-remove="${escapeHtml(place)}">${escapeHtml(place)} âœ•</button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="toolbarRow" style="justify-content:space-between;align-items:center;margin-top:10px;">
          <h5 class="moduleFormTitle" style="margin:0;">ConfiguraciÃ³n de Ã¡reas</h5>
          <button class="btnGhost" type="button" id="schedule-areas-toggle">${scheduleEditorState.areaListEditing ? 'Cerrar ediciÃ³n' : 'Editar lista de Ã¡reas'}</button>
        </div>
        ${scheduleEditorState.areaListEditing ? `
          <div class="moduleAdminPanel" style="margin-top:10px;">
            <div class="toolbarRow">
              <label class="field" style="flex:1 1 240px;">
                <span class="fieldLabel">Nueva Ã¡rea/materia</span>
                <input class="input" type="text" id="schedule-area-new" maxlength="70" placeholder="Ej: Porras o Danzas" />
              </label>
              <button class="btnGhost" type="button" id="schedule-areas-add">Agregar</button>
              <button class="btnPrimary" type="button" id="schedule-areas-save">Guardar lista</button>
            </div>
            <div class="recordActions" id="schedule-areas-draft">
              ${(scheduleEditorState.areaDraft.length ? scheduleEditorState.areaDraft : areaOptions).map((area) => `
                <button class="btnGhost" type="button" data-area-remove="${escapeHtml(area)}">${escapeHtml(area)} âœ•</button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <h5 class="moduleFormTitle">${scheduleEditorState.editingId ? 'Editar horario docente' : 'Agregar horario docente'}</h5>
        <form id="schedule-admin-form" class="moduleAdminForm">
          <div class="toolbarRow">
            <label class="field">
              <span class="fieldLabel">Docente</span>
              <select class="input" id="schedule-teacherId" name="teacherId" required>
                <option value="">Selecciona un docente</option>
                ${teacherOptions}
              </select>
            </label>
            <label class="field">
              <span class="fieldLabel">DÃ­a</span>
              <select class="input" id="schedule-day" name="day" required>
                <option value="">Selecciona un dÃ­a</option>
                ${dayOptions.map((day) => `<option value="${escapeHtml(day)}">${escapeHtml(day)}</option>`).join('')}
              </select>
            </label>
            <label class="field">
              <span class="fieldLabel">Area/Materia</span>
              <select class="input" id="schedule-area" name="area" required>
                <option value="">Selecciona un area</option>
                ${areaOptions.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="toolbarRow">
            <label class="field">
              <span class="fieldLabel">Hora inicio</span>
              <input class="input" type="time" id="schedule-startTime" name="startTime" required />
            </label>
            <label class="field">
              <span class="fieldLabel">Hora fin</span>
              <input class="input" type="time" id="schedule-endTime" name="endTime" required />
            </label>
            <label class="field">
              <span class="fieldLabel">Lugar</span>
              <select class="input" id="schedule-place" name="place" required>
                <option value="">Selecciona un lugar</option>
                ${placeOptions.map((place) => `<option value="${escapeHtml(place)}">${escapeHtml(place)}</option>`).join('')}
              </select>
            </label>
          </div>
          <label class="field fieldSpan2">
            <span class="fieldLabel">Notas</span>
            <textarea class="input textareaInput" id="schedule-notes" name="notes" maxlength="300" placeholder="Detalle opcional"></textarea>
          </label>
          <div class="formActions">
            <button class="btnPrimary" type="submit"${teachers.length ? '' : ' disabled'}>${scheduleEditorState.editingId ? 'Guardar cambios' : 'Agregar horario'}</button>
            <button class="btnGhost" type="button" id="schedule-admin-reset"${scheduleEditorState.editingId ? '' : ' hidden'}>Cancelar ediciÃ³n</button>
          </div>
        </form>
        ${teachers.length ? '' : '<p class="muted">No hay docentes en <strong>teacherProfiles</strong>. Carga perfiles docentes para habilitar la creaciÃ³n.</p>'}
      </div>
    `
    : '';

  const listHtml = items.length
    ? items.map((item) => `
      <article class="recordCard">
        <div class="recordCardTop">
          <div>
            <div class="recordTitle">${escapeHtml(item.teacherName || item.title || 'Docente')}</div>
            <div class="recordMeta">${escapeHtml([item.day, item.area].filter(Boolean).join(' Â· ') || 'Horario')}</div>
          </div>
          <span class="statusPill">${escapeHtml([item.startTime, item.endTime].filter(Boolean).join(' - ') || 'Sin hora')}</span>
        </div>
        <div class="recordBody">
          ${escapeHtml([item.area && `Area: ${item.area}`, item.place && `Lugar: ${item.place}`, item.notes].filter(Boolean).join(' Â· ') || 'Sin detalle adicional')}
        </div>
        ${canManageTeacherSchedules() ? `
          <div class="recordActions">
            <button class="btnGhost" type="button" data-schedule-edit="${escapeHtml(item.id)}">Editar</button>
            <button class="btnGhost dangerBtn" type="button" data-schedule-delete="${escapeHtml(item.id)}">Eliminar</button>
          </div>
        ` : ''}
      </article>
    `).join('')
    : renderEmptyState('Sin horario cargado', canManageTeacherSchedules() ? 'AÃºn no hay bloques creados. Usa el formulario para agregar el primer horario.' : 'AÃºn no hay horario docente publicado por administraciÃ³n.');

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">Horario de docentes</h4>
          <p class="moduleIntro">Horario docente del centro ${escapeHtml(getCenterName())}. Visible para Admin y LÃ­deres.</p>
        </div>
      </div>
      ${adminTools}
      <div class="recordList">
        ${weeklyHtml}
        ${listHtml}
      </div>
    </section>
  `;
}

function renderPunctualityModule() {
  const items = STATE.data.punctuality.items;
  if (!items.length) {
    return renderEmptyState('Sin registros de puntualidad', 'Cuando los docentes marquen entrada y salida, aquÃ­ podrÃ¡s revisar la puntualidad.');
  }

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">Registro de puntualidad</h4>
          <p class="moduleIntro">Lectura de ingresos y salidas del equipo docente.</p>
        </div>
      </div>
      <div class="recordList">
        ${items.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div>
                <div class="recordTitle">${escapeHtml(item.teacherName)}</div>
                <div class="recordMeta">${escapeHtml(item.date || '')}</div>
              </div>
              <span class="statusPill ${item.status === 'closed' ? 'statusOk' : ''}">${escapeHtml(item.status === 'closed' ? 'Cerrada' : 'Abierta')}</span>
            </div>
            <div class="recordBody">
              ${escapeHtml([
                item.checkIn ? `Entrada: ${formatDate(item.checkIn, { withTime: true })}` : '',
                item.checkOut ? `Salida: ${formatDate(item.checkOut, { withTime: true })}` : 'Sin salida registrada'
              ].filter(Boolean).join(' Â· '))}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderStudentsModule() {
  const q = safeLower(STATE.filters.search);
  const items = STATE.data.students.items.filter((item) => {
    const haystack = safeLower(`${item.fullName} ${item.groupName} ${item.documentNumber} ${item.siteName}`);
    return !q || haystack.includes(q);
  });

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">Lista de estudiantes</h4>
          <p class="moduleIntro">Consulta general del listado de estudiantes del centro.</p>
        </div>
      </div>

      <div class="toolbarRow">
        <label class="field fieldSpan2">
          <span class="fieldLabel">Buscar estudiante</span>
          <input class="input" type="search" id="workspace-search" placeholder="Nombre, grupo o documento" value="${escapeHtml(STATE.filters.search)}" />
        </label>
        <div class="toolbarMeta">${items.length} resultados</div>
      </div>

      <div class="recordList">
        ${items.length ? items.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div>
                <div class="recordTitle">${escapeHtml(item.fullName)}</div>
                <div class="recordMeta">${escapeHtml(item.groupName || item.siteName || 'Sin grupo')}</div>
              </div>
              <span class="statusPill ${item.active ? 'statusOk' : 'statusMuted'}">${item.active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div class="recordBody">
              ${escapeHtml([
                item.documentNumber && `Doc: ${item.documentNumber}`,
                item.guardianName && `Acudiente: ${item.guardianName}`,
                item.guardianPhone && `Tel: ${item.guardianPhone}`
              ].filter(Boolean).join(' Â· ') || 'Sin datos complementarios')}
              ${item.notes ? `<br><small>${escapeHtml(item.notes)}</small>` : ''}
            </div>
          </article>
        `).join('') : renderEmptyState('Sin estudiantes visibles', 'TodavÃ­a no hay estudiantes cargados o el filtro no coincide con nada.')}
      </div>
    </section>
  `;
}

function renderAttendanceModule() {
  const filter = safeLower(STATE.filters.attendanceStatus);
  const items = STATE.data.attendance.items.filter((item) => {
    if (filter === 'all') return true;
    return (item.statusSummary?.[filter] || 0) > 0;
  });

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">Informe de asistencia</h4>
          <p class="moduleIntro">Lectura de sesiones y estados registrados por los docentes.</p>
        </div>
      </div>

      <div class="toolbarRow">
        <label class="field">
          <span class="fieldLabel">Filtrar por estado</span>
          <select class="input" id="attendance-status-filter">
            <option value="all"${filter === 'all' ? ' selected' : ''}>Todos</option>
            <option value="presente"${filter === 'presente' ? ' selected' : ''}>Presente</option>
            <option value="ausente"${filter === 'ausente' ? ' selected' : ''}>Ausente</option>
            <option value="tarde"${filter === 'tarde' ? ' selected' : ''}>Tarde</option>
            <option value="excusado"${filter === 'excusado' ? ' selected' : ''}>Excusado</option>
          </select>
        </label>
        <div class="toolbarMeta">${items.length} sesiones</div>
      </div>

      <div class="recordList">
        ${items.length ? items.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div>
                <div class="recordTitle">${escapeHtml(item.sessionName)}</div>
                <div class="recordMeta">${escapeHtml(item.date || item.siteName || 'Sin fecha')}</div>
              </div>
              <span class="statusPill">${escapeHtml(String(item.entries.length || 0))} registros</span>
            </div>
            <div class="recordBody">
              ${escapeHtml([
                item.statusSummary.presente ? `Presentes: ${item.statusSummary.presente}` : '',
                item.statusSummary.ausente ? `Ausentes: ${item.statusSummary.ausente}` : '',
                item.statusSummary.tarde ? `Tarde: ${item.statusSummary.tarde}` : '',
                item.statusSummary.excusado ? `Excusados: ${item.statusSummary.excusado}` : ''
              ].filter(Boolean).join(' Â· ') || 'Sin detalle')}
              ${item.notes ? `<br><small>${escapeHtml(item.notes)}</small>` : ''}
            </div>
          </article>
        `).join('') : renderEmptyState('Sin asistencia cargada', 'TodavÃ­a no hay sesiones de asistencia en la base o el filtro dejÃ³ la lista vacÃ­a.')}
      </div>
    </section>
  `;
}

function renderLogsModule() {
  const q = safeLower(STATE.filters.search);
  const activeArea = safeLower(STATE.filters.logsArea || 'all');
  const items = STATE.data.logs.items.filter((item) => {
    const haystack = safeLower(`${item.sessionName} ${item.studentGroup} ${item.objective} ${item.activities} ${item.notes} ${item.area} ${item.teacherName}`);
    const areaKey = safeLower(item.area || '');
    const passesArea = activeArea === 'all' || areaKey === activeArea;
    if (!passesArea) return false;
    return !q || haystack.includes(q);
  });
  const areaOptions = [...new Set(STATE.data.logs.items.map((item) => normalizeText(item.area)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const maxIndex = Math.max(0, items.length - 1);
  const currentIndex = Math.min(Math.max(Number(STATE.filters.logsIndex) || 0, 0), maxIndex);
  const currentItem = items[currentIndex] || null;
  const areaTone = (currentItem?.area || '').toLowerCase() === 'porras' ? 'areaPorras' : ((currentItem?.area || '').toLowerCase() === 'danzas' ? 'areaDanzas' : 'areaNeutral');

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">BitÃ¡coras de clase</h4>
          <p class="moduleIntro">Consulta de bitÃ¡coras registradas por los docentes.</p>
        </div>
      </div>

      <div class="toolbarRow">
        <label class="field fieldSpan2">
          <span class="fieldLabel">Buscar en bitÃ¡coras</span>
          <input class="input" type="search" id="workspace-search" placeholder="SesiÃ³n, objetivo, grupo..." value="${escapeHtml(STATE.filters.search)}" />
        </label>
        <label class="field">
          <span class="fieldLabel">Area</span>
          <select class="input" id="logs-area-filter">
            <option value="all"${activeArea === 'all' ? ' selected' : ''}>Todas</option>
            ${areaOptions.map((area) => `<option value="${escapeHtml(area)}"${activeArea === safeLower(area) ? ' selected' : ''}>${escapeHtml(area)}</option>`).join('')}
          </select>
        </label>
        <div class="toolbarMeta">${items.length} bitÃ¡coras</div>
      </div>

      <div class="logsLayout">
        <aside class="logsListPanel">
          ${items.length ? items.map((item, index) => `
            <button class="logsListItem ${index === currentIndex ? 'isActive' : ''}" type="button" data-log-open="${escapeHtml(item.id)}">
              <div class="logsListTop">
                <strong>${escapeHtml(item.sessionName || 'Bitacora')}</strong>
                <span class="statusPill ${safeLower(item.area) === 'porras' ? 'statusWarn' : (safeLower(item.area) === 'danzas' ? 'statusInfo' : '')}">${escapeHtml(item.area || 'General')}</span>
              </div>
              <div class="recordMeta">${escapeHtml([item.date, item.studentGroup, item.teacherName].filter(Boolean).join(' - ') || 'Bitacora')}</div>
            </button>
          `).join('') : renderEmptyState('Sin bitacoras visibles', 'Todavia no hay bitacoras o el filtro no coincide con nada.')}
        </aside>

        <div class="logsDetailPanel">
          ${currentItem ? `
            <article class="recordCard ${areaTone}">
              <div class="recordCardTop">
                <div>
                  <div class="recordTitle">${escapeHtml(currentItem.sessionName || 'Bitacora')}</div>
                  <div class="recordMeta">${escapeHtml([currentItem.date, currentItem.studentGroup, currentItem.teacherName].filter(Boolean).join(' - ') || 'Registro')}</div>
                </div>
                <span class="statusPill statusOk">${currentIndex + 1} / ${items.length}</span>
              </div>
              <div class="recordBody">
                <strong>Objetivo:</strong> ${escapeHtml(currentItem.objective || 'Sin objetivo registrado.')}<br>
                <strong>Actividades:</strong> ${escapeHtml(currentItem.activities || 'Sin actividades registradas.')}<br>
                ${currentItem.achievements ? `<strong>Logros:</strong> ${escapeHtml(currentItem.achievements)}<br>` : ''}
                ${currentItem.challenges ? `<strong>Retos:</strong> ${escapeHtml(currentItem.challenges)}<br>` : ''}
                ${currentItem.notes ? `<strong>Notas:</strong> ${escapeHtml(currentItem.notes)}<br>` : ''}
                ${currentItem.followUp ? `<strong>Seguimiento:</strong> ${escapeHtml(currentItem.followUp)}` : ''}
              </div>
              <div class="recordActions">
                <button class="btnGhost" type="button" id="logs-prev"${currentIndex <= 0 ? ' disabled' : ''}>Apunte anterior</button>
                <button class="btnGhost" type="button" id="logs-next"${currentIndex >= (items.length - 1) ? ' disabled' : ''}>Siguiente apunte</button>
              </div>
            </article>
          ` : renderEmptyState('Sin bitacora seleccionada', 'Selecciona un apunte en la lista para leer el detalle.')}
        </div>
      </div>
    </section>
  `;
}

function renderTeamModule() {
  const items = STATE.data.team.items;
  if (!items.length) {
    return renderEmptyState('Sin perfiles cargados', 'Cuando teacherProfiles tenga informaciÃ³n Ãºtil, aquÃ­ podrÃ¡s revisar el equipo docente.');
  }

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">Perfil equipo de docentes</h4>
          <p class="moduleIntro">Consulta rÃ¡pida del equipo docente vinculado.</p>
        </div>
      </div>
      <div class="recordList">
        ${items.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div>
                <div class="recordTitle">${escapeHtml(item.label)}</div>
                <div class="recordMeta">${escapeHtml(item.role || 'Docente')}</div>
              </div>
              <span class="statusPill">${escapeHtml(item.areaIds.join(', ') || 'Equipo')}</span>
            </div>
            <div class="recordBody">
              ${escapeHtml([item.email, item.phone].filter(Boolean).join(' Â· ') || 'Sin datos de contacto')}
              ${item.notes ? `<br><small>${escapeHtml(item.notes)}</small>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderGalleryModule() {
  const items = STATE.data.gallery.items;
  if (!items.length) {
    return renderEmptyState('Sin imÃ¡genes cargadas', 'Cuando la colecciÃ³n galleryImages tenga imÃ¡genes, aquÃ­ aparecerÃ¡ la galerÃ­a.');
  }

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">GalerÃ­a de imÃ¡genes</h4>
          <p class="moduleIntro">Evidencias visuales del centro.</p>
        </div>
      </div>
      <div class="recordList">
        ${items.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div class="recordTitle">${escapeHtml(item.title)}</div>
              <span class="statusPill statusOk">${item.imageUrl ? 'Imagen' : 'Sin URL'}</span>
            </div>
            <div class="recordBody">
              ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" style="width:100%;border-radius:16px;margin-top:8px;border:1px solid rgba(12,65,196,.12);" />` : 'Este registro no tiene URL de imagen.'}
              ${item.description ? `<br><small>${escapeHtml(item.description)}</small>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSimpleCollectionModule(key, title, intro) {
  const items = STATE.data[key].items;
  if (!items.length) {
    return renderEmptyState(`Sin ${title.toLowerCase()} cargados`, `Cuando la colecciÃ³n ${COLLECTION_META[key].name} tenga informaciÃ³n, aquÃ­ aparecerÃ¡ el contenido.`);
  }

  return `
    <section class="moduleSurface">
      <div class="moduleSurfaceHead">
        <div>
          <h4 class="moduleTitle">${escapeHtml(title)}</h4>
          <p class="moduleIntro">${escapeHtml(intro)}</p>
        </div>
      </div>
      <div class="recordList">
        ${items.map((item) => `
          <article class="recordCard">
            <div class="recordCardTop">
              <div class="recordTitle">${escapeHtml(item.title)}</div>
              <span class="statusPill">${escapeHtml(formatDate(item.updatedAt) || 'Registro')}</span>
            </div>
            <div class="recordBody">
              ${escapeHtml(item.subtitle || item.notes || 'Sin descripciÃ³n.')}
              ${item.notes && item.subtitle !== item.notes ? `<br><small>${escapeHtml(item.notes)}</small>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

const MODULE_CONFIG = {
  calendar: {
    eyebrow: 'Planeacion',
    title: 'Calendario',
    subtitle: 'Eventos y agenda conectados desde Firestore.',
    render: renderCalendarModule
  },
  schedule: {
    eyebrow: 'Operacion diaria',
    title: 'Horario de docentes',
    subtitle: 'Consulta y administracion de bloques docentes.',
    render: renderScheduleModule
  },
  punctuality: {
    eyebrow: 'Operacion diaria',
    title: 'Registro de puntualidad',
    subtitle: 'Lectura del marcaje del equipo docente.',
    render: renderPunctualityModule
  },
  students: {
    eyebrow: 'Operacion diaria',
    title: 'Lista de estudiantes',
    subtitle: 'Consulta general del listado cargado.',
    render: renderStudentsModule
  },
  attendance: {
    eyebrow: 'Seguimiento',
    title: 'Informe de asistencia',
    subtitle: 'Lectura consolidada de asistencia por sesion.',
    render: renderAttendanceModule
  },
  logs: {
    eyebrow: 'Seguimiento academico',
    title: 'Bitacoras de clase',
    subtitle: 'Consulta de registros pedagÃ³gicos guardados.',
    render: renderLogsModule
  },
  team: {
    eyebrow: 'Equipo',
    title: 'Perfil equipo de docentes',
    subtitle: 'Consulta rapida de perfiles del equipo.',
    render: renderTeamModule
  },
  gallery: {
    eyebrow: 'Evidencias',
    title: 'Galeria de imagenes',
    subtitle: 'Consulta de imagenes y evidencias visuales.',
    render: renderGalleryModule
  },
  diagnostics: {
    eyebrow: 'Seguimiento academico',
    title: 'Diagnosticos',
    subtitle: 'Consulta de registros diagnosticos.',
    render: () => renderSimpleCollectionModule('diagnostics', 'Diagnosticos', 'Seguimiento de diagnosticos y observaciones.')
  },
  projects: {
    eyebrow: 'Seguimiento academico',
    title: 'Proyectos',
    subtitle: 'Consulta de proyectos activos.',
    render: () => renderSimpleCollectionModule('projects', 'Proyectos', 'Planeaciones y proyectos del centro.')
  },
  samples: {
    eyebrow: 'Seguimiento academico',
    title: 'Muestras de proceso',
    subtitle: 'Consulta de muestras y preparacion.',
    render: () => renderSimpleCollectionModule('samples', 'Muestras de proceso', 'Seguimiento de muestras y evidencias.')
  }
};

function renderWorkspaceModule() {
  const content = $('#workspace-content');
  const title = $('#workspace-title');
  const subtitle = $('#workspace-subtitle');
  const eyebrow = $('#workspace-eyebrow');
  if (!content || !STATE.currentModule) return;

  const config = MODULE_CONFIG[STATE.currentModule];
  if (!config) return;

  if (title) title.textContent = config.title;
  if (subtitle) subtitle.textContent = config.subtitle;
  if (eyebrow) eyebrow.textContent = config.eyebrow;

  content.innerHTML = config.render();
  sanitizeUiMojibake();
}

async function openWorkspaceModule(moduleId) {
  if (!CURRENT_USER) {
    toast('Debes iniciar sesiÃ³n primero.');
    return;
  }

  STATE.currentModule = moduleId;
  STATE.filters.search = '';
  STATE.filters.attendanceStatus = 'all';
  STATE.filters.scheduleTeacher = 'all';
  STATE.filters.calendarYear = String(new Date().getFullYear());
  STATE.filters.calendarMonth = String(new Date().getMonth() + 1);
  STATE.filters.logsArea = 'all';
  STATE.filters.logsIndex = 0;
  if (moduleId !== 'calendar') calendarEditorState.editingId = '';

  if (moduleId === 'schedule') {
    await readCollection('team', true);
    await readSchedulePlaceOptions(true);
    await readScheduleAreaOptions(true);
  }

  await readCollection(moduleId);
  renderWorkspaceModule();
  openModal('modal-workspace');

  if (moduleId === 'students') setBottomNavActive('students');
  else if (moduleId === 'attendance') setBottomNavActive('attendance');
  else if (moduleId === 'logs') setBottomNavActive('logs');
  else setBottomNavActive('home');
}

async function refreshActiveModule() {
  if (!STATE.currentModule) return;
  if (STATE.currentModule === 'schedule') {
    await readSchedulePlaceOptions(true);
    await readScheduleAreaOptions(true);
  }
  await readCollection(STATE.currentModule, true);
  renderWorkspaceModule();
  renderButtons();
  updateHeroSummary();
}

async function triggerAccess(id) {
  const button = getButtonById(id);
  if (!button) {
    toast('No tienes permisos para ese acceso.');
    return;
  }

  pushRecentId(id);
  renderFavoritesList();

  if (button.kind === 'link') {
    openExternal(HUB.links[id] || '');
    return;
  }

  await openWorkspaceModule(id);
}

function wireSearchAndFavorites() {
  if (searchBound) return;
  searchBound = true;

  $('#btn-open-search')?.addEventListener('click', openSearchModal);
  $('#btn-open-favorites')?.addEventListener('click', openFavoritesModal);

  $('#search-input')?.addEventListener('input', (event) => {
    renderSearchResults(event.target.value || '');
  });

  $('#search-results')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-open-id]');
    if (!button) return;
    closeModal('modal-search');
    await triggerAccess(button.getAttribute('data-open-id'));
  });

  $('#favorites-list')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-open-id]');
    if (!button) return;
    closeModal('modal-favorites');
    await triggerAccess(button.getAttribute('data-open-id'));
  });
}

function wireDrawerHandlers(auth) {
  if (drawerBound) return;
  drawerBound = true;

  const { btnMenu, overlay, drawer, btnClose } = drawerEls();

  btnMenu?.addEventListener('click', () => (isDrawerOpen() ? closeDrawer() : openDrawer()));
  btnClose?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);

  drawer?.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;

    closeDrawer();

    if (action === 'logout') {
      await doLogout(auth);
      return;
    }

    if (action === 'open:search') {
      openSearchModal();
      return;
    }

    if (action === 'open:favorites') {
      openFavoritesModal();
      return;
    }

    if (action === 'support') {
      openExternal(HUB.links.supportMail);
      return;
    }

    if (action === 'switchHub') {
      toast('Este panel estÃ¡ dedicado solo a lÃ­deres.');
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isDrawerOpen()) closeDrawer();
  });
}

function wireModals() {
  if (modalBound) return;
  modalBound = true;

  [
    ['btn-search-close', 'modal-search'],
    ['btn-favorites-close', 'modal-favorites'],
    ['btn-workspace-close', 'modal-workspace']
  ].forEach(([buttonId, modalId]) => {
    document.getElementById(buttonId)?.addEventListener('click', () => closeModal(modalId));
    document.getElementById(modalId)?.addEventListener('click', (event) => {
      if (event.target.id === modalId) closeModal(modalId);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const opened = [...MODAL_IDS].reverse().find((id) => {
        const el = document.getElementById(id);
        return el && !el.hidden;
      });
      if (opened) closeModal(opened);
    }
  });
}

function bindWorkspaceModal() {
  if (workspaceBound) return;
  workspaceBound = true;

  $('#btn-workspace-refresh')?.addEventListener('click', refreshActiveModule);

  $('#workspace-content')?.addEventListener('input', (event) => {
    const target = event.target;

    if (target.id === 'workspace-search') {
      STATE.filters.search = target.value || '';
      renderWorkspaceModule();
      return;
    }

    if (target.id === 'attendance-status-filter') {
      STATE.filters.attendanceStatus = target.value || 'all';
      renderWorkspaceModule();
      return;
    }

    if (target.id === 'schedule-teacher-filter') {
      STATE.filters.scheduleTeacher = target.value || 'all';
      renderWorkspaceModule();
      return;
    }

    if (target.id === 'calendar-year-filter') {
      STATE.filters.calendarYear = target.value || String(new Date().getFullYear());
      renderWorkspaceModule();
      return;
    }

    if (target.id === 'logs-area-filter') {
      STATE.filters.logsArea = target.value || 'all';
      STATE.filters.logsIndex = 0;
      renderWorkspaceModule();
    }
  });

  $('#workspace-content')?.addEventListener('click', async (event) => {
    if (event.target.id === 'schedule-places-toggle') {
      scheduleEditorState.placeListEditing = !scheduleEditorState.placeListEditing;
      scheduleEditorState.placeDraft = [...getSchedulePlaceOptions()];
      renderWorkspaceModule();
      return;
    }

    if (event.target.id === 'schedule-places-add') {
      const input = $('#schedule-place-new');
      const next = normalizeText(input?.value || '');
      if (!next) {
        toast('Escribe un valor para agregar.');
        return;
      }
      const draft = scheduleEditorState.placeDraft.length ? scheduleEditorState.placeDraft : [...getSchedulePlaceOptions()];
      if (!draft.some((item) => safeLower(item) === safeLower(next))) {
        draft.push(next);
      }
      scheduleEditorState.placeDraft = draft;
      renderWorkspaceModule();
      return;
    }

    const removePlaceBtn = event.target.closest('[data-place-remove]');
    if (removePlaceBtn) {
      const place = removePlaceBtn.getAttribute('data-place-remove');
      scheduleEditorState.placeDraft = (scheduleEditorState.placeDraft.length ? scheduleEditorState.placeDraft : [...getSchedulePlaceOptions()])
        .filter((item) => safeLower(item) !== safeLower(place));
      renderWorkspaceModule();
      return;
    }

    if (event.target.id === 'schedule-places-save') {
      const finalPlaces = [...new Set((scheduleEditorState.placeDraft.length ? scheduleEditorState.placeDraft : [...getSchedulePlaceOptions()]).map(normalizeText).filter(Boolean))];
      if (!finalPlaces.length) {
        toast('La lista no puede quedar vacÃ­a.');
        return;
      }
      try {
        await setDoc(doc(DB, SETTINGS.scheduleDaysCollection, SETTINGS.schedulePlacesDocId), {
          places: finalPlaces,
          updatedAt: serverTimestamp(),
          updatedBy: ACTIVE_EMAIL
        }, { merge: true });
        STATE.settings.schedulePlaces.items = finalPlaces;
        STATE.settings.schedulePlaces.loaded = true;
        scheduleEditorState.placeDraft = [...finalPlaces];
        scheduleEditorState.placeListEditing = false;
        renderWorkspaceModule();
        toast('Lista de lugares guardada.');
      } catch (error) {
        console.error(error);
        toast('No se pudo guardar la lista de lugares.');
      }
      return;
    }

    if (event.target.id === 'schedule-areas-toggle') {
      scheduleEditorState.areaListEditing = !scheduleEditorState.areaListEditing;
      scheduleEditorState.areaDraft = [...getScheduleAreaOptions()];
      renderWorkspaceModule();
      return;
    }

    if (event.target.id === 'schedule-areas-add') {
      const input = $('#schedule-area-new');
      const next = normalizeText(input?.value || '');
      if (!next) {
        toast('Escribe un valor para agregar.');
        return;
      }
      const draft = scheduleEditorState.areaDraft.length ? scheduleEditorState.areaDraft : [...getScheduleAreaOptions()];
      if (!draft.some((item) => safeLower(item) === safeLower(next))) {
        draft.push(next);
      }
      scheduleEditorState.areaDraft = draft;
      renderWorkspaceModule();
      return;
    }

    const removeAreaBtn = event.target.closest('[data-area-remove]');
    if (removeAreaBtn) {
      const area = removeAreaBtn.getAttribute('data-area-remove');
      scheduleEditorState.areaDraft = (scheduleEditorState.areaDraft.length ? scheduleEditorState.areaDraft : [...getScheduleAreaOptions()])
        .filter((item) => safeLower(item) !== safeLower(area));
      renderWorkspaceModule();
      return;
    }

    if (event.target.id === 'schedule-areas-save') {
      const finalAreas = [...new Set((scheduleEditorState.areaDraft.length ? scheduleEditorState.areaDraft : [...getScheduleAreaOptions()]).map(normalizeText).filter(Boolean))];
      if (!finalAreas.length) {
        toast('La lista no puede quedar vacia.');
        return;
      }
      try {
        await setDoc(doc(DB, SETTINGS.scheduleDaysCollection, SETTINGS.scheduleAreasDocId), {
          areas: finalAreas,
          updatedAt: serverTimestamp(),
          updatedBy: ACTIVE_EMAIL
        }, { merge: true });
        STATE.settings.scheduleAreas.items = finalAreas;
        STATE.settings.scheduleAreas.loaded = true;
        scheduleEditorState.areaDraft = [...finalAreas];
        scheduleEditorState.areaListEditing = false;
        renderWorkspaceModule();
        toast('Lista de areas guardada.');
      } catch (error) {
        console.error(error);
        toast('No se pudo guardar la lista de areas.');
      }
      return;
    }

    const editBtn = event.target.closest('[data-schedule-edit]');
    if (editBtn) {
      const id = editBtn.getAttribute('data-schedule-edit');
      const item = STATE.data.schedule.items.find((entry) => entry.id === id);
      if (!item || !canManageTeacherSchedules()) return;
      scheduleEditorState.editingId = id;
      renderWorkspaceModule();
      const form = $('#schedule-admin-form');
      if (!form) return;
      const teacherSelect = form.teacherId;
      if (teacherSelect) {
        const hasId = [...teacherSelect.options].some((opt) => normalizeText(opt.value) === normalizeText(item.teacherId));
        if (hasId && item.teacherId) {
          teacherSelect.value = item.teacherId;
        } else {
          const fallbackByName = [...teacherSelect.options].find((opt) => normalizeText(opt.dataset.name) === normalizeText(item.teacherName || item.title));
          teacherSelect.value = fallbackByName?.value || '';
        }
      }
      form.day.value = item.day || '';
      if (!form.day.value && item.day) {
        const fallback = [...form.day.options].find((opt) => safeLower(opt.value) === safeLower(item.day));
        form.day.value = fallback?.value || '';
      }
      form.startTime.value = item.startTime || '';
      form.endTime.value = item.endTime || '';
      form.area.value = item.area || '';
      form.place.value = item.place || '';
      form.notes.value = item.notes || '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const deleteBtn = event.target.closest('[data-schedule-delete]');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-schedule-delete');
      if (!id || !canManageTeacherSchedules()) return;
      if (!window.confirm('Â¿Eliminar este bloque de horario docente?')) return;
      try {
        await deleteDoc(doc(DB, COLLECTIONS.schedules, id));
        if (scheduleEditorState.editingId === id) scheduleEditorState.editingId = '';
        await refreshActiveModule();
        toast('Horario eliminado.');
      } catch (error) {
        console.error(error);
        toast('No se pudo eliminar el horario.');
      }
      return;
    }

    if (event.target.id === 'schedule-admin-reset') {
      scheduleEditorState.editingId = '';
      renderWorkspaceModule();
      return;
    }

    const calendarEditBtn = event.target.closest('[data-calendar-edit]');
    if (calendarEditBtn) {
      const id = calendarEditBtn.getAttribute('data-calendar-edit');
      const item = STATE.data.calendar.items.find((entry) => entry.id === id);
      if (!item || !canManageCalendarEvents()) return;
      calendarEditorState.editingId = id;
      renderWorkspaceModule();
      const form = $('#calendar-admin-form');
      if (!form) return;
      const titleInput = form.querySelector('[name="title"]');
      const locationInput = form.querySelector('[name="location"]');
      const startInput = form.querySelector('[name="startAt"]');
      const endInput = form.querySelector('[name="endAt"]');
      const descriptionInput = form.querySelector('[name="description"]');
      if (titleInput) titleInput.value = item.title || '';
      if (locationInput) locationInput.value = item.location || '';
      if (startInput) startInput.value = dateInputFromAny(item.startAt);
      if (endInput) endInput.value = dateInputFromAny(item.endAt);
      if (descriptionInput) descriptionInput.value = item.description || '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const calendarDeleteBtn = event.target.closest('[data-calendar-delete]');
    if (calendarDeleteBtn) {
      const id = calendarDeleteBtn.getAttribute('data-calendar-delete');
      if (!id || !canManageCalendarEvents()) return;
      if (!window.confirm('Â¿Eliminar este evento del calendario?')) return;
      try {
        await deleteDoc(doc(DB, COLLECTIONS.calendar, id));
        if (calendarEditorState.editingId === id) calendarEditorState.editingId = '';
        await refreshActiveModule();
        toast('Evento eliminado.');
      } catch (error) {
        console.error(error);
        toast('No se pudo eliminar el evento.');
      }
      return;
    }

    if (event.target.id === 'calendar-admin-reset') {
      calendarEditorState.editingId = '';
      renderWorkspaceModule();
      return;
    }

    const openLogBtn = event.target.closest('[data-log-open]');
    if (openLogBtn) {
      const id = openLogBtn.getAttribute('data-log-open');
      const q = safeLower(STATE.filters.search);
      const activeArea = safeLower(STATE.filters.logsArea || 'all');
      const items = STATE.data.logs.items.filter((item) => {
        const haystack = safeLower(`${item.sessionName} ${item.studentGroup} ${item.objective} ${item.activities} ${item.notes} ${item.area} ${item.teacherName}`);
        const areaKey = safeLower(item.area || '');
        const passesArea = activeArea === 'all' || areaKey === activeArea;
        return passesArea && (!q || haystack.includes(q));
      });
      const index = items.findIndex((entry) => entry.id === id);
      if (index >= 0) {
        STATE.filters.logsIndex = index;
        renderWorkspaceModule();
      }
      return;
    }

    if (event.target.id === 'logs-prev' || event.target.id === 'logs-next') {
      const step = event.target.id === 'logs-prev' ? -1 : 1;
      STATE.filters.logsIndex = Math.max(0, (Number(STATE.filters.logsIndex) || 0) + step);
      renderWorkspaceModule();
      return;
    }

    if (event.target.id === 'calendar-month-prev' || event.target.id === 'calendar-month-next') {
      const year = Number(STATE.filters.calendarYear) || new Date().getFullYear();
      let month = Number(STATE.filters.calendarMonth) || (new Date().getMonth() + 1);
      month += event.target.id === 'calendar-month-prev' ? -1 : 1;
      let nextYear = year;
      if (month < 1) {
        month = 12;
        nextYear -= 1;
      }
      if (month > 12) {
        month = 1;
        nextYear += 1;
      }
      STATE.filters.calendarYear = String(nextYear);
      STATE.filters.calendarMonth = String(month);
      renderWorkspaceModule();
    }
  });

  $('#workspace-content')?.addEventListener('submit', async (event) => {
    if (event.target.id !== 'schedule-admin-form') return;
    event.preventDefault();
    if (!canManageTeacherSchedules()) return;

    const form = event.target;
    const teacherId = normalizeText(form.teacherId.value);
    const teacherOption = form.teacherId?.selectedOptions?.[0];
    const teacherName = normalizeText(teacherOption?.dataset?.name || '');
    const teacherEmail = normalizeText(teacherOption?.dataset?.email || '');
    const day = normalizeText(form.day.value);
    const area = normalizeText(form.area.value);
    const startTime = normalizeText(form.startTime.value);
    const endTime = normalizeText(form.endTime.value);
    const place = normalizeText(form.place.value);
    const notes = normalizeText(form.notes.value);

    if (!teacherId || !teacherName || !day || !area || !startTime || !endTime || !place) {
      toast('Completa docente, dÃ­a y horario.');
      return;
    }

    const payload = {
      title: teacherName,
      teacherId,
      teacherName,
      teacherEmail,
      day,
      area,
      startTime,
      endTime,
      place,
      notes,
      centerName: getCenterName(),
      updatedAt: serverTimestamp(),
      updatedBy: ACTIVE_EMAIL
    };

    try {
      if (scheduleEditorState.editingId) {
        await updateDoc(doc(DB, COLLECTIONS.schedules, scheduleEditorState.editingId), payload);
        toast('Horario actualizado.');
      } else {
        await addDoc(collection(DB, COLLECTIONS.schedules), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: ACTIVE_EMAIL
        });
        toast('Horario agregado.');
      }
      scheduleEditorState.editingId = '';
      await refreshActiveModule();
    } catch (error) {
      console.error(error);
      toast('No se pudo guardar el horario.');
    }
  });

  $('#workspace-content')?.addEventListener('submit', async (event) => {
    if (event.target.id !== 'calendar-admin-form') return;
    event.preventDefault();
    if (!canManageCalendarEvents()) return;

    const form = event.target;
    const titleInput = form.querySelector('[name="title"]');
    const locationInput = form.querySelector('[name="location"]');
    const startInput = form.querySelector('[name="startAt"]');
    const endInput = form.querySelector('[name="endAt"]');
    const descriptionInput = form.querySelector('[name="description"]');
    const title = normalizeText(titleInput?.value || '');
    const location = normalizeText(locationInput?.value || '');
    const startDateInput = normalizeText(startInput?.value || '');
    const endDateInput = normalizeText(endInput?.value || '');
    const description = normalizeText(descriptionInput?.value || '');
    const startAt = toCalendarStorageDate(startDateInput);
    const endAt = toCalendarStorageDate(endDateInput);
    const year = Number(startDateInput.slice(0, 4)) || new Date().getFullYear();

    if (!title || !startAt) {
      toast('Completa el titulo y la fecha de inicio.');
      return;
    }
    if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
      toast('La fecha fin no puede ser menor que la fecha inicio.');
      return;
    }

    const payload = {
      title,
      location,
      startAt,
      endAt: endAt || null,
      description,
      year,
      centerName: getCenterName(),
      updatedAt: serverTimestamp(),
      updatedBy: ACTIVE_EMAIL
    };

    try {
      if (calendarEditorState.editingId) {
        await updateDoc(doc(DB, COLLECTIONS.calendar, calendarEditorState.editingId), payload);
        toast('Evento actualizado.');
      } else {
        await addDoc(collection(DB, COLLECTIONS.calendar), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: ACTIVE_EMAIL
        });
        toast('Evento agregado.');
      }
      calendarEditorState.editingId = '';
      STATE.filters.calendarYear = String(year);
      await refreshActiveModule();
    } catch (error) {
      console.error(error);
      toast('No se pudo guardar el evento.');
    }
  });
}

function wireHeroActions() {
  $('#btn-hero-shift')?.addEventListener('click', () => triggerAccess('schedule'));
  $('#btn-hero-students')?.addEventListener('click', () => triggerAccess('students'));
  $('#btn-hero-attendance')?.addEventListener('click', () => triggerAccess('attendance'));
  $('#btn-hero-logs')?.addEventListener('click', () => triggerAccess('logs'));
  $('#btn-hero-carnet')?.addEventListener('click', () => triggerAccess('team'));
}

function wireBottomDock() {
  $$('.dockTab').forEach((button) => {
    button.addEventListener('click', async () => {
      const tab = button.dataset.tab || 'home';

      if (tab === 'home') {
        closeModal('modal-workspace');
        setBottomNavActive('home');
        scrollToTop();
        return;
      }

      if (tab === 'students') await openWorkspaceModule('students');
      if (tab === 'attendance') await openWorkspaceModule('attendance');
      if (tab === 'logs') await openWorkspaceModule('logs');
    });
  });
}

function isStandalone() {
  return !!window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}

function setInstallUI(visible) {
  ['btn-install', 'btn-install-2', 'btn-drawer-install'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.hidden = !visible;
  });
}

function setupInstallPrompt() {
  if (isStandalone()) {
    setInstallUI(false);
    return;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallUI(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setInstallUI(false);
    toast('La app se instalÃ³ correctamente.');
  });

  const install = async () => {
    if (!deferredInstallPrompt) {
      toast('La instalaciÃ³n aÃºn no estÃ¡ disponible.');
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    setInstallUI(false);
  };

  ['btn-install', 'btn-install-2', 'btn-drawer-install'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', install);
  });
}

async function trySkipWaiting() {
  try {
    const registration = await navigator.serviceWorker.getRegistration('./');
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }
  } catch (_) {}
  return false;
}

function wireUpdateBanner() {
  $('#btn-update')?.addEventListener('click', async () => {
    const ok = await trySkipWaiting();
    if (!ok) toast('No hay una actualizaciÃ³n lista todavÃ­a.');
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });

    const showUpdate = () => {
      const wrap = $('#pwa-update');
      if (wrap) wrap.hidden = false;
    };

    if (registration.waiting) showUpdate();

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__reloadedForSW) return;
      window.__reloadedForSW = true;
      window.location.reload();
    });
  } catch (error) {
    console.warn('No se pudo registrar el service worker:', error);
  }
}

function friendlyAuthError(code = '') {
  const map = {
    'auth/unauthorized-domain': 'El dominio no estÃ¡ autorizado en Firebase Auth.',
    'auth/popup-blocked': 'El navegador bloqueÃ³ la ventana del login.',
    'auth/cancelled-popup-request': 'La solicitud de inicio de sesiÃ³n fue cancelada.',
    'auth/popup-closed-by-user': 'Se cerrÃ³ la ventana de inicio de sesiÃ³n.',
    'auth/network-request-failed': 'La red fallÃ³. Revisa tu conexiÃ³n.'
  };
  return map[code] || 'No se pudo iniciar sesiÃ³n.';
}

async function doGoogleLogin(auth) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    await setPersistence(auth, browserLocalPersistence);

    if (isStandalone()) {
      await signInWithRedirect(auth, provider);
      return;
    }

    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error?.code === 'auth/popup-closed-by-user') return;
    toast(friendlyAuthError(error?.code));
    console.error(error);
  }
}

async function finalizeRedirectIfAny(auth) {
  try {
    await getRedirectResult(auth);
  } catch (error) {
    toast(friendlyAuthError(error?.code));
  }
}

function assertConfig(config) {
  return !!(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

async function doLogout(auth) {
  try {
    closeDrawer();
    closeAllModals();
    await signOut(auth);
  } catch (error) {
    console.error(error);
    toast('No se pudo cerrar sesiÃ³n.');
  }
}

async function mount() {
  setHubCopy();

  if (!assertConfig(firebaseConfig)) {
    show('login');
    toast('Falta configurar Firebase en app.js.');
    return;
  }

  const app = initializeApp(firebaseConfig);
  AUTH = getAuth(app);
  DB = getFirestore(app);

  try {
    await setPersistence(AUTH, browserLocalPersistence);
  } catch (error) {
    console.warn('No se pudo fijar persistencia:', error);
  }

  await finalizeRedirectIfAny(AUTH);

  $('#btn-google')?.addEventListener('click', () => doGoogleLogin(AUTH));
  $('#btn-logout')?.addEventListener('click', () => doLogout(AUTH));

  wireDrawerHandlers(AUTH);
  wireModals();
  wireSearchAndFavorites();
  bindWorkspaceModal();
  wireHeroActions();
  wireBottomDock();

  onAuthStateChanged(AUTH, async (user) => {
    if (!user) {
      CURRENT_USER = null;
      ACTIVE_EMAIL = '';
      ACTIVE_PROFILE = null;
      scheduleEditorState.editingId = '';
      scheduleEditorState.placeListEditing = false;
      scheduleEditorState.placeDraft = [];
      scheduleEditorState.areaListEditing = false;
      scheduleEditorState.areaDraft = [];
      STATE.currentModule = '';
      Object.values(STATE.data).forEach((bucket) => {
        bucket.loaded = false;
        bucket.items = [];
      });
      STATE.settings.scheduleDays.loaded = false;
      STATE.settings.scheduleDays.items = [];
      STATE.settings.schedulePlaces.loaded = false;
      STATE.settings.schedulePlaces.items = [];
      STATE.settings.scheduleAreas.loaded = false;
      STATE.settings.scheduleAreas.items = [];
      closeAllModals();
      closeDrawer();
      show('login');
      return;
    }

    const email = emailKey(user);
    const allowed = HUB.users[email];

    if (!allowed) {
      toast('Tu correo no estÃ¡ autorizado para este panel de lÃ­deres.');
      try {
        await signOut(AUTH);
      } catch (_) {}
      show('login');
      return;
    }

    CURRENT_USER = user;
    ACTIVE_EMAIL = email;
    ACTIVE_PROFILE = allowed;
    scheduleEditorState.editingId = '';
    scheduleEditorState.placeListEditing = false;
    scheduleEditorState.placeDraft = [];
    scheduleEditorState.areaListEditing = false;
    scheduleEditorState.areaDraft = [];
    STATE.recentIds = getRecentIds();
    STATE.favorites = getFavoriteIds();

    show('app');
    setDrawerProfile();
    showAppHeaderData();
    setBottomNavActive('home');
    renderButtons();
    renderFavoritesList();
    renderSearchResults('');
    updateHeroSummary();

    await prefetchCoreData();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('BUILD', BUILD);
  sanitizeUiMojibake();
  registerServiceWorker();
  setupInstallPrompt();
  wireUpdateBanner();
  setNetPill();
  mount();
});


