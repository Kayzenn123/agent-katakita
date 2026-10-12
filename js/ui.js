/* UI: daftar kata, filter, favorit, dialog NPC, deep-link, quest. */
const KatakitaUI = (() => {
  const KEY = 'katakita-v1';
  let store = { favs: [], found: [], questDone: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        store.favs = Array.isArray(d.favs) ? d.favs.filter(x => typeof x === 'string') : [];
        store.found = Array.isArray(d.found) ? d.found.filter(x => typeof x === 'string') : [];
        store.questDone = d.questDone === true;
      }
    }
  } catch { /* rusak -> default */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  const byId = id => WORDS.find(w => w.id === id);

  let q = '', langF = '', conceptF = '';
  const $ = s => document.querySelector(s);

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 2600);
  }
  async function copyText(txt, okMsg) {
    try { await navigator.clipboard.writeText(txt); toast(okMsg); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg); }
      catch { toast('Gagal menyalin. Coba manual ya, Petualang.'); }
      ta.remove();
    }
  }

  const ICONS = {
    'makan': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 9h12v2a6 6 0 0 1-12 0z" fill="currentColor"/><path d="M5 2l3 5M11 2L8 7" stroke="var(--surface-2)" stroke-width="2"/></svg>',
    'tidur': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2a6 6 0 1 0 3 11A7 7 0 0 1 11 2z" fill="currentColor"/></svg>',
    'air': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1l5 7a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M6 9a2 2 0 0 0 2 2" stroke="var(--surface-2)" stroke-width="1.6" fill="none"/></svg>',
    'rumah': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8l6-5 6 5v6H9v-4H7v4H2z" fill="currentColor"/></svg>',
    'terima kasih': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14S2 10 2 5.5A3.5 3.5 0 0 1 8 3a3.5 3.5 0 0 1 6 2.5C14 10 8 14 8 14z" fill="currentColor"/></svg>',
    'saya': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4v4H6zM4 8h8v6H4z" fill="currentColor"/></svg>',
    'istirahat': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h9v7H5v3H3z" fill="currentColor"/><path d="M5 5h5v3H5z" fill="var(--surface-2)"/></svg>',
  };
  function cardHTML(w) {
    const faved = store.favs.includes(w.id);
    const idx = WORDS.indexOf(w) + 1;
    return `<li class="card" data-id="${w.id}">
      <span class="k-ticket"><span class="k-num">No.${String(idx).padStart(2, '0')}</span><span class="k-ico">${ICONS[w.konsep] || ''}</span><span>${esc(w.konsep)}</span></span>
      <span class="k-meta">${esc(w.bahasa)}</span>
      <span class="k-kata">${esc(w.kata)}</span>
      <span class="k-arti">artinya: ${esc(w.arti)}</span>
      <span class="k-contoh">${esc(w.contoh)}</span>
      <span><button class="mini-btn k-open" data-open="${w.id}">BUKA DI PETA</button>
      <button class="mini-btn k-fav${faved ? ' faved' : ''}" data-fav="${w.id}" aria-pressed="${faved}">${faved ? '★ TERSIMPAN' : '☆ SIMPAN'}</button></span>
    </li>`;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderGrid() {
    const grid = $('#wordGrid');
    const list = WORDS.filter(w =>
      (!q || (w.kata + ' ' + w.bahasa + ' ' + w.arti + ' ' + w.contoh).toLowerCase().includes(q)) &&
      (!langF || w.bahasa === langF) && (!conceptF || w.konsep === conceptF));
    grid.innerHTML = list.map(cardHTML).join('');
    $('#emptyState').hidden = list.length > 0;
    // easter egg
    if (q.trim().toLowerCase() === 'horas' && !renderGrid._egg) {
      renderGrid._egg = true;
      KatakitaMotion.confettiBurst();
      toast('Horas! Kamu menemukan salam Batak! — Pak Peta');
    }
  }

  function renderFavs() {
    const grid = $('#favGrid'), n = store.favs.length;
    $('#favCount').textContent = n;
    $('#favEmpty').hidden = n > 0;
    grid.innerHTML = store.favs.map(id => byId(id)).filter(Boolean).map(cardHTML).join('');
  }

  function updateQuest() {
    const makanIds = WORDS.filter(w => w.konsep === 'makan').map(w => w.id);
    const n = makanIds.filter(id => store.found.includes(id)).length;
    const el = $('#questText'), box = el.closest('.quest');
    if (store.questDone || n >= 5) {
      el.textContent = 'Quest selesai! 5 kata “makan” ditemukan ★';
      box.classList.add('done');
      if (!store.questDone) { store.questDone = true; save(); KatakitaMotion.confettiBurst(); toast('Quest selesai! Pak Peta bangga padamu!'); }
    } else {
      el.textContent = `Quest: temukan 5 kata “makan” (${n}/5)`;
    }
  }

  let lastFocus = null;
  function openWord(id, fromMap) {
    const w = byId(id); if (!w) return;
    lastFocus = document.activeElement;
    $('#wcLang').textContent = w.bahasa;
    $('#wcKonsep').textContent = 'kata ' + w.konsep;
    $('#wcKata').textContent = w.kata;
    $('#wcArti').textContent = w.arti;
    $('#wcContoh').textContent = '“' + w.contoh + '”';
    const fav = store.favs.includes(id);
    const fb = $('#wcFav');
    fb.textContent = fav ? '★ TERSIMPAN' : 'SIMPAN ★';
    fb.setAttribute('aria-pressed', fav);
    fb.onclick = () => toggleFav(id);
    $('#wcCopy').onclick = () => copyText(
      `${w.kata} (${w.bahasa}) = ${w.arti}. Contoh: ${w.contoh} — via KataKita`,
      'Ringkasan kata tersalin!');
    $('#wcLink').onclick = () => {
      const url = location.origin + location.pathname + '?kata=' + encodeURIComponent(id);
      copyText(url, 'Link kata tersalin! Bagikan ke temanmu.');
    };
    $('#wordCard').hidden = false; $('#scrim').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#wcClose').focus();
    if (!store.found.includes(id)) {
      store.found.push(id); save();
      KatakitaMap.markFound(id); updateQuest();
      const idx = KatakitaMap.pinIndex(id);
      $('#pinLabel').textContent = `pin ${idx + 1} / ${KatakitaMap.pinCount()}`;
    }
  }
  function closeWord() {
    $('#wordCard').hidden = true; $('#scrim').hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function toggleFav(id) {
    const i = store.favs.indexOf(id);
    if (i >= 0) { store.favs.splice(i, 1); toast('Dihapus dari favorit.'); }
    else { store.favs.push(id); toast('Masuk kantong favorit!'); }
    save(); renderFavs(); renderGrid();
    const w = byId(id), fb = $('#wcFav');
    if (w && !$('#wordCard').hidden) {
      const fav = store.favs.includes(id);
      fb.textContent = fav ? '★ TERSIMPAN' : 'SIMPAN ★';
      fb.setAttribute('aria-pressed', fav);
    }
  }

  function buildChips() {
    const lc = $('#langChips');
    lc.innerHTML = `<button aria-pressed="true" data-v="">Semua bahasa</button>` +
      LANGS.map(l => `<button aria-pressed="false" data-v="${esc(l)}">${esc(l)}</button>`).join('');
    lc.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      lc.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); langF = b.dataset.v; renderGrid();
    };
    const cc = $('#conceptChips');
    cc.innerHTML = `<button aria-pressed="true" data-v="">Semua arti</button>` +
      CONCEPTS.map(c => `<button aria-pressed="false" data-v="${esc(c)}">${esc(c)}</button>`).join('');
    cc.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      cc.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); conceptF = b.dataset.v; renderGrid();
    };
  }

  function init() {
    buildChips(); renderGrid(); renderFavs(); updateQuest();
    KatakitaMap.setFound(store.found);
    $('#q').addEventListener('input', e => { q = e.target.value.toLowerCase(); renderGrid(); });
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-open]');
      if (o) { KatakitaMap.focusPin(KatakitaMap.pinIndex(o.dataset.open)); openWord(o.dataset.open); return; }
      const f = e.target.closest('[data-fav]');
      if (f) toggleFav(f.dataset.fav);
    });
    $('#wcClose').onclick = closeWord;
    $('#scrim').onclick = closeWord;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#wordCard').hidden) closeWord(); });
    // pager pin
    let cur = 0;
    const show = i => {
      cur = (i + KatakitaMap.pinCount()) % KatakitaMap.pinCount();
      KatakitaMap.focusPin(cur);
      $('#pinLabel').textContent = `pin ${cur + 1} / ${KatakitaMap.pinCount()}`;
    };
    $('#pinPrev').onclick = () => show(cur - 1);
    $('#pinNext').onclick = () => show(cur + 1);
    // favorit actions
    $('#copyFav').onclick = () => {
      if (!store.favs.length) return toast('Favorit masih kosong, Petualang.');
      copyText(store.favs.map(id => { const w = byId(id); return `• ${w.kata} (${w.bahasa}) = ${w.arti}`; }).join('\n'),
        'Daftar favorit tersalin!');
    };
    $('#dlFav').onclick = () => {
      if (!store.favs.length) return toast('Favorit masih kosong, Petualang.');
      const blob = new Blob([JSON.stringify(store.favs.map(byId), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'katakita-favorit.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('JSON favorit terunduh!');
    };
    // deep-link
    const params = new URLSearchParams(location.search);
    const dk = params.get('kata');
    if (dk && byId(dk)) {
      KatakitaMap.focusPin(KatakitaMap.pinIndex(dk));
      setTimeout(() => { document.getElementById('peta').scrollIntoView(); openWord(dk); }, 600);
    }
    // validasi param tak dikenal -> diam (bukan error)
  }

  return { init, openWord, toast, store };
})();
