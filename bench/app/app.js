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
  if (state.view === 'reader') { root.innerHTML = renderReader(); wire(); return; }
  root.innerHTML = renderLibrary();
  wire();
}

function renderReader() {
  const item = state.items.find(i => i.id === state.openId);
  if (!item) return '<p>Not found</p>';
  return `
    <div data-testid="reader" class="reader">
      <a href="#" data-testid="reader-back" class="back">&laquo; back</a>
      <h1 data-testid="reader-title">${esc(item.title)}</h1>
      <p class="byline">${esc(item.author)} &middot; ${esc(item.added)}</p>
      ${item.text.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}
    </div>`;
}

function renderLibrary() {
  const rows = visible();
  let body = '';

  if (!state.loaded && !state.failed) {
    body = `<div data-testid="state-loading" class="msg">Loading...</div>`;
  } else if (state.failed) {
    body = `<div data-testid="state-error" class="msg">
      Error loading data.
      <button data-testid="retry" class="btn">Retry</button>
    </div>`;
  } else if (state.items.length === 0) {
    body = `<div data-testid="state-empty" class="msg">Nothing here.</div>`;
  } else if (rows.length === 0) {
    body = `<div data-testid="state-noresults" class="msg">Nothing here.</div>`;
  } else {
    body = `
      <table class="tbl">
        <tr>
          <th>Title</th><th>Author</th><th>Status</th><th>Tags</th>
          <th>Rating</th><th>Added</th><th></th>
        </tr>
        ${rows.map(renderRow).join('')}
      </table>`;
  }

  const count = rows.length === 1 ? '1 item' : `${rows.length} items`;

  return `
    <div class="card">
      <div class="header">
        <h1>📚 Marginalia</h1>
        <button data-testid="theme-toggle" class="theme">🌙</button>
      </div>

      <div class="controls">
        <input data-testid="search" id="search" class="inp"
               placeholder="Search" value="${esc(state.search)}">
        <select data-testid="filter-status" id="status" class="sel">
          <option value="all">all</option>
          ${STATUSES.map(s => `<option value="${s}"${state.status === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        <select data-testid="sort" id="sort" class="sel">
          <option value="added"${state.sort === 'added' ? ' selected' : ''}>added</option>
          <option value="title"${state.sort === 'title' ? ' selected' : ''}>title</option>
        </select>
        <span data-testid="item-count" class="count">${count}</span>
      </div>

      ${body}
      ${state.noteFor !== null ? renderModal() : ''}
    </div>`;
}

function renderRow(i) {
  const on = state.starred.has(i.id);
  return `
    <tr data-testid="item-row" data-id="${i.id}" class="row">
      <td data-testid="item-title" class="t">${esc(i.title)}</td>
      <td class="a">${esc(i.author)}</td>
      <td><span class="badge">${esc(i.status)}</span></td>
      <td class="tags">${i.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</td>
      <td>${i.rating === null ? '' : '★'.repeat(i.rating)}</td>
      <td class="d">${esc(i.added)}</td>
      <td class="acts">
        <a href="#" data-testid="star" data-id="${i.id}"
           aria-pressed="${on}" class="star">${on ? '⭐' : '☆'}</a>
        <a href="#" data-testid="note-open" data-id="${i.id}" class="note">📝</a>
      </td>
    </tr>`;
}

function renderModal() {
  return `
    <div class="overlay">
      <div data-testid="modal" class="modal">
        <h2>Add note</h2>
        <textarea data-testid="note-input" id="note" class="ta"></textarea>
        ${state.noteError ? `<div data-testid="note-error" class="err">Note cannot be empty</div>` : ''}
        <div class="modal-acts">
          <button data-testid="note-cancel" class="btn">Cancel</button>
          <button data-testid="note-save" class="btn primary">Save</button>
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

  document.querySelectorAll('[data-testid="item-row"]').forEach(tr => {
    tr.onclick = (e) => {
      if (e.target.closest('[data-testid="star"]') ||
          e.target.closest('[data-testid="note-open"]')) return;
      state.openId = +tr.dataset.id;
      state.view = 'reader';
      render();
    };
  });

  document.querySelectorAll('[data-testid="star"]').forEach(a => {
    a.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = +a.dataset.id;
      state.starred.has(id) ? state.starred.delete(id) : state.starred.add(id);
      render();
    };
  });

  document.querySelectorAll('[data-testid="note-open"]').forEach(a => {
    a.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      state.noteFor = +a.dataset.id;
      state.noteError = false;
      render();
    };
  });

  const back = document.querySelector('[data-testid="reader-back"]');
  if (back) back.onclick = (e) => {
    e.preventDefault(); state.view = 'library'; state.openId = null; render();
  };

  const retry = document.querySelector('[data-testid="retry"]');
  if (retry) retry.onclick = () => load();

  const cancel = document.querySelector('[data-testid="note-cancel"]');
  if (cancel) cancel.onclick = () => { state.noteFor = null; state.noteError = false; render(); };

  const save = document.querySelector('[data-testid="note-save"]');
  if (save) save.onclick = () => {
    const v = $('note').value;
    if (!v.trim()) { state.noteError = true; render(); return; }
    state.noteFor = null; state.noteError = false; render();
  };

  const theme = document.querySelector('[data-testid="theme-toggle"]');
  if (theme) theme.onclick = () => {
    const next = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.noteFor !== null) {
    state.noteFor = null; state.noteError = false; render();
  }
});

const saved = localStorage.getItem('theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);

load();
