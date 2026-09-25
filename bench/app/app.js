import { ITEMS, STATUSES } from './data.js';

const qs = new URLSearchParams(location.search);
const forced = qs.get('state') || 'populated';

const state = {
  items: [],
  loaded: false,
  failed: false,
  search: forced === 'noresults' ? 'zzzz' : '',
  status: 'all',
  sort: 'added',
  starred: new Set(),
  view: 'library',
  openId: null,
  noteFor: null,
  noteError: false,
};

window.__bench = state;

const $ = (id) => document.getElementById(id);

// One icon set, one stroke weight, sized from the type scale. Emoji render
// differently per platform and can't be recolored or aligned reliably.
const ICON = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  star: '<path d="M12 2.7l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.5 6.2 20.6l1.1-6.5L2.6 9.5l6.5-.9z"/>',
  note: '<path d="M11 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/><path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6l-4 1 1-4z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  filterOff: '<path d="M3 4h18l-7 8v7l-4-2v-5z"/><path d="M2 2l20 20"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
};

const icon = (name, size = 16) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

function load() {
  state.loaded = false;
  state.failed = false;
  render();
  if (forced === 'loading') return;
  setTimeout(() => {
    if (forced === 'error') { state.failed = true; }
    else { state.items = forced === 'empty' ? [] : ITEMS.slice(); state.loaded = true; }
    render();
  }, 400);
}

function visible() {
  let out = state.items.slice();
  const q = state.search.trim().toLowerCase();
  if (q) out = out.filter(i =>
    i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q));
  if (state.status !== 'all') out = out.filter(i => i.status === state.status);
  out.sort(state.sort === 'title'
    ? (a, b) => a.title.localeCompare(b.title)
    : (a, b) => b.added.localeCompare(a.added));
  return out;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function render() {
  const root = $('root');
  root.innerHTML = state.view === 'reader' ? renderReader() : renderLibrary();
  wire();
  // Body scroll lock while the modal is open, compensating for scrollbar width so
  // the page doesn't shift sideways as it locks.
  const open = state.noteFor !== null;
  const sbw = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = open ? 'hidden' : '';
  document.body.style.paddingRight = open && sbw > 0 ? `${sbw}px` : '';
}

function renderReader() {
  const item = state.items.find(i => i.id === state.openId);
  if (!item) return '<p>Not found</p>';
  return `
    <div class="shell">
      <main id="main" data-testid="reader" class="reader enter">
        <button data-testid="reader-back" class="btn btn-ghost btn-back">
          ${icon('back')}<span>All reading</span>
        </button>
        <article>
          <p class="eyebrow">${esc(item.status)}</p>
          <h1 data-testid="reader-title">${esc(item.title)}</h1>
          <p class="byline">${esc(item.author)} &middot; added ${esc(item.added)}</p>
          <div class="prose">
            ${item.text.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}
          </div>
        </article>
      </main>
    </div>`;
}

function renderLibrary() {
  const rows = visible();
  const count = rows.length === 1 ? '1 item' : `${rows.length} items`;
  let body;

  if (!state.loaded && !state.failed) {
    body = renderSkeleton();
  } else if (state.failed) {
    body = `
      <div data-testid="state-error" role="alert" class="state state-danger">
        ${icon('alert', 20)}
        <h2>Couldn't load your library</h2>
        <p>The request didn't come back. Nothing you've saved was lost.</p>
        <button data-testid="retry" class="btn btn-primary">Try again</button>
      </div>`;
  } else if (state.items.length === 0) {
    // First-run empty: teach, and offer the action that fills it.
    body = `
      <div data-testid="state-empty" class="state">
        ${icon('inbox', 20)}
        <h2>Nothing saved yet</h2>
        <p>Articles and books you add will collect here, with whatever you scribble
           in the margins.</p>
        <button class="btn btn-primary">Add your first item</button>
      </div>`;
  } else if (rows.length === 0) {
    // Distinct from first-run: they have items, the filter is just too narrow.
    body = `
      <div data-testid="state-noresults" class="state">
        ${icon('filterOff', 20)}
        <h2>No matches</h2>
        <p>Nothing in your ${state.items.length} items matches
           ${state.search.trim() ? `&ldquo;${esc(state.search.trim())}&rdquo;` : 'this filter'}.</p>
        <button id="clear" class="btn">Clear filters</button>
      </div>`;
  } else {
    body = `
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">Status</th>
              <th scope="col">Tags</th>
              <th scope="col" class="num">Rating</th>
              <th scope="col">Added</th>
              <th scope="col"><span class="sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>${rows.map(renderRow).join('')}</tbody>
        </table>
      </div>`;
  }

  return `
    <div class="shell">
      <header class="topbar">
        <div class="brand">${icon('book', 20)}<span>Marginalia</span></div>
        <button data-testid="theme-toggle" class="btn btn-icon"
                aria-label="Switch to dark theme" title="Switch theme">
          ${icon('moon')}
        </button>
      </header>

      <main id="main">
        <div class="toolbar">
          <div class="field field-search">
            <label for="search" class="sr">Search by title or author</label>
            ${icon('search')}
            <input data-testid="search" id="search" type="search"
                   placeholder="e.g. Quiet Interfaces" value="${esc(state.search)}">
          </div>
          <div class="field">
            <label for="status">Status</label>
            <select data-testid="filter-status" id="status">
              <option value="all">All</option>
              ${STATUSES.map(s =>
                `<option value="${s}"${state.status === s ? ' selected' : ''}>${cap(s)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="sort">Sort</label>
            <select data-testid="sort" id="sort">
              <option value="added"${state.sort === 'added' ? ' selected' : ''}>Newest</option>
              <option value="title"${state.sort === 'title' ? ' selected' : ''}>Title</option>
            </select>
          </div>
          <p data-testid="item-count" class="count" aria-live="polite">${count}</p>
        </div>
        ${body}
      </main>
      ${state.noteFor !== null ? renderModal() : ''}
    </div>`;
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function renderSkeleton() {
  // Matches the real row geometry, so there's no jump when data lands.
  const cell = (w) => `<td><span class="sk" style="width:${w}"></span></td>`;
  return `
    <div data-testid="state-loading" class="table-wrap" aria-busy="true">
      <span class="sr">Loading your library</span>
      <table class="tbl">
        <tbody>
          ${Array.from({ length: 6 }, () => `
            <tr class="row">
              ${cell('72%')}${cell('60%')}${cell('48px')}${cell('80%')}
              ${cell('40px')}${cell('64px')}${cell('44px')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderRow(i) {
  const on = state.starred.has(i.id);
  const stars = i.rating === null
    ? `<span class="muted" title="Not rated">—</span>`
    : `<span title="${i.rating} of 5">${'★'.repeat(i.rating)}<span
         class="ghost">${'★'.repeat(5 - i.rating)}</span></span>`;
  return `
    <tr data-testid="item-row" data-id="${i.id}" class="row" tabindex="0"
        role="button" aria-label="Open ${esc(i.title)}">
      <td data-label="Title" data-testid="item-title" class="c-title">${esc(i.title)}</td>
      <td data-label="Author" class="c-author">${esc(i.author)}</td>
      <td data-label="Status"><span class="badge badge-${i.status}">${cap(i.status)}</span></td>
      <td data-label="Tags" class="c-tags">${
        i.tags.length
          ? i.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')
          : `<span class="muted">—</span>`}</td>
      <td data-label="Rating" class="c-rating num">${stars}</td>
      <td data-label="Added" class="c-added">${esc(i.added)}</td>
      <td class="c-acts">
        <button data-testid="star" data-id="${i.id}" class="btn btn-icon btn-star"
                aria-pressed="${on}" aria-label="Star ${esc(i.title)}"
                title="${on ? 'Unstar' : 'Star'}">${icon('star')}</button>
        <button data-testid="note-open" data-id="${i.id}" class="btn btn-icon"
                aria-label="Add a note to ${esc(i.title)}"
                title="Add note">${icon('note')}</button>
      </td>
    </tr>`;
}

function renderModal() {
  const item = state.items.find(i => i.id === state.noteFor);
  return `
    <div class="scrim" data-scrim>
      <div data-testid="modal" class="modal enter" role="dialog" aria-modal="true"
           aria-labelledby="mtitle">
        <h2 id="mtitle">Add a note</h2>
        <p class="modal-sub">${esc(item ? item.title : '')}</p>
        <div class="field field-block">
          <label for="note">Your note</label>
          <textarea data-testid="note-input" id="note" rows="4"
            placeholder="What stuck with you?"
            aria-describedby="${state.noteError ? 'note-err' : ''}"
            aria-invalid="${state.noteError}"></textarea>
          ${state.noteError
            ? `<p data-testid="note-error" id="note-err" class="err">
                 ${icon('alert', 14)} A note needs some text before it can be saved.</p>`
            : ''}
        </div>
        <div class="modal-acts">
          <button data-testid="note-cancel" class="btn">Cancel</button>
          <button data-testid="note-save" class="btn btn-primary">Save note</button>
        </div>
      </div>
    </div>`;
}

function wire() {
  const search = $('search');
  if (search) {
    search.oninput = (e) => {
      state.search = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const s = $('search');
      if (s) { s.focus(); s.setSelectionRange(pos, pos); }
    };
  }
  const status = $('status');
  if (status) status.onchange = (e) => { state.status = e.target.value; render(); };
  const sort = $('sort');
  if (sort) sort.onchange = (e) => { state.sort = e.target.value; render(); };

  const clear = $('clear');
  if (clear) clear.onclick = () => {
    state.search = ''; state.status = 'all'; render();
  };

  const openItem = (tr) => {
    state.openId = +tr.dataset.id; state.view = 'reader'; render();
  };
  document.querySelectorAll('[data-testid="item-row"]').forEach(tr => {
    tr.onclick = (e) => {
      if (e.target.closest('[data-testid="star"]') ||
          e.target.closest('[data-testid="note-open"]')) return;
      openItem(tr);
    };
    // Rows are operable by keyboard, not just mouse.
    tr.onkeydown = (e) => {
      if (e.target !== tr) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(tr); }
    };
  });

  document.querySelectorAll('[data-testid="star"]').forEach(b => {
    b.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = +b.dataset.id;
      state.starred.has(id) ? state.starred.delete(id) : state.starred.add(id);
      render();
    };
  });

  document.querySelectorAll('[data-testid="note-open"]').forEach(b => {
    b.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      state.noteFor = +b.dataset.id;
      state.noteError = false;
      lastFocus = b.dataset.id;
      render();
      const ta = $('note'); if (ta) ta.focus();
    };
  });

  const back = document.querySelector('[data-testid="reader-back"]');
  if (back) back.onclick = () => {
    state.view = 'library'; state.openId = null; render();
  };

  const retry = document.querySelector('[data-testid="retry"]');
  if (retry) retry.onclick = () => load();

  const closeModal = () => {
    state.noteFor = null; state.noteError = false; render();
    // Focus returns to the control that opened the dialog.
    const back = document.querySelector(`[data-testid="note-open"][data-id="${lastFocus}"]`);
    if (back) back.focus();
  };

  const cancel = document.querySelector('[data-testid="note-cancel"]');
  if (cancel) cancel.onclick = closeModal;

  const save = document.querySelector('[data-testid="note-save"]');
  if (save) save.onclick = () => {
    const v = $('note').value;
    if (!v.trim()) {
      state.noteError = true; render();
      const ta = $('note'); if (ta) ta.focus();
      return;
    }
    closeModal();
  };

  const scrim = document.querySelector('[data-scrim]');
  if (scrim) scrim.onmousedown = (e) => { if (e.target === scrim) closeModal(); };

  const theme = document.querySelector('[data-testid="theme-toggle"]');
  if (theme) {
    const dark = localStorage.getItem('theme') === 'dark';
    theme.innerHTML = icon(dark ? 'sun' : 'moon');
    theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    theme.onclick = () => {
      const next = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      render();
    };
  }

  trapFocus();
}

let lastFocus = null;

// Keep Tab inside the dialog while it's open.
function trapFocus() {
  const modal = document.querySelector('[data-testid="modal"]');
  if (!modal) { document.onkeydown = globalKeys; return; }
  document.onkeydown = (e) => {
    globalKeys(e);
    if (e.key !== 'Tab') return;
    const f = [...modal.querySelectorAll('button,textarea,input,select,a[href]')]
      .filter(el => !el.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
}

function globalKeys(e) {
  if (e.key === 'Escape' && state.noteFor !== null) {
    state.noteFor = null; state.noteError = false; render();
    const back = document.querySelector(`[data-testid="note-open"][data-id="${lastFocus}"]`);
    if (back) back.focus();
  }
}

// Key handling is installed by trapFocus() on every render, so no separate
// listener here — it would double-fire Escape.

load();
